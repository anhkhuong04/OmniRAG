import asyncio
import logging
import sys
import uuid
import json

from httpx import ASGITransport, AsyncClient

# Add project root to path
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)-8s | %(message)s")
logger = logging.getLogger("test_api")
sys.stdout.reconfigure(encoding='utf-8')

async def run_integration_test():
    tenant_id = str(uuid.uuid4())
    logger.info(f"Starting API Integration Test for Mock Tenant: {tenant_id}")
    
    # Manually trigger startup events
    from backend.core.database import create_db_and_tables
    from backend.services.vector_service import vector_service
    await create_db_and_tables()
    await vector_service.create_collection_if_not_exists()
    
    from backend.core.database import async_session_maker
    from backend.models.tenant import Tenant
    
    # 0. Create Mock Tenant in DB to satisfy Foreign Key constraints
    async with async_session_maker() as session:
        mock_tenant = Tenant(id=uuid.UUID(tenant_id), name="Test Tenant", is_active=True)
        session.add(mock_tenant)
        await session.commit()
    
    # We use ASGITransport to bypass the network and directly call FastAPI 
    # but still simulate real HTTP requests.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Ingest Document
        logger.info("--- [Test 1] Ingesting Document via POST /documents/ingest ---")
        ingest_payload = {
            "filename": "chinh_sach_doi_tra.txt",
            "text": "Khách hàng mua tivi tại điện máy Xanh có thể đổi trả miễn phí trong vòng 30 ngày nếu có lỗi từ nhà sản xuất."
        }
        headers = {"X-Tenant-ID": tenant_id}
        
        response = await client.post("/documents/ingest", json=ingest_payload, headers=headers)
        if response.status_code != 201:
            logger.error(f"Ingest failed: {response.text}")
            return
            
        doc_data = response.json()
        logger.info(f"[OK] Ingest success! Document ID: {doc_data['id']}, Chunks: {doc_data['chunk_count']}")
        
        # 2. Query Chat (Non-Streaming)
        logger.info("\n--- [Test 2] Query Chat via POST /chat/query ---")
        query_payload = {
            "query": "Tôi mua tivi bị lỗi màn hình, có được đổi trả không và trong bao lâu?",
            "stream": False
        }
        response = await client.post("/chat/query", json=query_payload, headers=headers)
        if response.status_code != 200:
            logger.error(f"Query failed: {response.text}")
            return
            
        chat_data = response.json()
        conversation_id = chat_data["conversation_id"]
        logger.info(f"[OK] Query success! Conversation ID: {conversation_id}")
        logger.info(f"Answer: {chat_data['answer']}")
        logger.info(f"Sources used: {len(chat_data['sources'])}")
        
        # 3. Query Chat (Streaming) - Continue same conversation
        logger.info("\n--- [Test 3] Streaming Chat via POST /chat/query ---")
        query_payload_stream = {
            "query": "Thế nếu mua quá 30 ngày thì sao?",
            "conversation_id": conversation_id,
            "stream": True
        }
        
        # Since it's streaming, we need to read the lines
        logger.info("Streaming Response:")
        async with client.stream("POST", "/chat/query", json=query_payload_stream, headers=headers) as response:
            if response.status_code != 200:
                logger.error(f"Stream Query failed: {await response.aread()}")
                return
            
            async for line in response.aiter_lines():
                if line:
                    logger.info(f"Stream: {line}")
                    
        logger.info("\n[OK] Integration Test Completed Successfully!")


if __name__ == "__main__":
    asyncio.run(run_integration_test())
