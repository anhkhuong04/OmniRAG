import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from backend.api.dependencies import AdminKeyDep, DBSessionDep
from backend.core.security import generate_api_key, hash_api_key
from backend.models.api_key import APIKey
from backend.models.tenant import Tenant
from backend.schemas.admin import (
    APIKeyCreate,
    APIKeyCreateResponse,
    APIKeyResponse,
    TenantCreate,
    TenantResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/tenants", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    request: TenantCreate,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Creates a new Tenant. Requires Admin Key in `X-Admin-Key` header."""
    new_tenant = Tenant(name=request.name)
    session.add(new_tenant)
    await session.commit()
    await session.refresh(new_tenant)
    logger.info("Created new tenant: id=%s name='%s'", new_tenant.id, new_tenant.name)
    return new_tenant


@router.post(
    "/tenants/{tenant_id}/api-keys",
    response_model=APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_api_key(
    tenant_id: uuid.UUID,
    request: APIKeyCreate,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Creates and returns a new API key for a given Tenant.

    IMPORTANT: The raw API key is returned ONLY in this response.
    It is hashed before being stored — it cannot be recovered later.
    """
    # Verify the target tenant exists
    tenant = await session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found.")

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)

    new_key = APIKey(
        tenant_id=tenant_id,
        key_hash=key_hash,
        name=request.name,
    )
    session.add(new_key)
    await session.commit()
    await session.refresh(new_key)
    logger.info(
        "Created API key: id=%s name='%s' for tenant=%s", new_key.id, new_key.name, tenant_id
    )

    return APIKeyCreateResponse(
        id=new_key.id,
        tenant_id=new_key.tenant_id,
        name=new_key.name,
        is_active=new_key.is_active,
        created_at=new_key.created_at,
        raw_key=raw_key,  # Exposed only here, only once
    )


@router.delete("/api-keys/{key_id}", response_model=APIKeyResponse)
async def revoke_api_key(
    key_id: uuid.UUID,
    _: AdminKeyDep,
    session: DBSessionDep,
):
    """Revokes an API key by setting is_active=False.

    The key record is kept in the database for audit purposes.
    """
    api_key = await session.get(APIKey, key_id)
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")

    if not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="API key is already deactivated."
        )

    api_key.is_active = False
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    logger.info("Revoked API key: id=%s for tenant=%s", key_id, api_key.tenant_id)
    return api_key


# ─── System Admin Panel Operations ──────────────────────────────────────────────

from typing import Any
from backend.api.dependencies import SystemAdminDep
from backend.services import admin_service

@router.get("/system/tenants")
async def list_tenants(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    return await admin_service.get_tenants(db, skip, limit)

@router.get("/system/workspaces")
async def list_workspaces(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    return await admin_service.get_workspaces(db, skip, limit)

@router.post("/system/tenants/{tenant_id}/disable")
async def disable_tenant(
    tenant_id: str,
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    return await admin_service.toggle_tenant_status(
        db, tenant_id, is_active=False, admin_user_id=str(admin_user.id)
    )

@router.post("/system/tenants/{tenant_id}/enable")
async def enable_tenant(
    tenant_id: str,
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    return await admin_service.toggle_tenant_status(
        db, tenant_id, is_active=True, admin_user_id=str(admin_user.id)
    )

@router.post("/system/tenants/{tenant_id}/impersonate")
async def impersonate_tenant(
    tenant_id: str,
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    # Verify tenant exists
    tenant_uuid = uuid.UUID(tenant_id)
    tenant = await db.get(Tenant, tenant_uuid)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    from backend.core.security import create_access_token
    token = create_access_token(user_id=str(admin_user.id), impersonate_tenant_id=tenant_id)
    
    # Log it
    from backend.models.admin_audit_log import AdminAuditLog
    audit_log = AdminAuditLog(
        actor_user_id=admin_user.id,
        action="impersonate",
        target_type="tenant",
        target_id=tenant_uuid,
    )
    db.add(audit_log)
    await db.commit()
    
    return {"access_token": token, "token_type": "bearer", "impersonated_tenant_id": tenant_id}


# ─── Plan Management ──────────────────────────────────────────────────────────

from backend.models.subscription import Plan
from backend.schemas.workspace import PlanResponse
from backend.schemas.admin import PlanUpdate

@router.get("/system/plans", response_model=list[PlanResponse])
async def list_plans(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
):
    result = await db.execute(select(Plan).order_by(Plan.price_usd_monthly.asc()))
    return result.scalars().all()


@router.put("/system/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    payload: PlanUpdate,
    db: DBSessionDep,
    admin_user: SystemAdminDep,
):
    plan = await db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)
        
    db.add(plan)
    
    # Log it
    from backend.models.admin_audit_log import AdminAuditLog
    audit_log = AdminAuditLog(
        actor_user_id=admin_user.id,
        action="update_plan",
        target_type="plan",
        target_id=plan.id,
        metadata_json=update_data
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(plan)
    return plan

@router.get("/system/usage-summary")
async def get_system_usage_summary(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    return await admin_service.get_system_usage(db)

@router.get("/system/kpis")
async def get_system_kpis(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    return await admin_service.get_system_kpis(db)


from backend.models.admin_audit_log import AdminAuditLog
from sqlalchemy import desc

@router.get("/system/audit-logs")
async def get_audit_logs(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
    limit: int = 100
) -> Any:
    result = await db.execute(
        select(AdminAuditLog)
        .order_by(desc(AdminAuditLog.created_at))
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/system/ingestion/failed-jobs")
async def list_failed_jobs(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    return await admin_service.get_failed_jobs(db, skip, limit)

@router.post("/system/ingestion/{document_id}/retry")
async def retry_failed_job(
    document_id: str,
    db: DBSessionDep,
    admin_user: SystemAdminDep,
) -> Any:
    return await admin_service.retry_failed_job(
        db, document_id, admin_user_id=str(admin_user.id)
    )

@router.get("/system/audit-logs")
async def list_audit_logs(
    db: DBSessionDep,
    admin_user: SystemAdminDep,
    skip: int = 0,
    limit: int = 50,
) -> Any:
    return await admin_service.get_audit_logs(db, skip, limit)
