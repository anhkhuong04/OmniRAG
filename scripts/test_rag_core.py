"""
RAG Core Verification Script (Updated for Phase 6 Architecture).

This script validates the full RAG pipeline end-to-end without any API layer.
It specifically tests:
    1. Database tables and Qdrant collection initialization.
    2. Document ingestion for two separate tenants (saving to both Postgres and Qdrant).
    3. Tenant data isolation — Tenant A must NOT retrieve Tenant B's knowledge.
    4. Correct retrieval and answer generation for each tenant (incorporating semantic cache and hybrid search).

Usage:
    Ensure PostgreSQL is running.
    Ensure Qdrant is running locally at http://localhost:6333
    Set OPENAI_API_KEY in a .env file at the project root.

    python scripts/test_rag_core.py
"""

import asyncio
import logging
import os
import sys
import uuid
from sqlalchemy import delete

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import create_db_and_tables, async_session_maker
from backend.models.tenant import Tenant
from backend.models.document import Document
from backend.models.document_chunk import DocumentChunk
from backend.services.vector_service import vector_service
from backend.services.document_service import document_service
from backend.services.rag_service import rag_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("test_rag_core")

TENANT_A_ID = str(uuid.uuid4())
TENANT_B_ID = str(uuid.uuid4())

# --- Sample knowledge bases ---
TENANT_A_DOCUMENT = """
Chính sách Đổi Trả Hàng - Cửa Hàng ABC

1. Thời gian đổi trả: Khách hàng có thể đổi hoặc trả hàng trong vòng 7 ngày kể từ ngày nhận sản phẩm.
2. Điều kiện: Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng, còn đầy đủ tem nhãn và bao bì gốc.
3. Phương thức hoàn tiền: Khách hàng sẽ nhận được hoàn tiền 100% vào tài khoản ngân hàng trong vòng 3-5 ngày làm việc.
4. Sản phẩm không được đổi trả: Đồ lót, sản phẩm dễ hỏng (thực phẩm), và phần mềm đã kích hoạt bản quyền.
5. Liên hệ đổi trả: Gọi đến hotline 1800-ABC hoặc email support@abc-store.com.
"""

TENANT_B_DOCUMENT = """
Chính sách Bảo Hành Sản Phẩm - Công Ty XYZ

1. Thời gian bảo hành: Tất cả sản phẩm điện tử của XYZ được bảo hành chính hãng trong 24 tháng kể từ ngày mua.
2. Phạm vi bảo hành: Bao gồm lỗi do nhà sản xuất, linh kiện bị lỗi trong điều kiện sử dụng bình thường.
3. Không được bảo hành: Hư hại do va đập vật lý, tiếp xúc nước, tự ý tháo lắp, hoặc sử dụng điện áp không đúng quy định.
4. Thủ tục: Mang sản phẩm, hóa đơn mua hàng và phiếu bảo hành gốc đến bất kỳ trung tâm bảo hành XYZ nào.
5. Liên hệ: Hotline bảo hành 1900-XYZ, thứ 2 - thứ 7, 8:00 - 20:00.
"""


