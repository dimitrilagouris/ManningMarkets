from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from decimal import Decimal
from django.utils import timezone

from ..models import Trades, Orders, Positions, Events, Markets


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_trades(request):
    """
    Get all trades where the user was either the maker or taker.
    Returns the orders that were executed (indicating trades happened).
    """
    try:
        user = request.user
        
        # Get all trades where user was involved
        trades = Trades.objects.filter(
            Q(maker_order_id__user=user) | Q(taker_order_id__user=user)
        ).select_related(
            'maker_order_id__event__market',
            'taker_order_id__event__market',
            'maker_order_id__event',
            'taker_order_id__event'
        ).order_by('-created_at')
        
        trade_data = []
        for trade in trades:
            # Check if user was the maker
            if trade.maker_order_id.user == user:
                # User was the maker
                user_order = trade.maker_order_id
                is_buy = user_order.order_type == 'BUY'
                
                # Calculate net cash effect
                if is_buy:
                    # Buying shares - cash goes out (negative effect)
                    cash_effect = -float(trade.price * trade.quantity_filled)
                else:
                    # Selling shares - cash comes in (positive effect)
                    cash_effect = float(trade.price * trade.quantity_filled)
                
                trade_data.append({
                    'id': f"{trade.id}_maker",
                    'timestamp': trade.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'event_name': user_order.event.event_name,
                    'market_name': user_order.event.market.market_name,
                    'share_type': user_order.share_type,
                    'order_type': user_order.order_type,
                    'quantity': int(trade.quantity_filled),
                    'price': float(trade.price),
                    'total_cost': float(trade.price * trade.quantity_filled),
                    'is_buy': is_buy,
                    'cash_effect': cash_effect,
                    'status': 'EXECUTED'
                })
            
            # Check if user was the taker
            if trade.taker_order_id.user == user:
                # User was the taker
                user_order = trade.taker_order_id
                is_buy = user_order.order_type == 'BUY'
                
                # Calculate net cash effect
                if is_buy:
                    # Buying shares - cash goes out (negative effect)
                    cash_effect = -float(trade.price * trade.quantity_filled)
                else:
                    # Selling shares - cash comes in (positive effect)
                    cash_effect = float(trade.price * trade.quantity_filled)
                
                trade_data.append({
                    'id': f"{trade.id}_taker",
                    'timestamp': trade.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'event_name': user_order.event.event_name,
                    'market_name': user_order.event.market.market_name,
                    'share_type': user_order.share_type,
                    'order_type': user_order.order_type,
                    'quantity': int(trade.quantity_filled),
                    'price': float(trade.price),
                    'total_cost': float(trade.price * trade.quantity_filled),
                    'is_buy': is_buy,
                    'cash_effect': cash_effect,
                    'status': 'EXECUTED'
                })
        
        return Response({'trades': trade_data})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    """
    Get all active orders for the user (orders on the orderbook).
    """
    try:
        user = request.user
        
        # Get all active orders for the user
        orders = Orders.objects.filter(
            user=user,
            status__in=['ACTIVE', 'PARTIALLY_FILLED']
        ).select_related(
            'event__market',
            'event'
        ).order_by('-created_at')
        
        order_data = []
        for order in orders:
            order_data.append({
                'id': order.id,
                'timestamp': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'event_name': order.event.event_name,
                'market_name': order.event.market.market_name,
                'share_type': order.share_type,
                'order_type': order.order_type,
                'price': float(order.price),
                'total_quantity': int(order.amount),
                'remaining_quantity': int(order.remaining_quantity),
                'filled_quantity': int(order.amount - order.remaining_quantity),
                'status': order.status
            })
        
        return Response({'orders': order_data})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_positions(request):
    """
    Get all positions for the user.
    """
    try:
        user = request.user
        
        # Get all positions for the user
        positions = Positions.objects.filter(
            user=user,
            quantity__gt=0  # Only show positions with quantity > 0
        ).select_related(
            'event__market',
            'event'
        ).order_by('-event__market__market_name', 'side')
        
        position_data = []
        for position in positions:
            # Calculate current market value (this would need live price data)
            # For now, we'll use the average price as a placeholder
            current_value = float(position.avg_price * position.quantity)
            
            position_data.append({
                'id': position.id,
                'event_name': position.event.event_name,
                'market_name': position.event.market.market_name,
                'side': position.side,
                'quantity': int(position.quantity),
                'avg_price': float(position.avg_price),
                'current_value': current_value,
                'market_value': current_value  # Placeholder - would need live pricing
            })
        
        return Response({'positions': position_data})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request):
    """
    Cancel a user's order.
    """
    try:
        user = request.user
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=400)
        
        # Get the order and verify it belongs to the user
        try:
            order = Orders.objects.get(id=order_id, user=user)
        except Orders.DoesNotExist:
            return Response({'error': 'Order not found or does not belong to user'}, status=404)
        
        # Check if order can be cancelled
        if order.status not in ['ACTIVE', 'PARTIALLY_FILLED']:
            return Response({'error': f'Order cannot be cancelled. Current status: {order.status}'}, status=400)
        
        # Update order status, cancellation time, and remaining quantity
        order.status = 'CANCELLED'
        order.cancellation_time = timezone.now().time()
        order.remaining_quantity = 0  # Set to 0 so it doesn't appear in orderbook
        order.save()
        
        # Broadcast updated orderbook to connected clients
        from ..orderbooks import Orderbooks
        orderbooks = Orderbooks()
        orderbooks.broadcast_full_orderbook(order.event)
        
        # Note: Order is automatically removed from orderbook since remaining_quantity = 0
        # The broadcast_full_orderbook method filters for remaining_quantity__gt=0
        
        return Response({
            'message': 'Order cancelled successfully',
            'order_id': order.id,
            'status': order.status,
            'cancellation_time': order.cancellation_time.strftime('%H:%M:%S')
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
