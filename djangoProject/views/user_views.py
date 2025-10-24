from django.contrib.auth import update_session_auth_hash
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
    
    # Calculate position values and total net worth
    from ..models import Positions
    from decimal import Decimal
    
    cash_balance = float(wallet.points_balance)
    
    # Calculate position values (allocated funds)
    positions = Positions.objects.filter(
        user=request.user,
        quantity__gt=0
    )
    
    allocated_funds = Decimal('0')
    for position in positions:
        # Calculate the current value of the position
        position_value = position.avg_price * position.quantity
        allocated_funds += position_value
    
    allocated_funds = float(allocated_funds)
    total_balance = cash_balance + allocated_funds  # Net worth = cash + positions
    available_funds = cash_balance  # Available = just cash balance
    
    return Response({
        'wallet_id': wallet.id, 
        'balance': total_balance,
        'allocated': allocated_funds,
        'available': available_funds
    })

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
    new_username = request.data.get("newUsername");
    if not new_username:
        return Response({'error': 'New username required'}, status = 400)

    try:
        user = Profiles.objects.select_related('role').get(pk = request.user.pk)

        user.username = new_username
        user.save()

        return Response({'message': 'Username successfully changed'}, status=200)

    except Profiles.DoesNotExist:
        return Response({'error': 'User does not exist'}, status=404)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request): 
    user = request.user;
    old_password = request.data.get("oldPassword")
    new_password = request.data.get("newPassword")
    
    if not old_password or not new_password:
        return Response({'error': "Both old and new passwords required."}, status=400)
    
    if not user.check_password(old_password):
        return Response({'error': "Old password is incorrect."}, status=400)
    
    user.set_password(new_password)
    user.save()

    update_session_auth_hash(request, user)

    return Response({'message': 'Password changed successfully.'}, status=200)



