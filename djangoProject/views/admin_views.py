from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

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

