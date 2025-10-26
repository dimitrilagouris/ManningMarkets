import json
import os
import threading
from decimal import Decimal
from typing import Dict
from django.conf import settings
from django.db import transaction
from .models import Orders, Trades, Positions
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

        # --- Position validation for sell orders - making sure a user actually has the posisions they want to sell ---
        if order_type.upper() == 'SELL':
            self._validate_sell_position(user, event, share_type, quantity)

        # --- Wallet balance validation for buy orders - making sure user has sufficient funds ---
        if order_type.upper() == 'BUY':
            self._validate_wallet_balance(user, event, share_type, quantity, price)

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

        # --- Update Market Volume ---
        self.update_market_volume_from_trades(trades, event)

        # --- Update Positions ---
        self.update_positions_from_trades(trades)

        # --- Update Wallet Balances ---
        self.update_wallet_balances_from_trades(trades)

        # --- Update Event Price ---
        self.update_event_price_from_trades(trades, event)

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

    def update_positions_from_trades(self, trades):
        print(f"DEBUG: update_positions_from_trades called with {len(trades)} trades")
        
        for trade in trades:
            print(f"DEBUG: Processing trade {trade.id} - taker: {trade.taker_order_id.user.id} {trade.taker_order_id.order_type} {trade.taker_order_id.share_type}, maker: {trade.maker_order_id.user.id} {trade.maker_order_id.order_type} {trade.maker_order_id.share_type}, quantity: {trade.quantity_filled}, price: {trade.price}")
            
            # Update taker position
            print(f"DEBUG: Updating taker position...")
            self._update_user_position(
                user=trade.taker_order_id.user,
                event=trade.taker_order_id.event,
                share_type=trade.taker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.taker_order_id.order_type == 'BUY'
            )
            
            # Update maker position
            print(f"DEBUG: Updating maker position...")
            self._update_user_position(
                user=trade.maker_order_id.user,
                event=trade.maker_order_id.event,
                share_type=trade.maker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.maker_order_id.order_type == 'BUY'
            )

    def _update_user_position(self, user, event, share_type, quantity, price, is_buy):
        # Update a single user's position for a specific event and share type
        
        # Convert trade price (always YES price) to the correct price for this share type
        if share_type == "YES":
            share_price = price  # Trade price is already YES price
        else:  # NO
            share_price = Decimal('1') - price  # Convert YES price to NO price
        
        print(f"DEBUG: _update_user_position called - user: {user.id}, event: {event.id}, share_type: {share_type}, quantity: {quantity}, trade_yes_price: {price}, share_price: {share_price}, is_buy: {is_buy}")
        
        # Determine the position side and quantity change
        if is_buy:
            # Buying shares - add to position
            quantity_change = quantity
        else:
            # Selling shares - subtract from position
            quantity_change = -quantity

        # Get or create position
        position, created = Positions.objects.get_or_create(
            user=user,
            event=event,
            side=share_type,
            defaults={'quantity': 0, 'avg_price': Decimal('0')}
        )

        if created:
            # New position
            print(f"DEBUG: Creating new position - quantity: {quantity_change}, share_price: {share_price}")
            position.quantity = quantity_change
            position.avg_price = share_price
        else:
            # Existing position - update with weighted average
            print(f"DEBUG: Updating existing position - current: {position.quantity} @ {position.avg_price}")
            if position.quantity + quantity_change == 0:
                # Position closed
                print(f"DEBUG: Position closed")
                position.quantity = 0
                position.avg_price = 0
            elif position.quantity + quantity_change > 0:
                # Position increased or maintained
                if is_buy:
                    # Calculate weighted average price
                    total_cost = (position.quantity * position.avg_price) + (Decimal(quantity) * share_price)
                    position.quantity += quantity_change
                    position.avg_price = total_cost / position.quantity
                    print(f"DEBUG: Buy - new quantity: {position.quantity}, new avg_price: {position.avg_price}")
                else:
                    # Selling - just reduce quantity, keep avg price
                    position.quantity += quantity_change
                    print(f"DEBUG: Sell - new quantity: {position.quantity}, keeping avg_price: {position.avg_price}")
            else:
                # Position went negative - this shouldn't happen in a proper system
                # But we'll handle it by setting to 0
                print(f"DEBUG: Position went negative, setting to 0")
                position.quantity = 0
                position.avg_price = Decimal('0')

        position.save()

    def _validate_sell_position(self, user, event, share_type, quantity):

        try:
            # Get the user's current position for this event and share type
            position = Positions.objects.get(
                user=user,
                event=event,
                side=share_type.upper()
            )
            available_quantity = position.quantity
        except Positions.DoesNotExist:
            # User has no position in this share type
            available_quantity = 0
        
        # Check if user has enough shares to sell
        if available_quantity < quantity:
            error_msg = f"Insufficient position to sell {quantity} {share_type} shares. Available: {available_quantity} shares"
            raise ValueError(error_msg)
        
        print(f"DEBUG: Position validation passed - User {user.id} has {available_quantity} {share_type} shares, attempting to sell {quantity}")

    def _validate_wallet_balance(self, user, event, share_type, quantity, price):
        """
        Validate that a user has sufficient wallet balance to place a buy order.
        Raises ValueError if the user doesn't have enough funds.
        """
        print(f"DEBUG: _validate_wallet_balance called - user: {user.id}, event: {event.id}, share_type: {share_type}, quantity: {quantity}, price: {price}")
        
        # Calculate the cost based on share type
        price_decimal = Decimal(str(price))  # Convert price to Decimal
        if share_type.upper() == "YES":
            cost_per_share = price_decimal
        else:  # NO
            cost_per_share = Decimal('1') - price_decimal
        
        total_cost = cost_per_share * quantity
        print(f"DEBUG: Calculated cost - cost_per_share: {cost_per_share}, total_cost: {total_cost}")
        
        # Get user's wallet balance
        try:
            from .models import Wallet
            wallet = Wallet.objects.get(profile=user)
            current_balance = wallet.points_balance
            print(f"DEBUG: Current wallet balance: {current_balance}")
        except Wallet.DoesNotExist:
            raise ValueError("User wallet not found. Please contact support.")
        
        # Check if user has enough funds
        if current_balance < total_cost:
            raise ValueError(
                f"Insufficient wallet balance. Order cost: ${total_cost:.2f}, Available: ${current_balance:.2f}"
            )
        
        print(f"DEBUG: Wallet validation passed - User {user.id} has ${current_balance:.2f}, order cost: ${total_cost:.2f}")

    def update_wallet_balances_from_trades(self, trades):
        """
        Update wallet balances for all users involved in trades.
        Deducts money from buyers and adds money to sellers.
        """
        print(f"DEBUG: update_wallet_balances_from_trades called with {len(trades)} trades")
        
        for trade in trades:
            print(f"DEBUG: Processing wallet update for trade {trade.id}")
            
            # Update taker wallet
            self._update_user_wallet(
                user=trade.taker_order_id.user,
                event=trade.taker_order_id.event,
                share_type=trade.taker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.taker_order_id.order_type == 'BUY'
            )
            
            # Update maker wallet
            self._update_user_wallet(
                user=trade.maker_order_id.user,
                event=trade.maker_order_id.event,
                share_type=trade.maker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.maker_order_id.order_type == 'BUY'
            )

    def _update_user_wallet(self, user, event, share_type, quantity, price, is_buy):
        """
        Update a single user's wallet balance for a trade.
        """
        # Calculate the cost based on share type
        price_decimal = Decimal(str(price))  # Convert price to Decimal
        if share_type == "YES":
            cost_per_share = price_decimal  # Trade price is already YES price
        else:  # NO
            cost_per_share = Decimal('1') - price_decimal  # Convert YES price to NO price
        
        total_cost = cost_per_share * quantity
        
        print(f"DEBUG: _update_user_wallet called - user: {user.id}, event: {event.id}, share_type: {share_type}, quantity: {quantity}, cost_per_share: {cost_per_share}, total_cost: {total_cost}, is_buy: {is_buy}")
        
        # Get user's wallet
        try:
            from .models import Wallet
            wallet = Wallet.objects.get(profile=user)
        except Wallet.DoesNotExist:
            print(f"ERROR: Wallet not found for user {user.id}")
            return
        
        # Update wallet balance
        if is_buy:
            # Buying shares - deduct money
            wallet.points_balance -= total_cost
            print(f"DEBUG: Deducting ${total_cost:.2f} from user {user.id} wallet. New balance: ${wallet.points_balance:.2f}")
        else:
            # Selling shares - add money
            wallet.points_balance += total_cost
            print(f"DEBUG: Adding ${total_cost:.2f} to user {user.id} wallet. New balance: ${wallet.points_balance:.2f}")
        
        wallet.save()
        print(f"DEBUG: Updated wallet for user {user.id} - new balance: ${wallet.points_balance:.2f}")

    def update_event_price_from_trades(self, trades, event):
        """
        Update the event's price field to reflect the last traded price.
        Uses the most recent trade's YES price as the event price.
        """
        if not trades:
            return
        
        # Get the most recent trade (last in the list)
        last_trade = trades[-1]
        
        # The trade price is already standardized to YES price
        new_price = last_trade.price
        
        # Update the event's price field
        event.price = new_price
        event.save(update_fields=['price'])
        

    def update_market_volume_from_trades(self, trades, event):
        if not trades:
            return
                
        total_volume = 0
        for trade in trades:
            volume_added = trade.quantity_filled
            total_volume += volume_added
            print(f"DEBUG: Trade {trade.id} adds {volume_added} to volume")
        
        # Update the market's volume
        market = event.market
        market.volume += total_volume
        market.save()