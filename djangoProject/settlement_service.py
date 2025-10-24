from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth import get_user_model

from .models import Events, Positions, Wallet

User = get_user_model()

def settle_event(event_id, winning_outcome):
    """
    Settle an event with the given winning outcome.
    """
    try:
        with transaction.atomic():
            # Get the event
            event = Events.objects.get(id=event_id)
            
            if event.settled:
                return {'error': 'Event already settled'}
            
            # Get all positions for this event
            positions = Positions.objects.filter(event=event, settled=False)
            
            winners = []
            losers = []
            total_payout = Decimal('0.0')
            
            # Process each position
            for position in positions:
                user = position.user.user  # Get the actual User object from Profile
                wallet = Wallet.objects.get(user=user)
                
                # Check if this position is a winner
                is_winner = position.side == winning_outcome
                
                if is_winner:
                    # WINNER: Pay out $1.00 per share
                    winnings = Decimal(str(position.quantity))  # $1.00 per share
                    total_payout += winnings
                    
                    # Update wallet balance
                    wallet.points_balance += winnings
                    wallet.save()
                    
                    # Mark position as settled with winnings
                    position.settled = True
                    position.winnings_paid = winnings
                    position.settled_at = timezone.now()
                    position.save()
                    
                    winners.append({
                        'user_id': user.id,
                        'username': user.username,
                        'shares': position.quantity,
                        'winnings': float(winnings),
                        'side': position.side
                    })
                else:
                    # LOSER: No payout, just mark as settled
                    position.settled = True
                    position.winnings_paid = Decimal('0.0')
                    position.settled_at = timezone.now()
                    position.save()
                    
                    losers.append({
                        'user_id': user.id,
                        'username': user.username,
                        'shares': position.quantity,
                        'side': position.side
                    })
            
            # Mark event as settled
            event.settled = True
            event.winning_outcome = winning_outcome
            event.settled_at = timezone.now()
            event.save()
            
            return {
                'success': True,
                'event_id': event.id,
                'event_name': event.event_name,
                'winning_outcome': winning_outcome,
                'total_positions': len(positions),
                'winners': winners,
                'losers': losers,
                'total_payout': float(total_payout),
                'settled_at': event.settled_at.isoformat()
            }
            
    except Events.DoesNotExist:
        return {'error': 'Event not found'}
    except Exception as e:
        return {'error': f'Settlement failed: {str(e)}'}


def get_settlement_status(event_id):
    """
    Get the settlement status of an event.
    """
    try:
        event = Events.objects.get(id=event_id)
        
        # Get position counts
        total_positions = Positions.objects.filter(event=event).count()
        settled_positions = Positions.objects.filter(event=event, settled=True).count()
        unsettled_positions = total_positions - settled_positions
        
        # Get winner/loser counts if settled
        winners = []
        losers = []
        total_payout = Decimal('0.0')
        
        if event.settled:
            settled_positions = Positions.objects.filter(event=event, settled=True)
            for pos in settled_positions:
                if pos.winnings_paid > 0:
                    winners.append({
                        'user_id': pos.user.user.id,
                        'username': pos.user.user.username,
                        'shares': pos.quantity,
                        'winnings': float(pos.winnings_paid),
                        'side': pos.side
                    })
                    total_payout += pos.winnings_paid
                else:
                    losers.append({
                        'user_id': pos.user.user.id,
                        'username': pos.user.user.username,
                        'shares': pos.quantity,
                        'side': pos.side
                    })
        
        return {
            'event_id': event.id,
            'event_name': event.event_name,
            'settled': event.settled,
            'winning_outcome': event.winning_outcome,
            'settled_at': event.settled_at.isoformat() if event.settled_at else None,
            'total_positions': total_positions,
            'settled_positions': settled_positions,
            'unsettled_positions': unsettled_positions,
            'winners': winners,
            'losers': losers,
            'total_payout': float(total_payout)
        }
        
    except Events.DoesNotExist:
        return {'error': 'Event not found'}
    except Exception as e:
        return {'error': f'Failed to get settlement status: {str(e)}'}


def get_user_settlement_history(user_id):
    """
    Get settlement history for a specific user.
    """
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        
        # Get all settled positions for this user
        settled_positions = Positions.objects.filter(
            user=profile, 
            settled=True
        ).select_related('event', 'event__market')
        
        settlements = []
        total_winnings = Decimal('0.0')
        
        for position in settled_positions:
            is_winner = position.winnings_paid > 0
            total_winnings += position.winnings_paid
            
            settlements.append({
                'event_id': position.event.id,
                'event_name': position.event.event_name,
                'market_name': position.event.market.market_name,
                'side': position.side,
                'shares': position.quantity,
                'winnings': float(position.winnings_paid),
                'is_winner': is_winner,
                'settled_at': position.settled_at.isoformat() if position.settled_at else None
            })
        
        return {
            'user_id': user.id,
            'username': user.username,
            'total_settlements': len(settlements),
            'total_winnings': float(total_winnings),
            'settlements': settlements
        }
        
    except User.DoesNotExist:
        return {'error': 'User not found'}
    except Exception as e:
        return {'error': f'Failed to get settlement history: {str(e)}'}
