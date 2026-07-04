import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

# ─── Registration & Login ──────────────────────────────────────────────────────


class UserRegister(BaseModel):
    """Payload for new user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)

    @field_validator("password")
    @classmethod
    def password_must_not_be_whitespace(cls, v: str) -> str:
        if v.strip() != v:
            raise ValueError("Password must not start or end with whitespace")
        return v


class UserLogin(BaseModel):
    """Payload for user login."""

    email: EmailStr
    password: str


# ─── Email Verification ────────────────────────────────────────────────────────


class EmailVerifyRequest(BaseModel):
    """Payload to confirm email via OTP token."""

    token: str = Field(..., min_length=6, max_length=64)


class ResendVerificationRequest(BaseModel):
    """Payload to re-trigger verification email."""

    email: EmailStr


# ─── Token Responses ───────────────────────────────────────────────────────────


class TokenResponse(BaseModel):
    """JWT token pair returned after successful login or token refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Payload to exchange a refresh token for a new access token."""

    refresh_token: str


# ─── User Responses ────────────────────────────────────────────────────────────


class UserResponse(BaseModel):
    """Public representation of an authenticated user."""

    id: uuid.UUID
    email: str
    full_name: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
