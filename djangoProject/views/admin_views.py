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

