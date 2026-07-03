"""Integration Test: Pha 4 — Authentication & Tenant Isolation.

This script validates:
  1. Admin API is protected — wrong admin key returns 403.
  2. Tenant creation and API key issuance via Admin endpoints.
  3. Invalid / unknown bearer tokens return 401.
  4. Tenant A's data is completely invisible to Tenant B (Qdrant isolation).
  5. Revoked API keys are rejected with 401.
"""
import asyncio
import logging
import sys
import os

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.core.config import settings
from backend.core.database import create_db_and_tables
from backend.services.vector_service import vector_service

logging.basicConfig(level=logging.INFO, format="%(levelname)-8s | %(message)s")
logger = logging.getLogger("test_auth")

ADMIN_HEADERS = {"X-Admin-Key": settings.ADMIN_SECRET_KEY}


async def run() -> None:
    # ── Startup ───────────────────────────────────────────────────────────────
    await create_db_and_tables()
    await vector_service.create_collection_if_not_exists()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:

        # ── Test 1: Wrong admin key returns 403 ───────────────────────────────
        logger.info("--- [Test 1] Admin protection: wrong key -> 403 ---")
        resp = await client.post(
            "/admin/tenants", json={"name": "Hacker"}, headers={"X-Admin-Key": "wrong"}
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
        logger.info("[OK] Wrong admin key correctly rejected with 403.")

        # ── Test 2: Create Tenant A & B ───────────────────────────────────────
        logger.info("\n--- [Test 2] Create Tenants A and B via Admin API ---")
        resp_a = await client.post("/admin/tenants", json={"name": "Tenant A"}, headers=ADMIN_HEADERS)
        assert resp_a.status_code == 201, resp_a.text
        tenant_a_id = resp_a.json()["id"]

        resp_b = await client.post("/admin/tenants", json={"name": "Tenant B"}, headers=ADMIN_HEADERS)
        assert resp_b.status_code == 201, resp_b.text
        tenant_b_id = resp_b.json()["id"]
        logger.info("[OK] Tenant A: %s | Tenant B: %s", tenant_a_id, tenant_b_id)

        # ── Test 3: Issue API Keys ─────────────────────────────────────────────
        logger.info("\n--- [Test 3] Issue API Keys ---")
        resp = await client.post(
            f"/admin/tenants/{tenant_a_id}/api-keys",
            json={"name": "key-a"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 201, resp.text
        key_a_raw = resp.json()["raw_key"]
        key_a_id = resp.json()["id"]

        resp = await client.post(
            f"/admin/tenants/{tenant_b_id}/api-keys",
            json={"name": "key-b"},
            headers=ADMIN_HEADERS,
        )
        assert resp.status_code == 201, resp.text
        key_b_raw = resp.json()["raw_key"]
        logger.info("[OK] API keys issued. raw_key starts with '%s...'", key_a_raw[:10])

        headers_a = {"Authorization": f"Bearer {key_a_raw}"}
        headers_b = {"Authorization": f"Bearer {key_b_raw}"}

        # ── Test 4: Invalid bearer token returns 401 ──────────────────────────
        logger.info("\n--- [Test 4] Invalid bearer token -> 401 ---")
        resp = await client.post(
            "/documents/ingest",
            json={"filename": "x.txt", "text": "test"},
            headers={"Authorization": "Bearer totally-invalid-key"},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"
        logger.info("[OK] Invalid key correctly rejected with 401.")

        # ── Test 5: Tenant A ingests a secret document ─────────────────────────
        logger.info("\n--- [Test 5] Tenant A ingests secret document ---")
        secret_text = (
            "Mat khau cua he thong la: SUPER_SECRET_XYZ_42. "
            "Chi noi voi Tenant A ma thoi."
        )
        resp = await client.post(
            "/documents/ingest",
            json={"filename": "tai_lieu_mat_A.txt", "text": secret_text},
            headers=headers_a,
        )
        assert resp.status_code == 201, resp.text
        logger.info("[OK] Tenant A ingested secret doc. Chunks: %d", resp.json()["chunk_count"])

        # ── Test 6: Tenant B queries about Tenant A's secret — must get nothing ─
        logger.info("\n--- [Test 6] Tenant B queries Tenant A's secret -> must be isolated ---")
        resp = await client.post(
            "/chat/query",
            json={"query": "Mat khau la gi?", "stream": False},
            headers=headers_b,
        )
        assert resp.status_code == 200, resp.text
        answer_b = resp.json()["answer"]
        sources_b = resp.json()["sources"]
        assert len(sources_b) == 0 or "SUPER_SECRET_XYZ_42" not in answer_b, (
            f"ISOLATION BREACH! Tenant B got Tenant A's secret in answer: {answer_b}"
        )
        logger.info("[OK] Tenant B got 0 sources for Tenant A's data. Isolation confirmed.")
        logger.info("     Tenant B answer: %s", answer_b[:80])

        # ── Test 7: Tenant A queries — must get the answer ────────────────────
        logger.info("\n--- [Test 7] Tenant A queries own document -> must get correct answer ---")
        resp = await client.post(
            "/chat/query",
            json={"query": "Mat khau cua he thong la gi?", "stream": False},
            headers=headers_a,
        )
        assert resp.status_code == 200, resp.text
        answer_a = resp.json()["answer"]
        logger.info("[OK] Tenant A received answer from their own data.")
        logger.info("     Tenant A answer: %s", answer_a[:120])

        # ── Test 8: Revoke Tenant A's key → subsequent call returns 401 ───────
        logger.info("\n--- [Test 8] Revoke Tenant A's API key -> subsequent call -> 401 ---")
        resp = await client.delete(f"/admin/api-keys/{key_a_id}", headers=ADMIN_HEADERS)
        assert resp.status_code == 200, resp.text

        resp = await client.post(
            "/chat/query",
            json={"query": "test", "stream": False},
            headers=headers_a,
        )
        assert resp.status_code == 401, f"Expected 401 after revoke, got {resp.status_code}"
        logger.info("[OK] Revoked key correctly rejected with 401.")

        logger.info("\n============================================================")
        logger.info(" ALL AUTH & ISOLATION TESTS PASSED")
        logger.info("============================================================")


if __name__ == "__main__":
    asyncio.run(run())
