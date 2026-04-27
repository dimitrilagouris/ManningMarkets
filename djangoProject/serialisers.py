import re
from rest_framework import serializers
from .models import Profiles
from .utils.emails import send_activation_email

class RegisterSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Profiles
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        user = Profiles.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False,
        )
        # send_activation_email(user)
        return user

class UserSerialiser(serializers.ModelSerializer):
    is_admin = serializers.ReadOnlyField()
    permissions = serializers.ReadOnlyField(source='permissions_dict')

    class Meta:
        model = Profiles
        fields = ('id', 'email', 'is_admin', 'permissions')
        read_only_fields = fields