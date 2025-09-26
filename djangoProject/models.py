from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

# DB WIDE ENUMS

class OrderSide(models.TextChoices):
    YES = "Y",
    NO = "N"

# MODELS

class Wallet(models.Model):
    id = models.AutoField(primary_key=True)
    points_balance = models.FloatField(validators=[MinValueValidator(0.0)])

class Roles(models.Model):
    id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50)

class Permissions(models.Model):
    id = models.AutoField(primary_key=True)
    permission_name = models.CharField(max_length=50)

class PermissionMap(models.Model):
    role = models.ForeignKey(Roles, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permissions, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('role', 'permission')

class Profiles(models.Model): # Django user model stores username and email and password natively
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    wallet = models.OneToOneField(Wallet)
    role = models.ForeignKey(Roles)

class AdminActions(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(Profiles, on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    occured_at = models.TimeField(auto_now_add=True)

class Markets(models.Model):
    id = models.AutoField(primary_key=True)
    market_name = models.CharField(max_length=255)
    open = models.BooleanField(default=True)

class Events(models.Model):
    id = models.AutoField(primary_key=True)
    market = models.ForeignKey(Markets, on_delete=models.CASCADE)
    event_name = models.CharField(max_length=255)
    created_at = models.TimeField(auto_now_add=True)
    expiration_date = models.TimeField(null=True)
    open = models.BooleanField(default=True)
    Price = models.FloatField(validators=[MinValueValidator(0.0)])
    Volume = models.IntegerField(validators=[MinValueValidator(0)])

class Orders(models.Model):
    
    class OrderStatus(models.TextChoices):
        ACTIVE = "A",
        FILLED = "F",
        CANCELLED = "C"

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Profiles)
    event = models.ForeignKey(Events)
    
    side = models.CharField(
        max_length=1,
        choices=OrderSide,
        default=OrderSide.YES,
    )

    price = models.FloatField(validators=[MinValueValidator(0.0)])
    amount = models.IntegerField(validators=[MinValueValidator(0)])

    status = models.CharField(
        max_length=1,
        choices=OrderStatus,
        default=OrderStatus.ACTIVE,
    )

    cancellation_time = models.TimeField(null=True, blank=True)
    created_at = models.TimeField(auto_now_add=True)

class Trades(models.Model):
    id = models.AutoField(primary_key=True)
    maker_order_id = models.ForeignKey(Orders)
    taker_order_id = models.ForeignKey(Orders)
    quantity_filled = models.IntegerField(validators=[MinValueValidator(0)])
    price = models.FloatField(validators=[MinValueValidator(0.0)])
    created_at = models.TimeField(auto_now_add=True)

class Positions(models.Model):
    event = models.ForeignKey(Events)
    user = models.ForeignKey(Profiles)
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    side = models.CharField(
        max_length=1,
        choices=OrderSide,
        default=OrderSide.YES,
    )
    avg_price = models.FloatField(validators=[MinValueValidator(0.0)])

    class Meta:
        unique_together = ('event', 'user')

    

