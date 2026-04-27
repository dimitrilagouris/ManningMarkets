import logging
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.http import HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import EmailToken, Wallet
from ..serialisers import RegisterSerialiser, UserSerialiser
from ..utils.emails import send_otp_email_login
from ..utils.emails import send_activation_email

logger = logging.getLogger("djangoProject")
User = get_user_model()

TWO_FACTOR_ENABLED: bool = getattr(settings, 'TWO_FACTOR_ENABLED', True)



def _activate_user_account(user) -> None:
    """Provisions a newly activated user. Called from activation token flow or directly on registration."""
    with transaction.atomic():
        user.email_verified = True
        user.is_active = True
        user.assign_admin_role()
        user.save()

        Wallet.objects.create(
            profile=user,
            points_balance=Decimal("100.0000")
        )




@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request: Request) -> JsonResponse:
    """Returns a CSRF token for the frontend to use in subsequent requests."""
    return JsonResponse({'csrfToken': get_token(request)})


@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def initiate_login(request: Request) -> Response:
    """Authenticates a user and initiates the login process, dispatching an OTP if required."""
    username: str | None = request.data.get("username")
    password: str | None = request.data.get("password")

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=401)

    if not TWO_FACTOR_ENABLED:
        login(request=request, user=user)
        logger.info(f"Username: {username} logged in directly (2FA disabled)")
        return Response({'message': 'LoginPage Successful', 'two_factor_required': False}, status=200)

    otp: str = EmailToken.create_otp_token(user)
    send_otp_email_login(user, otp)
    logger.info(f"OTP dispatched for username: {username}")

    return Response({'message': 'OTP Sent to Email', 'two_factor_required': True}, status=200)


@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request: Request) -> Response:
    """Verifies the provided OTP and completes the login process."""
    if not TWO_FACTOR_ENABLED:
        return Response({'error': 'Two-factor authentication is not enabled'}, status=400)

    username: str | None = request.data.get("username")
    otp: str | None = request.data.get("otp")

    logger.info(f"OTP verification attempt for username: {username}")

    try:
        user = User.objects.get(email=username)
    except User.DoesNotExist:
        logger.warning(f"OTP verification failed — username not found: {username}")
        return Response({'error': 'User not found'}, status=404)

    if not EmailToken.verify_otp(user, otp):
        logger.warning(f"OTP verification failed — invalid or expired token for: {username}")
        return Response({'error': 'Invalid or expired OTP'}, status=401)

    login(request=request, user=user)
    logger.info(f"Username: {username} successfully logged in via OTP")

    return Response({'message': 'LoginPage Successful'}, status=200)


@api_view(['POST'])
def logout_view(request: Request) -> Response:
    """Logs out the currently authenticated user."""
    if request.user.is_authenticated:
        logout(request)
        return Response({'message': 'Logout Successful'}, status=200)

    return Response({'message': 'No active session to logout'})


@ratelimit(key='ip', rate='3/m', block=True)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request: Request) -> Response:
    logger.info("Register Endpoint Called")
    serialiser = RegisterSerialiser(data=request.data)

    if not serialiser.is_valid():
        logger.error(f"RegisterPage failed: {serialiser.errors}")
        return Response(serialiser.errors, status=400)

    user = serialiser.save()
    logger.info(f"User created: {user.email}")

    if not TWO_FACTOR_ENABLED:
        _activate_user_account(user)
        logger.info(f"User {user.email} auto-activated (2FA disabled)")
        return Response({'status': 'Account created and activated. You can now log in.'})

    send_activation_email(user)
    return Response({'status': 'User registered. Check your email to activate.'})

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def activate_user(request: Request, raw_token: str) -> HttpResponseRedirect:
    """Activates a user account via an email token and provisions an initial wallet."""
    if not raw_token:
        return redirect(f"{settings.FRONTEND_PATH}/")

    token_hash: str = EmailToken.hash_token(raw_token=raw_token)

    try:
        token_object = EmailToken.objects.select_related('user').get(token_hash=token_hash)
    except EmailToken.DoesNotExist:
        return redirect(f"{settings.FRONTEND_PATH}/login?status=invalid_token")

    if token_object.is_expired():
        token_object.delete()
        return redirect(f"{settings.FRONTEND_PATH}/login?status=expired")

    user = token_object.user
    _activate_user_account(user)
    token_object.delete()

    return redirect(f"{settings.FRONTEND_PATH}/login?status=activated")
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data(request: Request) -> Response:
    """Retrieves profile and role data for the currently authenticated user."""
    user_pk: int = request.user.pk

    try:
        user = User.objects.select_related('role').prefetch_related(
            'role__permissionmap_set__permission'
        ).get(pk=user_pk)
    except User.DoesNotExist:
        return Response({'message': f'User ({user_pk}) not found'}, status=404)

    serialiser = UserSerialiser(user)
    return Response(serialiser.data)