import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.user_tenant import UserTenantLink


class User(SQLModel, table=True):
    """Represents an authenticated user in the OmniRAG platform.

    A single User can belong to multiple Workspaces (Tenants) via
    the UserTenantLink join table. Authentication is handled via
    hashed password (JWT flow) or future OAuth provider.

    Attributes:
        id: Unique identifier for the user.
        email: Unique email address used for login and verification emails.
        hashed_password: bcrypt hash of the raw password. Never store plaintext.
        full_name: Display name of the user.
        is_verified: True once the user has confirmed their email address.
        is_active: False if the account has been suspended.
        email_verify_token: Short-lived OTP/token sent to user's email.
        email_verify_token_expires_at: UTC expiry for the verification token.
        created_at: Timestamp of account creation.
    """

    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(nullable=False, unique=True, max_length=255, index=True)
    hashed_password: str = Field(nullable=False)
    full_name: str = Field(nullable=False, max_length=255)
    is_verified: bool = Field(default=False, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    is_system_admin: bool = Field(default=False, nullable=False)

    # Email verification token (OTP / short token), nullable until verification is triggered
    email_verify_token: Optional[str] = Field(default=None, nullable=True, max_length=64)
    email_verify_token_expires_at: Optional[datetime] = Field(default=None, nullable=True)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    workspace_links: List["UserTenantLink"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
