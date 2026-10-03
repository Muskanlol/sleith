from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, UserRole, UserToken


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ("email", "full_name", "phone", "password", "password_confirm")

    def validate_email(self, value):
        value = value.lower().strip()
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(
            password=password,
            role=UserRole.CUSTOMER,
            **validated_data,
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            "id", "email", "full_name", "phone", "role",
            "photo", "photo_url",
            "is_active", "is_email_verified", "date_joined",
        )
        read_only_fields = (
            "id", "email", "role", "is_active",
            "is_email_verified", "date_joined", "photo_url",
        )
        extra_kwargs = {
            "photo": {"write_only": True, "required": False, "allow_null": True},
            "full_name": {"required": False},
            "phone": {"required": False},
        }

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = CustomUser.USERNAME_FIELD

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()