async def run_verification():
    print("\n" + "=" * 70)
    print("  OmniRAG Core Verification Script (Advanced RAG)")
    print("=" * 70)

    # Step 1: Initialize DB & Qdrant collection
    print("\n[Step 1] Initializing DB tables and Qdrant collection...")
    await create_db_and_tables()
    await vector_service.create_collection_if_not_exists()
    print("  [OK] Infrastructure ready.\n")

    # Step 2: Create tenants and documents in DB
    print("[Step 2] Registering tenants & documents in Postgres...")
    doc_a_id = str(uuid.uuid4())
    doc_b_id = str(uuid.uuid4())

    async with async_session_maker() as db:
        tenant_a = Tenant(id=uuid.UUID(TENANT_A_ID), name="Tenant ABC Store")
        tenant_b = Tenant(id=uuid.UUID(TENANT_B_ID), name="Tenant XYZ Electronics")
        db.add(tenant_a)
        db.add(tenant_b)
        await db.commit()

        document_a = Document(
            id=uuid.UUID(doc_a_id),
            tenant_id=uuid.UUID(TENANT_A_ID),
            filename="chinh-sach-doi-tra.txt",
            file_type="txt",
            status="processing"
        )
        document_b = Document(
            id=uuid.UUID(doc_b_id),
            tenant_id=uuid.UUID(TENANT_B_ID),
            filename="chinh-sach-bao-hanh.txt",
            file_type="txt",
            status="processing"
        )
        db.add(document_a)
        db.add(document_b)
        await db.commit()
    print("  [OK] Tenants and documents registered.\n")

    # Step 3: Ingest documents
    async with async_session_maker() as db:
        print(f"[Step 3] Ingesting Tenant A document (ID: {doc_a_id[:8]}...)...")
        chunks_a = await document_service.ingest_text(
            tenant_id=TENANT_A_ID,
            document_id=doc_a_id,
            text=TENANT_A_DOCUMENT,
            filename="chinh-sach-doi-tra.txt",
            db_session=db,
        )
        print(f"  [OK] Tenant A: Ingested {chunks_a} chunks.\n")

        print(f"[Step 4] Ingesting Tenant B document (ID: {doc_b_id[:8]}...)...")
        chunks_b = await document_service.ingest_text(
            tenant_id=TENANT_B_ID,
            document_id=doc_b_id,
            text=TENANT_B_DOCUMENT,
            filename="chinh-sach-bao-hanh.txt",
            db_session=db,
        )
        print(f"  [OK] Tenant B: Ingested {chunks_b} chunks.\n")

    # Step 4: Isolation Test — Tenant A queries its OWN knowledge
    print("=" * 70)
    print("[Test 1] Tenant A queries its own knowledge (should SUCCEED)...")
    query_a = "Tôi muốn đổi trả hàng, thời gian là bao lâu và điều kiện như thế nào?"
    
    async with async_session_maker() as db:
        result_a = await rag_service.generate_answer(tenant_id=TENANT_A_ID, query=query_a, db_session=db)
    print(f"  Query:  {query_a}")
    print(f"  Answer: {result_a['answer']}")
    print(f"  Sources used: {len(result_a['sources'])} chunk(s)\n")

    # Step 5: Isolation Test — Tenant A queries Tenant B's knowledge (must FAIL)
    print("=" * 70)
    print("[Test 2] Tenant A queries Tenant B's knowledge (should FAIL/return no info)...")
    query_b_from_a = "Sản phẩm được bảo hành bao nhiêu tháng và điều kiện là gì?"
    
    async with async_session_maker() as db:
        result_b_from_a = await rag_service.generate_answer(tenant_id=TENANT_A_ID, query=query_b_from_a, db_session=db)
    print(f"  Query:  {query_b_from_a}")
    print(f"  Answer: {result_b_from_a['answer']}")
    print(f"  Sources used: {len(result_b_from_a['sources'])} chunk(s)")

    # Verify isolation
    retrieved_b_docs = [src for src in result_b_from_a["sources"] if src.get("document_id") == doc_b_id]
    if not retrieved_b_docs:
        print("  [OK] ISOLATION PASSED: Tenant A cannot access Tenant B data.\n")
    else:
        print("  [FAIL] ISOLATION FAILED: Tenant A retrieved Tenant B's data!\n")
        raise AssertionError("Tenant Isolation Failure!")

    # Step 6: Isolation Test — Tenant B queries its OWN knowledge
    print("=" * 70)
    print("[Test 3] Tenant B queries its own knowledge (should SUCCEED)...")
    query_b = "Điều kiện nào thì sản phẩm của tôi không được bảo hành?"
    
    async with async_session_maker() as db:
        result_b = await rag_service.generate_answer(tenant_id=TENANT_B_ID, query=query_b, db_session=db)
    print(f"  Query:  {query_b}")
    print(f"  Answer: {result_b['answer']}")
    print(f"  Sources used: {len(result_b['sources'])} chunk(s)\n")

    # Cleanup
    print("=" * 70)
    print("[Cleanup] Deleting test records and vectors...")
    
    # Delete from Qdrant
    await vector_service.delete_document_vectors(tenant_id=TENANT_A_ID, document_id=doc_a_id)
    await vector_service.delete_document_vectors(tenant_id=TENANT_B_ID, document_id=doc_b_id)
    
    # Delete from Postgres (first chunks, then documents, then tenants to respect FK)
    async with async_session_maker() as db:
        await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id.in_([uuid.UUID(doc_a_id), uuid.UUID(doc_b_id)])))
        await db.execute(delete(Document).where(Document.id.in_([uuid.UUID(doc_a_id), uuid.UUID(doc_b_id)])))
        await db.execute(delete(Tenant).where(Tenant.id.in_([uuid.UUID(TENANT_A_ID), uuid.UUID(TENANT_B_ID)])))
        await db.commit()
        
    print("  [OK] Cleanup complete.\n")
    print("=" * 70)
    print("  Verification complete!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(run_verification())
