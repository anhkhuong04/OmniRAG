import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from backend.models.user import User
    from backend.models.workspace import Workspace

class WorkspaceRole(str, enum.Enum):
    """Roles a user can hold within a Workspace.

    - ADMIN: Can manage workspace settings, members, and all data.
    - EDITOR: Can upload/edit/delete documents and prompts.
    - MEMBER: Can chat and use the Knowledge Base.
    - VIEWER: Read-only access to chats.
    """

    ADMIN = "admin"
    EDITOR = "editor"
    MEMBER = "member"
    VIEWER = "viewer"

class UserWorkspaceLink(SQLModel, table=True):
    """Link table between Users and Workspaces with Roles.
    
    Attributes:
        user_id: Foreign key to the User.
        workspace_id: Foreign key to the Workspace.
        role: Role of the user in this workspace.
        created_at: Timestamp when the user was added to the workspace.
    """
    
    __tablename__ = "user_workspaces"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True)
    workspace_id: uuid.UUID = Field(foreign_key="workspaces.id", primary_key=True)
    role: WorkspaceRole = Field(default=WorkspaceRole.VIEWER, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationships
    user: "User" = Relationship(back_populates="workspace_links")
    workspace: "Workspace" = Relationship(back_populates="member_links")
