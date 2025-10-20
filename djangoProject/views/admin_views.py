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


