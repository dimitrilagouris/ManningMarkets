import threading
from decimal import Decimal
from typing import List, Tuple, Dict
from .models import Orders, Trades


class MatchingEngine:

    # Matching engine actually executes the trades by directing orders into the orderbooks

    def __init__(self, event_id: str):
        self.event_id = event_id

        # bid and ask order lists for yes shares --> no shares get placed on the respective side
        self.bid_orders = []
        self.ask_orders = []

        self.lock = threading.Lock()
        
        # Load existing orders from database
        self.load_existing_orders()

    def load_existing_orders(self):
        from .models import Events
        
        try:
            event = Events.objects.get(id=self.event_id)
            
            # Get all active orders for this event
            active_orders = Orders.objects.filter(
                event=event, 
                remaining_quantity__gt=0,
                status__in=['ACTIVE', 'PARTIALLY_FILLED']
            ).order_by('created_at')
            
            for order in active_orders:
                # Insert orders into the appropriate side based on matching engine logic
                if order.order_type.upper() == "BUY" and order.share_type.upper() == "YES":
                    self.insert_order(order, self.bid_orders)
                elif order.order_type.upper() == "BUY" and order.share_type.upper() == "NO":
                    self.insert_order(order, self.ask_orders)
                elif order.order_type.upper() == "SELL" and order.share_type.upper() == "YES":
                    self.insert_order(order, self.ask_orders)
                elif order.order_type.upper() == "SELL" and order.share_type.upper() == "NO":
                    self.insert_order(order, self.bid_orders)
                    
        except Events.DoesNotExist:
            pass  # Event doesn't exist yet

    def add_order(self, order: Orders) -> Tuple[List[Trades], List[Orders]]:

        # Orders to be returned to the Orderbooks manager for database saving
        # This prevents I/O from occurring under the lock.
        orders_to_update = [order]
        trades = []

        with self.lock:

            if order.order_type.upper() == "BUY" and order.share_type.upper() == "YES":
                new_trades, updated_orders = self.match_order(order, self.ask_orders)
                trades.extend(new_trades)
                orders_to_update.extend(updated_orders)
                if order.remaining_quantity > 0:
                    self.insert_order(order, self.bid_orders)

            elif order.order_type.upper() == "BUY" and order.share_type.upper() == "NO":
                new_trades, updated_orders = self.match_order(order, self.bid_orders) # Matching Buy No (Ask) against Bid orders
                trades.extend(new_trades)
                orders_to_update.extend(updated_orders)
                if order.remaining_quantity > 0:
                    self.insert_order(order, self.ask_orders)

            elif order.order_type.upper() == "SELL" and order.share_type.upper() == "YES":
                new_trades, updated_orders = self.match_order(order, self.bid_orders)
                trades.extend(new_trades)
                orders_to_update.extend(updated_orders)
                if order.remaining_quantity > 0:
                    self.insert_order(order, self.ask_orders)

            elif order.order_type.upper() == "SELL" and order.share_type.upper() == "NO":
                new_trades, updated_orders = self.match_order(order, self.ask_orders) # Matching Sell No (Bid) against Ask orders
                trades.extend(new_trades)
                orders_to_update.extend(updated_orders)
                if order.remaining_quantity > 0:
                    self.insert_order(order, self.bid_orders)

            return trades, orders_to_update



    def match_order(self, order: Orders, opposite_side_orders: List[Orders]) -> Tuple[List[Trades], List[Orders]]:
        trades = []
        orders_to_update = [] # Resting orders that are partially or fully filled
        
        # NOTE: The determination of opposite_side_orders is now handled in add_order for clarity and separation of concerns.
        
        # Execute trades - orderbook is already sorted by price-time priority
        while order.remaining_quantity > 0 and opposite_side_orders:
            best_opposite_order = opposite_side_orders[0]  # First order is best price
            
            # Check if we can trade (BID >= ASK)
            # For binary options, we need to convert NO prices to YES prices for comparison
            def get_effective_yes_price(order):
                if order.share_type.upper() == "YES":
                    return float(order.price)
                else:  # NO
                    return 1.0 - float(order.price)
            
            incoming_effective_price = get_effective_yes_price(order)
            opposite_effective_price = get_effective_yes_price(best_opposite_order)
            
            is_incoming_bid = (order.order_type.upper() == "BUY" and order.share_type.upper() == "YES") or \
                             (order.order_type.upper() == "SELL" and order.share_type.upper() == "NO")
            
            if is_incoming_bid:
                # Incoming is bid, opposite is ask - trade if bid >= ask
                if incoming_effective_price < opposite_effective_price:
                    break  # Can't trade anymore
            else:
                # Incoming is ask, opposite is bid - trade if bid >= ask
                if opposite_effective_price < incoming_effective_price:
                    break  # Can't trade anymore
            
            # Calculate trade quantity
            trade_quantity = min(
                order.remaining_quantity,
                best_opposite_order.remaining_quantity
            )
            
            # Create trade object (NOTE: The database save is now outside this function)
            # Standardize price to always be the YES price
            def get_yes_price(order):
                if order.share_type.upper() == "YES":
                    return order.price
                else:  # NO
                    return Decimal('1') - order.price
            
            # Use the maker's YES price for the trade
            trade_yes_price = get_yes_price(best_opposite_order)
            
            trade = Trades(
                maker_order_id=best_opposite_order,
                taker_order_id=order,
                quantity_filled=int(trade_quantity),
                # Trade price is always the YES price
                price=trade_yes_price
            )
            trades.append(trade)
            
            # Update remaining quantities
            order.remaining_quantity -= trade_quantity
            best_opposite_order.remaining_quantity -= trade_quantity
            
            # Remove completely filled orders from the book
            if best_opposite_order.remaining_quantity <= 0:
                opposite_side_orders.pop(0)  # Remove first order
                best_opposite_order.status = "FILLED"
                orders_to_update.append(best_opposite_order)
            elif trade_quantity > 0:
                 # Only add to update list if it was modified (partially filled)
                best_opposite_order.status = "PARTIALLY_FILLED"
                orders_to_update.append(best_opposite_order)

        
        # Update the incoming order's status
        if order.remaining_quantity <= 0:
            order.status = "FILLED"
        elif order.remaining_quantity != order.amount and order.remaining_quantity > 0:
            order.status = "PARTIALLY_FILLED"
        else:
            order.status = "ACTIVE"
        
        # NOTE: order.save() is REMOVED from here. It is handled by Orderbooks.
        
        return trades, orders_to_update


    def insert_order(self, order: Orders, side_orders: List[Orders]):
        # The performance issue with O(N) insertion remains but is accepted for minimal change.
        
        def get_effective_yes_price(order):
            if order.share_type.upper() == "YES":
                return float(order.price)
            else:  # NO
                return 1.0 - float(order.price)
        
        for i, existing_order in enumerate(side_orders):
            is_bid_order = (order.order_type.upper() == "BUY" and order.share_type.upper() == "YES") or \
                           (order.order_type.upper() == "SELL" and order.share_type.upper() == "NO")
            
            # Use effective YES prices for proper sorting
            order_effective_price = get_effective_yes_price(order)
            existing_effective_price = get_effective_yes_price(existing_order)
            
            if is_bid_order:
                # These are buy orders - insert by highest effective YES price first, then FIFO
                if order_effective_price > existing_effective_price:
                    side_orders.insert(i, order)
                    return
                elif order_effective_price == existing_effective_price and order.created_at < existing_order.created_at:
                    # Same effective price, insert by FIFO (earlier time first)
                    side_orders.insert(i, order)
                    return
            else:
                # These are sell orders - insert by lowest effective YES price first, then FIFO
                if order_effective_price < existing_effective_price:
                    side_orders.insert(i, order)
                    return
                elif order_effective_price == existing_effective_price and order.created_at < existing_order.created_at:
                    # Same effective price, insert by FIFO (earlier time first)
                    side_orders.insert(i, order)
                    return
        
        # If we get here, insert at the end
        side_orders.append(order)