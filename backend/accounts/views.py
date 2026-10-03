from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, UserToken
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)

TOKEN_VALIDITY = timedelta(hours=24)


def _issue_token(user, token_type):
    UserToken.objects.filter(user=user, token_type=token_type, is_used=False).update(is_used=True)
    return UserToken.objects.create(
        user=user,
        token_type=token_type,
        expires_at=timezone.now() + TOKEN_VALIDITY,
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = _issue_token(user, UserToken.TokenType.EMAIL_VERIFY)
        send_mail(
            subject="Verify your SLEITH account",
            message=(
                f"Hi {user.full_name},\n\n"
                f"Verify your email using this token: {token.token}\n"
                f"Or visit: {settings.FRONTEND_URL}/verify-email?token={token.token}\n\n"
                f"This link expires in 24 hours."
            ),
            from_email=None,
            recipient_list=[user.email],
        )

        return Response(
            {
                "message": "Registration successful. Please verify your email.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"detail": "Invalid or already-expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class MeView(RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"message": "Password changed successfully."})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower().strip()

        user = CustomUser.objects.filter(email=email).first()
        if user:
            token = _issue_token(user, UserToken.TokenType.PASSWORD_RESET)
            send_mail(
                subject="Reset your SLEITH password",
                message=(
                    f"Reset your password using this token: {token.token}\n"
                    f"Or visit: {settings.FRONTEND_URL}/reset-password?token={token.token}\n\n"
                    f"This link expires in 24 hours. If you didn't request this, ignore this email."
                ),
                from_email=None,
                recipient_list=[user.email],
            )

        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data["token"]

        token = UserToken.objects.filter(
            token=token_value, token_type=UserToken.TokenType.PASSWORD_RESET
        ).first()

        if not token or not token.is_valid():
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user = token.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        token.is_used = True
        token.save(update_fields=["is_used"])

        return Response({"message": "Password reset successful. You can now log in."})


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data["token"]

        token = UserToken.objects.filter(
            token=token_value, token_type=UserToken.TokenType.EMAIL_VERIFY
        ).first()

        if not token or not token.is_valid():
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user = token.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

        token.is_used = True
        token.save(update_fields=["is_used"])

        return Response({"message": "Email verified successfully."})