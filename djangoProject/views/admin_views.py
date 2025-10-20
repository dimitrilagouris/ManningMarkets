from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from decimal import Decimal

from ..models import Profiles, Markets, AdminActions, Wallet, Orders

import logging

logger = logging.getLogger("djangoProject")


def admin_required(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
        if not request.user.is_admin:
            return Response({'error': 'Admin privileges required'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_all_users(request):
    search = request.GET.get('search', '').strip()
    status = request.GET.get('status', 'all')
    
    users = Profiles.objects.select_related('role').all()
    
    if search:
        users = users.filter(Q(username__icontains=search) | Q(email__icontains=search))
    if status == 'active':
        users = users.filter(is_active=True)
    elif status == 'suspended':
        users = users.filter(is_active=False)
    
    return Response({'users': [{
        'id': u.id,
        'name': u.username,
        'email': u.email,
        'status': 'active' if u.is_active else 'suspended',
        'joinDate': u.date_joined.strftime('%Y-%m-%d'),
        'role': u.role.role_name if u.role else 'No Role'
    } for u in users]}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def suspend_user(request, user_id):
    try:
        user = Profiles.objects.get(pk=user_id)
    except Profiles.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if user.id == request.user.id:
        return Response({'error': 'Cannot suspend your own account'}, status=400)
    if not user.is_active:
        return Response({'error': 'User already suspended'}, status=400)
    
    user.is_active = False
    user.save()
    
    AdminActions.objects.create(user=request.user, 
        description=f"Suspended: {user.username} ({user.email})")
    
    return Response({'message': 'User suspended successfully'}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def unsuspend_user(request, user_id):
    try:
        user = Profiles.objects.get(pk=user_id)
    except Profiles.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if user.is_active:
        return Response({'error': 'User already active'}, status=400)
    
    user.is_active = True
    user.save()
    
    AdminActions.objects.create(user=request.user,
        description=f"Unsuspended: {user.username} ({user.email})")
    
    return Response({'message': 'User reactivated successfully'}, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@admin_required
def delete_user(request, user_id):
    try:
        user = Profiles.objects.get(pk=user_id)
    except Profiles.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    if user.id == request.user.id:
        return Response({'error': 'Cannot delete your own account'}, status=400)
    
    AdminActions.objects.create(user=request.user,
        description=f"Deleted: {user.username} ({user.email})")
    
    user.delete()
    
    return Response({'message': 'User deleted successfully'}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_system_stats(request):
    return Response({
        'totalUsers': Profiles.objects.count(),
        'activeUsers': Profiles.objects.filter(is_active=True).count(),
        'suspendedUsers': Profiles.objects.filter(is_active=False).count(),
        'totalMarkets': Markets.objects.count(),
        'activeMarkets': Markets.objects.filter(open=True).count(),
        'totalOrders': Orders.objects.count(),
        'activeOrders': Orders.objects.filter(status='ACTIVE').count(),
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_markets_overview(request):
    markets = Markets.objects.prefetch_related('events').all()
    
    markets_data = []
    for market in markets:
        events = market.events.all()
        participants = Orders.objects.filter(event__in=events).values('user').distinct().count()
        avg_price = sum(float(e.price) for e in events) / len(events) if events else 0
        
        markets_data.append({
            'id': market.id,
            'title': market.market_name,
            'status': 'active' if market.open else 'closed',
            'participants': participants,
            'price': round(avg_price, 2),
            'volume': market.volume,
        })
    
    return Response({'markets': markets_data}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_audit_logs(request):
    limit = int(request.GET.get('limit', 50))
    logs = AdminActions.objects.select_related('user').order_by('-occured_at')[:limit]
    
    return Response({'auditLogs': [{
        'id': log.id,
        'admin': log.user.username,
        'adminEmail': log.user.email,
        'action': log.description,
        'timestamp': log.occured_at.strftime('%Y-%m-%d %H:%M:%S'),
    } for log in logs]}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@admin_required
def get_user_details(request, user_id):
    try:
        user = Profiles.objects.select_related('role').get(pk=user_id)
    except Profiles.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    try:
        wallet = Wallet.objects.get(profile=user)
        wallet_data = {'id': wallet.id, 'balance': str(wallet.points_balance)}
    except Wallet.DoesNotExist:
        wallet_data = None
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role.role_name if user.role else 'No Role',
        'status': 'active' if user.is_active else 'suspended',
        'emailVerified': user.email_verified,
        'dateJoined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
        'lastLogin': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None,
        'wallet': wallet_data,
        'orderStats': {
            'total': Orders.objects.filter(user=user).count(),
            'active': Orders.objects.filter(user=user, status='ACTIVE').count(),
            'filled': Orders.objects.filter(user=user, status='FILLED').count(),
        }
    }, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@admin_required
def give_points(request, user_id):
    try:
        user = Profiles.objects.get(pk=user_id)
    except Profiles.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
    amount = request.data.get('amount')
    
    if not amount:
        return Response({'error': 'Amount is required'}, status=400)
    
    try:
        amount = float(amount)
        if amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=400)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid amount'}, status=400)
    
    try:
        wallet = Wallet.objects.get(profile=user)
    except Wallet.DoesNotExist:
        return Response({'error': 'User wallet not found'}, status=404)
    
    wallet.points_balance += Decimal(str(amount))
    wallet.save()
    
    AdminActions.objects.create(user=request.user,
        description=f"Added {amount} credits to {user.username}'s wallet")
    
    return Response({
        'message': 'Points added successfully',
        'newBalance': str(wallet.points_balance)
    }, status=200)