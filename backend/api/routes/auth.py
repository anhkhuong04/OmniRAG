"""Auth routes: register, login, email verify, token refresh, me."""

import logging

from fastapi import APIRouter, HTTPException, status

from backend.api.dependencies import CurrentUserDep, DBSessionDep
from backend.schemas.auth import (
    EmailVerifyRequest,
    RefreshTokenRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from backend.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, session: DBSessionDep):
    """Registers a new user account.

    After registration a verification email is sent (logged to console in dev).
    The account is usable for login immediately, but workspace creation requires
    email verification.
    """
    user = await auth_service.register_user(session, payload)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, session: DBSessionDep):
    """Authenticates user credentials and returns a JWT token pair.

    Returns an access token (short-lived) and a refresh token (long-lived).
    Store the refresh token securely on the client side.
    """
    user = await auth_service.authenticate_user(session, payload.email, payload.password)
    tokens = auth_service.issue_token_pair(user)
    logger.info("User logged in: id=%s email=%s", user.id, user.email)
    return tokens


@router.post("/verify-email", response_model=UserResponse)
async def verify_email(payload: EmailVerifyRequest, session: DBSessionDep):
    """Confirms the user's email address using the verification token.

    The token is delivered via email (logged to console in dev mode).
    Tokens expire after EMAIL_VERIFY_TOKEN_TTL_MINUTES.
    """
    user = await auth_service.verify_user_email(session, payload.token)
    return user


@router.post("/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
async def resend_verification(payload: ResendVerificationRequest, session: DBSessionDep):
    """Re-sends the verification email with a fresh token.

    Silently succeeds even if the email is not registered (prevents enumeration).
    """
    await auth_service.resend_verification_email(session, payload.email)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest, session: DBSessionDep):
    """Exchanges a refresh token for a new access + refresh token pair.

    The old refresh token is effectively invalidated by rotation.
    """
    tokens = await auth_service.refresh_access_token(session, payload.refresh_token)
    return tokens


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUserDep):
    """Returns the profile of the currently authenticated user.

    Requires a valid JWT access token in the Authorization header.
    """
    return current_user
