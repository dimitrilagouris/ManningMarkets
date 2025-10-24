from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from ..models import Markets, Events, Orders, Trades, Positions, Wallet
from ..settlement_service import settle_event, get_settlement_status, get_user_settlement_history

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_users(request):
    """
    Get all users for admin management.
    """
    try:
        # Get query parameters
        search = request.GET.get('search', '')
        status = request.GET.get('status', 'all')
        
        # Build query
        users_query = User.objects.all()
        
        # Apply search filter
        if search:
            users_query = users_query.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Apply status filter
        if status != 'all':
            if status == 'active':
                users_query = users_query.filter(is_active=True)
            elif status == 'suspended':
                users_query = users_query.filter(is_active=False)
        
        # Get users with related data
        users = users_query.order_by('-date_joined')
        
        user_data = []
        for user in users:
            # Get user's wallet balance if available
            wallet_balance = 0
            try:
                wallet = Wallet.objects.get(user=user)
                wallet_balance = float(wallet.points_balance)
            except:
                pass
            
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name or '',
                'last_name': user.last_name or '',
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'is_active': user.is_active,
                'status': 'active' if user.is_active else 'suspended',
                'date_joined': user.date_joined.strftime('%Y-%m-%d'),
                'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never',
                'wallet_balance': wallet_balance,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser
            })
        
        return Response({
            'users': user_data,
            'total_count': len(user_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_markets(request):
    """
    Get all markets for admin overview.
    """
    try:
        markets = Markets.objects.all().order_by('-id')
        
        market_data = []
        for market in markets:
            # Get market stats
            events = Events.objects.filter(market=market)
            total_events = events.count()
            
            # Calculate total volume (sum of all trades in this market)
            total_volume = 0
            try:
                trades = Trades.objects.filter(
                    maker_order_id__event__market=market
                ).values_list('price', 'quantity_filled')
                
                for price, quantity in trades:
                    total_volume += float(price * quantity)
            except:
                pass
            
            # Get active orders count
            active_orders = Orders.objects.filter(
                event__market=market,
                status__in=['ACTIVE', 'PARTIALLY_FILLED']
            ).count()
            
            # Get unique participants
            participants = set()
            try:
                positions = Positions.objects.filter(event__market=market)
                for pos in positions:
                    participants.add(pos.user_id)
            except:
                pass
            
            market_data.append({
                'id': market.id,
                'market_name': market.market_name,
                'description': '',  # Markets model doesn't have description field
                'status': 'active' if market.open else 'closed',
                'created_at': 'N/A',  # Markets model doesn't have created_at field
                'total_events': total_events,
                'total_volume': round(total_volume, 2),
                'active_orders': active_orders,
                'participants': len(participants),
                'events': [
                    {
                        'id': event.id,
                        'event_name': event.event_name,
                        'expiration_date': event.expiration_date.strftime('%Y-%m-%d') if event.expiration_date else None,
                        'settled': getattr(event, 'settled', False)
                    } for event in events
                ]
            })
        
        return Response({
            'markets': market_data,
            'total_count': len(market_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request):
    """
    Get admin dashboard statistics.
    """
    try:
        # User stats
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        suspended_users = User.objects.filter(is_active=False).count()
        
        # Market stats
        total_markets = Markets.objects.count()
        total_events = Events.objects.count()
        
        # Trading stats
        total_trades = Trades.objects.count()
        total_orders = Orders.objects.count()
        active_orders = Orders.objects.filter(status__in=['ACTIVE', 'PARTIALLY_FILLED']).count()
        
        # Volume stats
        total_volume = 0
        try:
            trades = Trades.objects.all()
            for trade in trades:
                total_volume += float(trade.price * trade.quantity_filled)
        except:
            pass
        
        stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'suspended': suspended_users
            },
            'markets': {
                'total': total_markets,
                'events': total_events
            },
            'trading': {
                'total_trades': total_trades,
                'total_orders': total_orders,
                'active_orders': active_orders,
                'total_volume': round(total_volume, 2)
            }
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suspend_user(request):
    """
    Suspend a user account.
    """
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.username} has been suspended',
            'user_id': user.id,
            'status': 'suspended'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsuspend_user(request):
    """
    Unsuspend a user account.
    """
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'User {user.username} has been unsuspended',
            'user_id': user.id,
            'status': 'active'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    """
    Delete a user account (soft delete by deactivating).
    """
    try:
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID is required'}, status=400)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        
        # Soft delete by deactivating
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.username} has been deactivated',
            'user_id': user.id,
            'status': 'deleted'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_audit_logs(request):
    """
    Get audit logs for admin (placeholder - not implemented yet).
    """
    try:
        # Placeholder - return empty audit logs for now
        return Response({
            'audit_logs': [],
            'total_count': 0
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settle_market(request):
    """
    Settle a market event with the winning outcome.
    """
    try:
        event_id = request.data.get('event_id')
        winning_outcome = request.data.get('winning_outcome')
        
        if not event_id or not winning_outcome:
            return Response({'error': 'event_id and winning_outcome are required'}, status=400)
        
        if winning_outcome not in ['YES', 'NO']:
            return Response({'error': 'winning_outcome must be YES or NO'}, status=400)
        
        # Settle the event
        result = settle_event(event_id, winning_outcome)
        
        if 'error' in result:
            return Response(result, status=400)
        
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_settlement_info(request):
    """
    Get settlement information for an event.
    """
    try:
        event_id = request.GET.get('event_id')
        
        if not event_id:
            return Response({'error': 'event_id is required'}, status=400)
        
        result = get_settlement_status(event_id)
        
        if 'error' in result:
            return Response(result, status=400)
        
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_settlements(request):
    """
    Get settlement history for a user.
    """
    try:
        user_id = request.GET.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=400)
        
        result = get_user_settlement_history(user_id)
        
        if 'error' in result:
            return Response(result, status=400)
        
        return Response(result)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)