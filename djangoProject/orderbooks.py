import json
import os
import threading
from decimal import Decimal
from typing import Dict
from django.conf import settings
from django.db import transaction
from .models import Orders, Trades
from .matching_engine import MatchingEngine
from .notifier import broadcast_orderbook_snapshot


class Orderbooks:

    # Orderbooks is a class that manages all of the orderbooks across all
    # of the markets/events in the system. It distributes orders to the
    # correct matching engine based on the event id. It isn't actually
    # responsible for the execution of trades.

    def __init__(self):
        self.orderbooks: Dict[str, MatchingEngine] = {}
        self.lock = threading.Lock()
        self.persistence_dir = getattr(settings, 'ORDERBOOK_PERSISTENCE_DIR', 'orderbook_data')
        os.makedirs(self.persistence_dir, exist_ok=True)
        # self.load_all_orderbooks_from_db()

    # Submit order just routes the order information/data to the right matching engine
    @transaction.atomic
    def submit_order(self, user, event, order_type: str, share_type: str, quantity: int, price: float) -> dict:
        # --- Basic error checks ---
        if order_type.upper() not in ['BUY', 'SELL']:
            raise ValueError("Invalid order type. Must be 'BUY' or 'SELL'")
        if share_type.upper() not in ['YES', 'NO']:
            raise ValueError("Invalid share type. Must be 'YES' or 'NO'")
        if not 0.01 <= price <= 0.99:
            raise ValueError("Price must be between 0.01 and 0.99")
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")

        orderbook_key = str(event.id)
        orderbook = self.get_orderbook(orderbook_key)

        # --- Create the order object ---
        order = Orders(
            user=user,
            event=event,
            order_type=order_type.upper(),
            share_type=share_type.upper(),
            amount=Decimal(quantity),
            remaining_quantity=Decimal(quantity),  # Upon creation, remaining_quantity = amount
            price=Decimal(price),
        )
        order.save()  # Save to DB before passing to matching engine

        # --- Pass order into matching engine ---
        print(f"DEBUG: About to call orderbook.add_order for {order.order_type} {order.share_type} {order.price:.4f}")
        trades, modified_orders = orderbook.add_order(order)
        print(f"DEBUG: orderbook.add_order returned {len(trades)} trades")

        # --- Database Persistence ---
        # Save executed trades
        for trade in trades:
            trade.save()

        # Save modified orders (taker and maker)
        for modified_order in modified_orders:
            modified_order.save(update_fields=['status', 'remaining_quantity'])

        # --- Broadcast Full Orderbook Snapshot ---
        self.broadcast_full_orderbook(event)

        # --- Return structured JSON response ---
        result = {
            'order_id': order.id,
            'status': order.status,
            'trades_executed': len(trades),
            'trades': [
                {
                    'trade_id': trade.id,
                    'price': float(trade.price),
                    'quantity': float(trade.quantity_filled),
                    'maker_order_id': trade.maker_order_id.id,
                    'taker_order_id': trade.taker_order_id.id,
                    'timestamp': trade.created_at.isoformat() if trade.created_at else None
                }
                for trade in trades
            ],
            'modified_orders': [
                {
                    'order_id': mod_order.id,
                    'status': mod_order.status,
                    'remaining_quantity': float(mod_order.remaining_quantity)
                }
                for mod_order in modified_orders
            ]
        }
        return result


    def get_orderbook(self, event_id: str) -> MatchingEngine:

        with self.lock:
            if event_id not in self.orderbooks:
                self.orderbooks[event_id] = MatchingEngine(event_id)
            return self.orderbooks[event_id]

    def broadcast_full_orderbook(self, event):

        # 1. GET YES SHARE ORDERS
        yes_bids = list(
            Orders.objects.filter(
                event=event, order_type="BUY", share_type="YES", remaining_quantity__gt=0
            )
            .values("price", "remaining_quantity")
        )

        yes_asks = list(
            Orders.objects.filter(
                event=event, order_type="SELL", share_type="YES", remaining_quantity__gt=0
            )
            .values("price", "remaining_quantity")
        )

        # 2. GET RAW NO SHARE ORDERS
        # A SELL NO order is equivalent to a BUY YES order (BIDS side).
        no_bids_raw = list(
            Orders.objects.filter(
                event=event, order_type="SELL", share_type="NO", remaining_quantity__gt=0
            )
            .values("price", "remaining_quantity")
        )

        # A BUY NO order is equivalent to a SELL YES order (ASKS side).
        no_asks_raw = list(
            Orders.objects.filter(
                event=event, order_type="BUY", share_type="NO", remaining_quantity__gt=0
            )
            .values("price", "remaining_quantity")
        )

        # 3. PRICE TRANSFORMATION: P_YES = 1 - P_NO

        # Transform SELL NO to YES BIDS (Destination: BIDS)
        no_bids_transformed = [
            {
                # Use round() on the resulting float
                "price": round(1.0 - float(order["price"]), 2),
                "remaining_quantity": order["remaining_quantity"],
            }
            for order in no_bids_raw
        ]

        # Transform BUY NO to YES ASKS (Destination: ASKS)
        no_asks_transformed = [
            {
                # Use round() on the resulting float
                "price": round(1.0 - float(order["price"]), 2),
                "remaining_quantity": order["remaining_quantity"],
            }
            for order in no_asks_raw
        ]


        # 4. COMBINE ORDERS
        # BIDS = YES BIDS + Transformed SELL NO orders
        bids_combined = yes_bids + no_bids_transformed

        # ASKS = YES ASKS + Transformed BUY NO orders
        asks_combined = yes_asks + no_asks_transformed
        
        # 5. AGGREGATE QUANTITY BY PRICE LEVEL
        
        # Aggregate Bids
        aggregated_bids_map = {}
        for order in bids_combined:
            price = round(float(order["price"]), 2) 
            # Use float conversion for remaining_quantity before summing
            quantity = float(order["remaining_quantity"]) 
            
            # Sum quantity for the rounded price level
            aggregated_bids_map[price] = aggregated_bids_map.get(price, 0.0) + quantity
            
        # Convert aggregated map back to list format [{"price": p, "quantity": q}, ...]
        bids_aggregated = [
            {"price": price, "quantity": quantity}
            for price, quantity in aggregated_bids_map.items()
        ]

        # Aggregate Asks
        aggregated_asks_map = {}
        for order in asks_combined:
            price = round(float(order["price"]), 2)
            quantity = float(order["remaining_quantity"])
            aggregated_asks_map[price] = aggregated_asks_map.get(price, 0.0) + quantity

        asks_aggregated = [
            {"price": price, "quantity": quantity}
            for price, quantity in aggregated_asks_map.items()
        ]
        
        # 6. SORT THE AGGREGATED LISTS

        # BIDS must be sorted descending by price (highest price first)
        bids_sorted = sorted(
            bids_aggregated, key=lambda x: x["price"], reverse=True
        )

        # ASKS must be sorted ascending by price (lowest price first)
        asks_sorted = sorted(
            asks_aggregated, key=lambda x: x["price"], reverse=False
        )

        # 7. BUILD THE SNAPSHOT
        snapshot = {
            "event_id": event.id,
            "type": "orderbook_snapshot",
            "bids": bids_sorted, # Already aggregated and sorted
            "asks": asks_sorted, # Already aggregated and sorted
        }

        # Assuming broadcast_orderbook_snapshot is defined elsewhere
        broadcast_orderbook_snapshot(event.id, snapshot)
