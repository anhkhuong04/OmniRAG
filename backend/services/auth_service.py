"""
auth_service.py

Business logic for user registration, login, email verification,
and JWT token lifecycle management.

Design decisions:
  - Passwords are hashed with bcrypt via passlib.
  - Email verification uses a short random token stored on the User row.
  - In development the token is printed to the console logger so the project
    can be run without any SMTP server. The `send_verification_email` function
    is an abstraction point: swapping in a real mailer later requires changing
    only this function.
  - JWT access tokens are short-lived (30 min by default).
    Refresh tokens are long-lived (7 days by default).
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.models.user import User
from backend.schemas.auth import TokenResponse, UserRegister

logger = logging.getLogger(__name__)

# ─── Email Sending (abstraction layer) ────────────────────────────────────────


async def send_verification_email(user: User) -> None:
    """Sends an email verification token to the user.

    Development behaviour: logs the token to the console instead of sending
    a real email. To integrate a real mail provider (SendGrid, SES, SMTP),
    replace the body of this function without changing any call sites.

    Args:
        user: The User object containing `email` and `email_verify_token`.
    """
    # TODO: Replace with real mailer (SendGrid / SMTP) in production.
    logger.warning(
        "========== [DEV] EMAIL VERIFICATION TOKEN ==========\n"
        "  To: %s\n"
        "  Token: %s\n"
        "  Expires in %d minutes\n"
        "====================================================",
        user.email,
        user.email_verify_token,
        settings.EMAIL_VERIFY_TOKEN_TTL_MINUTES,
    )


# ─── Registration ──────────────────────────────────────────────────────────────


async def register_user(db: AsyncSession, payload: UserRegister) -> User:
    """Creates a new user account and triggers email verification.

    Args:
        db: Active async database session.
        payload: Validated registration data (email, password, full_name).

    Returns:
        The newly created, uncommitted User object.

    Raises:
        HTTPException 409: If the email address is already registered.
    """
    # Check uniqueness
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.EMAIL_VERIFY_TOKEN_TTL_MINUTES
    )

    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        email_verify_token=token,
        email_verify_token_expires_at=expires_at,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info("Registered new user: id=%s email=%s", new_user.id, new_user.email)
    await send_verification_email(new_user)
    return new_user


# ─── Email Verification ────────────────────────────────────────────────────────


async def verify_user_email(db: AsyncSession, token: str) -> User:
    """Marks the user's email as verified after confirming the OTP token.

    Args:
        db: Active async database session.
        token: The raw verification token submitted by the user.

    Returns:
        The updated, verified User object.

    Raises:
        HTTPException 400: If the token is invalid or has expired.
    """
    result = await db.execute(
        select(User).where(User.email_verify_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token.",
        )

    if user.email_verify_token_expires_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has no expiry — please request a new one.",
        )

    # Make expiry offset-aware for comparison
    expiry = user.email_verify_token_expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new one.",
        )

    user.is_verified = True
    user.email_verify_token = None
    user.email_verify_token_expires_at = None
    user.updated_at = datetime.now(timezone.utc)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info("Email verified for user: id=%s email=%s", user.id, user.email)
    return user


async def resend_verification_email(db: AsyncSession, email: str) -> None:
    """Re-generates and re-sends the verification token for a given email.

    Invalidates the old token by replacing it with a fresh one.

    Args:
        db: Active async database session.
        email: The email address to resend verification to.

    Raises:
        HTTPException 400: If the account is already verified or not found.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Return silently to avoid user enumeration
        logger.warning("Resend verification requested for unknown email: %s", email)
        return

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already verified.",
        )

    # Invalidate old token, generate new one
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.EMAIL_VERIFY_TOKEN_TTL_MINUTES
    )
    user.email_verify_token = token
    user.email_verify_token_expires_at = expires_at
    user.updated_at = datetime.now(timezone.utc)

    db.add(user)
    await db.commit()
    await db.refresh(user)

    await send_verification_email(user)


# ─── Login & Token Issuance ────────────────────────────────────────────────────


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """Validates email/password credentials and returns the authenticated user.

    Args:
        db: Active async database session.
        email: The user's email address.
        password: The raw (unhashed) password from the login form.

    Returns:
        The authenticated User object.

    Raises:
        HTTPException 401: If credentials are invalid or the account is inactive.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Use a constant-time path to prevent user enumeration via timing attacks
    _dummy_hash = "$2b$12$KIXdummy.hash.to.prevent.timing.attacks.placeholder00"
    if not user:
        verify_password(password, _dummy_hash)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
        )

    return user


def issue_token_pair(user: User) -> TokenResponse:
    """Creates and returns a fresh access + refresh token pair for a user.

    Args:
        user: The authenticated User object.

    Returns:
        A TokenResponse containing signed access and refresh tokens.
    """
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


# ─── Token Refresh ─────────────────────────────────────────────────────────────


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Validates a refresh token and issues a new access + refresh token pair.

    Rotating the refresh token on each use limits the window for token theft.

    Args:
        db: Active async database session.
        refresh_token: The refresh token string submitted by the client.

    Returns:
        A fresh TokenResponse.

    Raises:
        HTTPException 401: If the token is invalid, expired, or not a refresh token.
    """
    from jose import JWTError

    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )

    return issue_token_pair(user)
