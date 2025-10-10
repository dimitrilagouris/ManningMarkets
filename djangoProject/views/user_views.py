
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Profiles, Wallet

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_wallet(request):
    try:
        wallet = Wallet.objects.get(profile=request.user.pk)
    except Wallet.DoesNotExist:
        return Response({'error': 'Wallet could not be found.'}, status = 404)
    
    return Response({'wallet_id': wallet.id, 'balance': wallet.points_balance})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    try:
        user = Profiles.objects.select_related('role').get(pk = request.user.pk)
    except Profiles.DoesNotExist:
        return Response({'error': 'User does not exst'}, status=404)
    
    return Response({'username': user.username, 'role': user.role.role_name, 'email': user.email, 'date_joined': user.date_joined, 'last_login': user.last_login})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_username(request):
    try:
        user = Profiles.objects.select_related('role').get(pk = request.user.pk);
    except Profiles.DoesNotExist:
        return Response({'error': 'User does not exist'}, status=404);



