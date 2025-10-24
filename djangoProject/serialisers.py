from django.conf import settings

from rest_framework import serializers
from .models import Profiles

from django.utils.crypto import get_random_string
from .utils.emails import send_activation_email

class RegisterSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Profiles
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Profiles.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False,
        )

        send_activation_email(user)
        return user

class UserSerialiser(serializers.ModelSerializer):
    is_admin = serializers.ReadOnlyField()
    permissions = serializers.ReadOnlyField(source='permissions_dict')

    class Meta:
        model = Profiles
        fields = ('id', 'email', 'is_admin', 'permissions')
        read_only_fields = fields