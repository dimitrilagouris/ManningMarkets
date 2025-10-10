import secrets
import hashlib

from datetime import timedelta
from django.utils import timezone
from ..models import EmailToken

def create_email_token(user, purpose='activation', expiry_minutes=30):
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    EmailToken.objects.create(
        user=user,
        token_hash=token_hash,
        purpose=purpose,
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
    )

    return raw_token

def verify_email_token(user, raw_token, purpose='activation'):
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    try:
        token = EmailToken.objects.get(user=user, token_hash=token_hash, purpose=purpose)
        if token.is_expired():
            return False
        token.delete()
        return True
    except EmailToken.DoesNotExist:
        return False