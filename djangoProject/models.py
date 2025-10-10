from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal
from datetime import timedelta
import hashlib
import random


# DB WIDE ENUMS

class OrderSide(models.TextChoices):
    YES = "Y", "Yes"
    NO = "N", "No"

# MODELS

class Roles(models.Model):
    id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)

class Permissions(models.Model):
    id = models.AutoField(primary_key=True)
    permission_name = models.CharField(max_length=50, unique=True)

class PermissionMap(models.Model):
    role = models.ForeignKey(Roles, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permissions, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('role', 'permission')

class Profiles(AbstractUser): # Django user model stores username and email and password natively
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Roles, on_delete=models.SET_NULL, null=True)
    email_verified = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=16, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def assign_admin_role(self):
        try:
            user_role = Roles.objects.get(role_name="admin user")
            self.role = user_role
        except Roles.DoesNotExist:
            print("Role doesnt exist")

    def assign_default_role(self):
        try:
            user_role = Roles.objects.get(role_name="admin user")
            self.role = user_role
        except Roles.DoesNotExist:
            print("Role doesnt exist")

    @property
    def is_admin(self):
        return getattr(self.role, 'role_name', '').lower() == 'admin user'
    
    @property
    def permissions_dict(self):
        if not self.role:
            return {}
        return {
            perm.permission.permission_name: True
            for perm in self.role.permissionmap_set.all()
        }
    

class EmailToken(models.Model):
    user = models.ForeignKey(Profiles, on_delete=models.CASCADE, related_name="email_tokens")
    token_hash = models.CharField(max_length=64)
    purpose = models.CharField(max_length=32, default='activation')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode()).hexdigest()
    
    def __str__(self):
        return f"{self.purpose} token for {self.user.email}"
    
    @classmethod
    def create_otp_token(EmailToken, user):
        otp = f"{random.randint(100000,999999)}"
        token_hash = EmailToken.hash_token(otp)
        expiry = timezone.now() + timedelta(minutes=10)

        EmailToken.objects.create(
            user = user,
            token_hash = token_hash,
            expires_at = expiry,
            purpose = "otp"
        )
        return otp
    
    @classmethod
    def verify_otp(EmailToken, user, raw_otp):
        token_hash = EmailToken.hash_token(raw_otp)
        try:
            token = EmailToken.objects.get(user=user, token_hash=token_hash, purpose="otp")
        except EmailToken.DoesNotExist:
            return False
        
        if token.expires_at < timezone.now():
            token.delete()
            return False
        token.delete()
        return True

class Wallet(models.Model):
    id = models.AutoField(primary_key=True)
    points_balance = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal("0.0"))])

    profile = models.OneToOneField(Profiles, on_delete=models.CASCADE)

class AdminActions(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Profiles, on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    occured_at = models.DateTimeField(auto_now_add=True)

class Markets(models.Model):
    id = models.AutoField(primary_key=True)
    market_name = models.CharField(max_length=255, unique=True)
    open = models.BooleanField(default=True)
    volume = models.IntegerField(validators=[MinValueValidator(0)])

class Events(models.Model):
    id = models.AutoField(primary_key=True)
    market = models.ForeignKey(Markets, on_delete=models.CASCADE, related_name="events")
    event_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField(null=True)
    open = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal("0.0"))])

    volume = models.IntegerField(validators=[MinValueValidator(0)])


class Orders(models.Model):
    
    class OrderStatus(models.TextChoices):
        ACTIVE = "ACTIVE"
        FILLED = "FILLED"
        PARTIALLY_FILLED = "PARTIALLY_FILLED"
        CANCELLED = "CANCELLED"

    class OrderType(models.TextChoices):
        BUY = "BUY"
        SELL = "SELL"

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Profiles, on_delete=models.PROTECT)
    event = models.ForeignKey(Events, on_delete=models.PROTECT)
    
    # Order type: BUY or SELL
    order_type = models.CharField(
        max_length=4,
        choices=OrderType.choices,
        default=OrderType.BUY
    )
    
    # Share type: YES or NO
    share_type = models.CharField(
        max_length=1,
        choices=OrderSide.choices,
        default=OrderSide.YES,
    )

    price = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0)])

    # Amount is the initial quantity of shares sent to the matching engine, remaining quantity exists to track how many shares are left to be filled
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    remaining_quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.ACTIVE,
    )

    cancellation_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if self.remaining_quantity is None:
            self.remaining_quantity = self.amount
        super().save(*args, **kwargs)

class Trades(models.Model):
    id = models.AutoField(primary_key=True)
    maker_order_id = models.ForeignKey(Orders, related_name='maker_trades', on_delete=models.PROTECT)
    taker_order_id = models.ForeignKey(Orders, related_name='taker_trades', on_delete=models.PROTECT)
    quantity_filled = models.IntegerField(validators=[MinValueValidator(0)])
    price = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal("0.0"))])

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class Positions(models.Model):
    event = models.ForeignKey(Events, on_delete=models.PROTECT)
    user = models.ForeignKey(Profiles, on_delete=models.PROTECT, related_name="user_positions")
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    side = models.CharField(
        max_length=1,
        choices=OrderSide.choices,
        default=OrderSide.YES,
    )
    avg_price = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal("0.0"))])

    class Meta:
        unique_together = ('event', 'user')
