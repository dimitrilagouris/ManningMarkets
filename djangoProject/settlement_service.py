
from django.utils import timezone
from .models import Events, Positions, Wallet, Orders
from decimal import Decimal


def settle_event(event_id, winning_outcome):
    """
    Settle an event with the given winning outcome.
    Updates all positions and pays out winnings to winners.
    """
    try:
        # Get the event
        event = Events.objects.get(id=event_id)
        
        # Check if already settled
        if event.settled:
            return {'error': 'Event already settled'}
        
        # Update event settlement status
        event.settled = True
        event.winning_outcome = winning_outcome
        event.settled_at = timezone.now()
        event.save()
        
        # Cancel all active orders for this event
        active_orders = Orders.objects.filter(
            event=event,
            status__in=['ACTIVE', 'PARTIALLY_FILLED']
        )
        
        cancelled_orders_count = 0
        for order in active_orders:
            order.status = 'CANCELLED'
            order.cancellation_time = timezone.now().time()
            order.save()
            cancelled_orders_count += 1
        
        # Check if all events in this market are now settled
        all_events = Events.objects.filter(market=event.market)
        all_events_settled = all_events.filter(settled=True).count() == all_events.count()
        
        # If all events are settled, close the market
        if all_events_settled:
            event.market.open = False
            event.market.save()
        
        # Get all positions for this event
        positions = Positions.objects.filter(event=event)
        
        winners = []
        losers = []
        total_payout = Decimal('0.0')
        
        for position in positions:
            # Determine if this position is a winner
            is_winner = position.side == winning_outcome
            
            if is_winner:
                # Calculate winnings (1 point per share for winners)
                winnings = Decimal(str(position.quantity))
                total_payout += winnings
                
                # Add to winners list
                winners.append({
                    'user_id': position.user.id,
                    'username': position.user.username,
                    'quantity': position.quantity,
                    'winnings': float(winnings)
                })
                
                # Update user's wallet - winners get their winnings
                wallet = Wallet.objects.get(profile=position.user)
                wallet.points_balance += winnings
                wallet.save()
                
            else:
                # Add to losers list
                losers.append({
                    'user_id': position.user.id,
                    'username': position.user.username,
                    'quantity': position.quantity,
                    'winnings': 0.0
                })
            
            # Delete the position to free up allocated funds
            # This is important because positions tie up allocated funds
            position.delete()
        
        return {
            'success': True,
            'event_id': event_id,
            'winning_outcome': winning_outcome,
            'winners': winners,
            'losers': losers,
            'total_payout': float(total_payout),
            'cancelled_orders': cancelled_orders_count,
            'market_closed': all_events_settled,
            'settled_at': event.settled_at.isoformat()
        }
        
    except Events.DoesNotExist:
        return {'error': 'Event not found'}
    except Exception as e:
        return {'error': f'Error settling event: {str(e)}'}