import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.user import User
    from backend.models.tenant import Tenant


class TenantRole(str, enum.Enum):
    """Roles a user can hold within a Tenant (Organization).

    - OWNER: Full control; can delete the tenant and manage billing.
    - ADMIN: Can manage members, workspaces, and settings.
    - BILLING_MANAGER: Can manage billing and subscription.
    - MEMBER: Standard member, can access assigned workspaces.
    """

    OWNER = "owner"
    ADMIN = "admin"
    BILLING_MANAGER = "billing_manager"
    MEMBER = "member"


class UserTenantLink(SQLModel, table=True):
    """Many-to-Many join table linking Users to Tenants (Workspaces).

    This table is the core of the multi-tenant RBAC system. Every user
    action on tenant-scoped data must be validated against this table
    before being executed.

    Attributes:
        user_id: FK to the User performing the action.
        tenant_id: FK to the Tenant (Workspace) being accessed.
        role: The user's permission level within this workspace.
        joined_at: Timestamp when the user was added to the workspace.
    """

    __tablename__ = "user_tenant_links"

    # Composite primary key
    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    tenant_id: uuid.UUID = Field(foreign_key="tenants.id", primary_key=True)

    role: TenantRole = Field(default=TenantRole.MEMBER, nullable=False)
    joined_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="workspace_links")
    tenant: "Tenant" = Relationship(back_populates="member_links")
