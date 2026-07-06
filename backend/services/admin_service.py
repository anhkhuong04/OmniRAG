import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.tenant import Tenant
from backend.models.document import Document
from backend.models.usage_log import UsageLog
from backend.models.admin_audit_log import AdminAuditLog
from backend.models.workspace import Workspace
from backend.services import document_service


async def get_tenants(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
    """List tenants with basic stats."""
    result = await db.execute(
        select(Tenant).order_by(desc(Tenant.created_at)).offset(skip).limit(limit)
    )
    tenants = result.scalars().all()
    
    # For MVP, we just return basic fields, could join with documents/usage for counts
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "is_active": t.is_active,
            "created_at": t.created_at,
        }
        for t in tenants
    ]


async def get_workspaces(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
    """List workspaces with basic stats."""
    result = await db.execute(
        select(Workspace).order_by(desc(Workspace.created_at)).offset(skip).limit(limit)
    )
    workspaces = result.scalars().all()
    
    return [
        {
            "id": str(w.id),
            "tenant_id": str(w.tenant_id),
            "name": w.name,
            "is_active": w.is_active,
            "created_at": w.created_at,
        }
        for w in workspaces
    ]


async def toggle_tenant_status(
    db: AsyncSession, tenant_id: str, is_active: bool, admin_user_id: str
) -> Dict[str, Any]:
    """Enable or disable a tenant and log it."""
    tenant_uuid = uuid.UUID(tenant_id)
    tenant = await db.get(Tenant, tenant_uuid)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )
    
    if tenant.is_active == is_active:
        return {"status": "unchanged", "is_active": is_active}
        
    tenant.is_active = is_active
    db.add(tenant)
    
    # Write audit log
    action = "tenant_enabled" if is_active else "tenant_disabled"
    audit_log = AdminAuditLog(
        actor_user_id=uuid.UUID(admin_user_id),
        action=action,
        target_type="tenant",
        target_id=tenant_uuid,
    )
    db.add(audit_log)
    
    await db.commit()
    return {"status": "success", "is_active": is_active}


async def get_failed_jobs(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
    """List documents with 'failed' status."""
    result = await db.execute(
        select(Document)
        .where(Document.status == "failed")
        .order_by(desc(Document.updated_at))
        .offset(skip).limit(limit)
    )
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "tenant_id": str(d.tenant_id),
            "filename": d.filename,
            "error_message": d.error_message,
            "updated_at": d.updated_at,
        }
        for d in docs
    ]


async def retry_failed_job(
    db: AsyncSession, document_id: str, admin_user_id: str
) -> Dict[str, Any]:
    """Retry a failed document ingestion by an admin."""
    # Ensure it's a valid uuid and document exists
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID format")

    doc = await db.get(Document, doc_uuid)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delegate to document_service
    retry_result = await document_service.retry_ingestion(db, str(doc.tenant_id), str(doc_uuid))
    
    # Log it
    audit_log = AdminAuditLog(
        actor_user_id=uuid.UUID(admin_user_id),
        action="retry_failed_job",
        target_type="document",
        target_id=doc_uuid,
    )
    db.add(audit_log)
    await db.commit()
    
    return {"status": "retried", "document_id": document_id}


async def get_system_usage(db: AsyncSession) -> Dict[str, Any]:
    """Get total usage stats for the system."""
    # Total tokens overall
    res = await db.execute(
        select(
            func.sum(UsageLog.prompt_tokens).label("total_prompt"),
            func.sum(UsageLog.completion_tokens).label("total_completion"),
            func.sum(UsageLog.cost_usd).label("total_cost"),
            func.count(UsageLog.id).label("total_queries"),
        )
    )
    row = res.one()
    return {
        "total_prompt_tokens": row.total_prompt or 0,
        "total_completion_tokens": row.total_completion or 0,
        "total_cost_usd": float(row.total_cost or 0.0),
        "total_operations": row.total_queries or 0,
    }


async def get_system_kpis(db: AsyncSession) -> Dict[str, Any]:
    """Get high-level KPIs for the Platform Dashboard."""
    from backend.models.user import User
    from backend.models.subscription import Subscription
    
    # Count Workspaces
    total_tenants = await db.scalar(select(func.count(Tenant.id)))
    active_tenants = await db.scalar(select(func.count(Tenant.id)).where(Tenant.is_active == True))
    
    # Count Users
    total_users = await db.scalar(select(func.count(User.id)))
    active_users = await db.scalar(select(func.count(User.id)).where(User.is_active == True))
    
    # Count Documents
    total_documents = await db.scalar(select(func.count(Document.id)))
    
    # MRR Estimation (sum of active subscriptions prices, assumes we have plans joined)
    # Since we need to join Subscription and Plan to get the price, we'll do it if possible
    # For now, we can just do a basic join or return 0 if complicated
    # Wait, the `admin_service.py` can import `Plan` and `Subscription`
    from backend.models.subscription import Plan
    mrr_res = await db.execute(
        select(func.sum(Plan.price_usd_monthly))
        .select_from(Subscription)
        .join(Plan)
        .where(Subscription.status == "active")
    )
    mrr = mrr_res.scalar() or 0.0
    
    # Usage Stats (Total Cost)
    usage_res = await db.execute(select(func.sum(UsageLog.cost_usd)))
    total_ai_cost = usage_res.scalar() or 0.0

    return {
        "total_workspaces": total_tenants or 0,
        "active_workspaces": active_tenants or 0,
        "total_users": total_users or 0,
        "active_users": active_users or 0,
        "total_documents": total_documents or 0,
        "mrr_usd": float(mrr),
        "total_ai_cost_usd": float(total_ai_cost),
    }


async def get_audit_logs(db: AsyncSession, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
    """List audit logs."""
    result = await db.execute(
        select(AdminAuditLog).order_by(desc(AdminAuditLog.created_at)).offset(skip).limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "actor_user_id": str(log.actor_user_id),
            "action": log.action,
            "target_type": log.target_type,
            "target_id": str(log.target_id),
            "metadata_json": log.metadata_json,
            "created_at": log.created_at,
        }
        for log in logs
    ]
