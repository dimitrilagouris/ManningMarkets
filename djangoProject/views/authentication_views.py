from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from django.db import transaction

from django.shortcuts import redirect
from django.conf import settings

from ..models import Roles, Wallet, EmailToken
from ..serialisers import RegisterSerialiser, UserSerialiser
from ..utils.tokens import verify_email_token
from ..utils.emails import send_otp_email_login

from decimal import Decimal
import logging

logger = logging.getLogger("djangoProject")

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def initiate_login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status = 400)
    
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status = 401)
    
    # NOW REDIRECT TO OTP - change
    otp = EmailToken.create_otp_token(user)
    send_otp_email_login(user, otp)

    return Response({'OTP Sent to Email'}, status=200)

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    username = request.data.get("username")
    otp = request.data.get("otp")

    logger.info(f"OTP verification attempt for username: {username}")

    try:
        user = User.objects.get(email=username)
    except User.DoesNotExist:
        logger.warning(f"OTP verification attempt failed, username: {username}, not found")
        return Response({'error': 'User not found'}, status=404)
    
    if not EmailToken.verify_otp(user, otp):
        logger.warning(f"OTP verification attempt failed, username: {username}, invalid or expired token")
        return Response({'error': 'Invalid or expired otp'})
    
    login(request=request, user=user)
    logger.info(f"Username: {username} successfully loged in by OTP")
    return Response({'message': 'Login Successful'}, status=200)

@api_view(['POST'])
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
        return Response({'message': 'Logout Successful'}, status=200)
    return Response({'message': 'No active session to logout'})

@ratelimit(key='ip', rate='3/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    logger.info("Register Endpoint Called")
    serialiser = RegisterSerialiser(data=request.data)
    if serialiser.is_valid():
        serialiser.save()
        logger.info(f"User created: {serialiser.data['email']}")
        return Response({'status': 'User registered. Check your email to activate.'})
    logger.error(f"Registration failed: {serialiser.errors}")
    return Response(serialiser.errors, status = 400)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def activate_user(request, raw_token):
    if not raw_token:
        # Note: In a GET request from a browser, this isn't usually hit, but good practice.
        return redirect(f"{settings.FRONTEND_PATH}/") 
    
    token_hash = EmailToken.hash_token(raw_token=raw_token)

    try:
        token_object = EmailToken.objects.select_related('user').get(token_hash=token_hash)
    except EmailToken.DoesNotExist:
        # If the token is bad, redirect them back to the site, don't show an API error.
        return redirect(f"{settings.FRONTEND_PATH}/login?status=invalid_token") 
    
    if token_object.is_expired():
        token_object.delete()
        # If expired, redirect them back to the site
        return redirect(f"{settings.FRONTEND_PATH}/login?status=expired") 
    
    user = token_object.user

    with transaction.atomic():
    
        user.email_verified = True
        user.is_active = True
        user.assign_admin_role()
        user.save()

        Wallet.objects.create(
            profile = user,
            points_balance = Decimal("100.0000")
        )
        
        token_object.delete()

    # CRITICAL FIX: Redirect the user's browser to the login page on success!
    return redirect(f"{settings.FRONTEND_PATH}/login?status=activated")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    user_pk = request.user.pk
    try:
        user = User.objects.select_related('role').prefetch_related('role__permissionmap_set__permission').get(pk=user_pk)
    except User.DoesNotExist:
        return Response({'message': f'User ({user_pk}) not found'}, status=404)
    
    serialiser = UserSerialiser(user)
    return Response(serialiser.data)
 