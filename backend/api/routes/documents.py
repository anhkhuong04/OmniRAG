import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from backend.api.dependencies import DBSessionDep, TenantIDDep
from backend.models.document import Document
from backend.schemas.document import DocumentIngestRequest, DocumentResponse
from backend.services.document_service import document_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/ingest", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document(
    request: DocumentIngestRequest,
    tenant_id_str: TenantIDDep,
    session: DBSessionDep,
):
    """
    Nhận tài liệu dạng text, lưu metadata vào Postgres và nạp vector vào Qdrant.
    """
    tenant_id = uuid.UUID(tenant_id_str)
    
    # 1. Tạo record Document trong Postgres (trạng thái 'processing')
    doc_id = uuid.uuid4()
    new_doc = Document(
        id=doc_id,
        tenant_id=tenant_id,
        filename=request.filename,
        file_type="txt",  # Currently hardcoded for raw text
        status="processing",
    )
    
    session.add(new_doc)
    await session.commit()
    await session.refresh(new_doc)
    
    try:
        # 2. Xử lý RAG: Chunking và Vectorizing
        chunks_ingested = await document_service.ingest_text(
            tenant_id=str(tenant_id),
            document_id=str(doc_id),
            text=request.text,
            filename=request.filename,
        )
        
        # 3. Cập nhật trạng thái thành công
        new_doc.status = "completed"
        new_doc.chunk_count = chunks_ingested
        new_doc.updated_at = datetime.utcnow()
        session.add(new_doc)
        await session.commit()
        await session.refresh(new_doc)
        
        return new_doc
        
    except Exception as e:
        logger.error(f"Error ingesting document {doc_id}: {e}")
        # Đánh dấu lỗi
        new_doc.status = "failed"
        new_doc.updated_at = datetime.utcnow()
        session.add(new_doc)
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {str(e)}",
        )
