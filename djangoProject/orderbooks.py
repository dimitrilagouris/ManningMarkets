import json
import os
import threading
from decimal import Decimal
from typing import Dict
from django.conf import settings
from django.db import transaction # ADDED: For atomicity
from .models import Orders, Trades
from .matching_engine import MatchingEngine




class Orderbooks:

    # Orderbooks is a class that manages all of the orderbooks across all
    # of the markets/events in the system. It distributes orders to the
    # correct matching engine based on the event id. It isn't actually
    # responsible for the execution of trades


    def __init__(self):
        self.orderbooks: Dict[str, MatchingEngine] = {}
        self.lock = threading.Lock()
        self.persistence_dir = getattr(settings, 'ORDERBOOK_PERSISTENCE_DIR', 'orderbook_data')
        os.makedirs(self.persistence_dir, exist_ok=True)
        # self.load_all_orderbooks_from_db() # ADDED: Placeholder for reconstruction


    def load_all_orderbooks_from_db(self):
        """
        Placeholder for Orderbook reconstruction.
        On startup, we must load all ACTIVE/PARTIALLY_FILLED orders from the DB
        and submit them to their respective MatchingEngine instances.
        """
        active_orders = Orders.objects.filter(status__in=['ACTIVE', 'PARTIALLY_FILLED']).order_by('created_at')
        
        # Group orders by event_id
        orders_by_event = {}
        for order in active_orders:
            event_id = str(order.event_id)
            if event_id not in orders_by_event:
                orders_by_event[event_id] = []
            orders_by_event[event_id].append(order)

        # Re-insert orders into the matching engines
        for event_id, orders in orders_by_event.items():
            orderbook = self.get_orderbook(event_id)
            # Re-inserting orders must skip the matching logic, just insertion
            # NOTE: This requires a new method in MatchingEngine (e.g., re_insert_order)
            # For minimal change, we'll assume a simplified re-insertion logic is handled by a dedicated method if needed.
            # For now, this serves as the persistence fix placeholder.
            pass



    # Submit order just routes the order information/data to the right matching engine
    @transaction.atomic
    def submit_order(self, user, event, order_type: str, share_type: str, quantity: int, price: float) -> dict:

        # Basic error checks
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

        # Create the order object
        order = Orders(
            user=user,
            event=event,
            order_type=order_type.upper(),
            share_type=share_type.upper(),
            amount=Decimal(quantity),
            remaining_quantity=Decimal(quantity), # Upon creation of a new order, remaining_quantity = amount
            price=Decimal(price),
        )

        order.save() # Saved to DB before passing to ME (important for ID)


        # Submit the order to the matching engine and get trades and modified orders
        trades, modified_orders = orderbook.add_order(order) # MODIFIED: Expects a tuple return

        
        # --- Database Persistence (Handled outside the lock) ---

        # 1. Save all executed trades
        for trade in trades:
            trade.save()

        # 2. Save the status/remaining_quantity updates for all orders (taker and maker)
        for modified_order in modified_orders:
            # We must ensure we only update the status and remaining quantity fields to minimize risk
            # The 'update_fields' argument is a good practice for performance/safety
            modified_order.save(update_fields=['status', 'remaining_quantity']) 

        # --- End Persistence ---

        # NOTE: The persistence to disk is still commented out, but the DB persistence is fixed.
        # self.persist_orderbook(orderbook_key)


        # TODO: provide the json representation of how the order went through, and if any trades were executed
        return {}
    


    def get_orderbook(self, event_id: str) -> MatchingEngine:
        with self.lock:
            if event_id not in self.orderbooks:
                self.orderbooks[event_id] = MatchingEngine(event_id) # Create a new matching engine if this market has never been seen
            return self.orderbooks[event_id]