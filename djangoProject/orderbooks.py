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
        trades, modified_orders = orderbook.add_order(order)

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

        # --- Update Wallet Balances and Cancel Unfunded Orders ---
        self.update_wallet_balances_from_trades(trades)

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
        
        for trade in trades:
            
            # Update taker position
            self._update_user_position(
                user=trade.taker_order_id.user,
                event=trade.taker_order_id.event,
                share_type=trade.taker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.taker_order_id.order_type == 'BUY'
            )
            
            # Update maker position
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
            position.quantity = quantity_change
            position.avg_price = share_price
        else:
            # Existing position - update with weighted average
            if position.quantity + quantity_change == 0:
                # Position closed
                position.quantity = 0
                position.avg_price = 0
            elif position.quantity + quantity_change > 0:
                # Position increased or maintained
                if is_buy:
                    # Calculate weighted average price
                    total_cost = (position.quantity * position.avg_price) + (Decimal(quantity) * share_price)
                    position.quantity += quantity_change
                    position.avg_price = total_cost / position.quantity
                else:
                    # Selling - just reduce quantity, keep avg price
                    position.quantity += quantity_change
            else:
                # Position went negative - this shouldn't happen in a proper system
                # But we'll handle it by setting to 0
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
        

    def _validate_wallet_balance(self, user, event, share_type, quantity, price):
        """
        Validate that a user has sufficient wallet balance to place a buy order.
        This includes checking against existing active orders to prevent over-commitment.
        Raises ValueError if the user doesn't have enough funds.
        """
        
        # Calculate the cost based on share type
        price_decimal = Decimal(str(price))  # Convert price to Decimal
        if share_type.upper() == "YES":
            cost_per_share = price_decimal
        else:  # NO
            cost_per_share = Decimal('1') - price_decimal
        
        total_cost = cost_per_share * quantity
        
        # Get user's wallet balance
        try:
            from .models import Wallet
            wallet = Wallet.objects.get(profile=user)
            current_balance = wallet.points_balance
            print(f"DEBUG: Current wallet balance: {current_balance}")
        except Wallet.DoesNotExist:
            raise ValueError("User wallet not found. Please contact support.")
        
        # Calculate total committed funds from existing active buy orders
        committed_funds = self._calculate_committed_funds(user)
        available_balance = current_balance - committed_funds
        
        print(f"DEBUG: Committed funds from active orders: {committed_funds}")
        print(f"DEBUG: Available balance: {available_balance}")
        print(f"DEBUG: New order cost: {total_cost}")
        
        # Check if user has enough funds (considering existing commitments)
        if available_balance < total_cost:
            raise ValueError(
                f"Insufficient available balance. Order cost: ${total_cost:.2f}, "
                f"Available: ${available_balance:.2f} (Total balance: ${current_balance:.2f}, "
                f"Committed: ${committed_funds:.2f})"
            )

    def _calculate_committed_funds(self, user):
        """
        Calculate the total funds committed to active buy orders for a user.
        Returns the total amount of money that would be spent if all active buy orders were filled.
        """
        from .models import Orders
        
        # Get all active buy orders for this user
        active_buy_orders = Orders.objects.filter(
            user=user,
            order_type='BUY',
            status__in=['ACTIVE', 'PARTIALLY_FILLED'],
            remaining_quantity__gt=0
        )
        
        total_committed = Decimal('0')
        
        for order in active_buy_orders:
            # Calculate cost per share based on share type
            if order.share_type == 'YES':
                cost_per_share = order.price
            else:  # NO
                cost_per_share = Decimal('1') - order.price
            
            # Calculate total cost for remaining quantity
            order_cost = cost_per_share * order.remaining_quantity
            total_committed += order_cost
            
        return total_committed

    def cancel_unfunded_orders(self, user):
        """
        Cancel all active buy orders for a user that can no longer be funded
        due to insufficient wallet balance. This should be called after trades execute
        to ensure users don't have unfunded orders.
        """
        from .models import Orders, Wallet
        
        try:
            wallet = Wallet.objects.get(profile=user)
            current_balance = wallet.points_balance
        except Wallet.DoesNotExist:
            print(f"WARNING: No wallet found for user {user.id}, cannot cancel unfunded orders")
            return
        
        # Get all active buy orders for this user
        active_buy_orders = Orders.objects.filter(
            user=user,
            order_type='BUY',
            status__in=['ACTIVE', 'PARTIALLY_FILLED'],
            remaining_quantity__gt=0
        ).order_by('created_at')  # Cancel oldest orders first
        
        cancelled_orders = []
        running_balance = current_balance
        
        for order in active_buy_orders:
            # Calculate cost for this order
            if order.share_type == 'YES':
                cost_per_share = order.price
            else:  # NO
                cost_per_share = Decimal('1') - order.price
            
            order_cost = cost_per_share * order.remaining_quantity
            
            # Check if we can afford this order
            if running_balance >= order_cost:
                # We can afford this order, subtract from running balance
                running_balance -= order_cost
            else:
                # We can't afford this order, cancel it
                print(f"CANCELLING UNFUNDED ORDER: Order {order.id} - Cost: ${order_cost:.2f}, Available: ${running_balance:.2f}")
                
                # Remove from orderbook
                self.remove_order_from_orderbook(order)
                
                # Mark as cancelled
                order.status = 'CANCELLED'
                order.save(update_fields=['status'])
                
                cancelled_orders.append({
                    'order_id': order.id,
                    'cost': float(order_cost),
                    'reason': 'Insufficient funds after trade execution'
                })
        
        if cancelled_orders:
            print(f"CANCELLED {len(cancelled_orders)} unfunded orders for user {user.id}")
            # Broadcast updated orderbooks for affected events
            affected_events = set(order.event for order in active_buy_orders if order.id in [co['order_id'] for co in cancelled_orders])
            for event in affected_events:
                self.broadcast_full_orderbook(event)
        
        return cancelled_orders

    def update_wallet_balances_from_trades(self, trades):
        """
        Update wallet balances for all users involved in trades.
        Deducts money from buyers and adds money to sellers.
        Also cancels any unfunded orders after wallet updates.
        """
        
        # Track all users involved in trades
        users_involved = set()
        
        for trade in trades:
            
            # Update taker wallet
            self._update_user_wallet(
                user=trade.taker_order_id.user,
                event=trade.taker_order_id.event,
                share_type=trade.taker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.taker_order_id.order_type == 'BUY'
            )
            users_involved.add(trade.taker_order_id.user)
            
            # Update maker wallet
            self._update_user_wallet(
                user=trade.maker_order_id.user,
                event=trade.maker_order_id.event,
                share_type=trade.maker_order_id.share_type,
                quantity=trade.quantity_filled,
                price=trade.price,
                is_buy=trade.maker_order_id.order_type == 'BUY'
            )
            users_involved.add(trade.maker_order_id.user)
        
        # Cancel unfunded orders for all users involved in trades
        for user in users_involved:
            cancelled_orders = self.cancel_unfunded_orders(user)
            if cancelled_orders:
                print(f"User {user.id} had {len(cancelled_orders)} orders cancelled due to insufficient funds")

    def _update_user_wallet(self, user, event, share_type, quantity, price, is_buy):
        """
        Update user's wallet balance based on trade.
        The trade price is always the YES price, so we need to calculate
        the actual amount received/paid based on the share type.
        """
        # The trade price is always the YES price
        price_decimal = Decimal(str(price))
        
        if share_type == "YES":
            # For YES shares, the trade price is the actual amount per share
            amount_per_share = price_decimal
        else:  # NO
            # For NO shares, the amount received is (1 - YES_price)
            # because NO price = 1 - YES price
            amount_per_share = Decimal('1') - price_decimal
        
        total_amount = amount_per_share * quantity
        
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
            wallet.points_balance -= total_amount
        else:
            # Selling shares - add money
            wallet.points_balance += total_amount
        
        wallet.save()

    def update_market_volume_from_trades(self, trades, event):
        if not trades:
            return
                
        total_volume = 0
        for trade in trades:
            volume_added = trade.quantity_filled
            total_volume += volume_added
        
        # Update the market's volume
        market = event.market
        market.volume += total_volume
        market.save()