"""
test_auth_flow.py

End-to-end integration test for Phase 8.1: Auth, Workspace & Plan Onboarding.

Prerequisites:
  - Backend running on http://localhost:8000
  - PostgreSQL & Qdrant containers running (docker compose up -d)

Run:
  .\\backend\\venv\\Scripts\\python.exe scripts/test_auth_flow.py
"""

import asyncio
import random
import string
import sys

import httpx

BASE_URL = "http://localhost:8000"
client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)

# ─── Helpers ──────────────────────────────────────────────────────────────────


def _random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"test_{suffix}@omnirag.test"


def _ok(label: str) -> None:
    print(f"  ✅ {label}")


def _fail(label: str, detail: str) -> None:
    print(f"  ❌ {label}: {detail}")
    sys.exit(1)


async def _assert_status(label: str, response: httpx.Response, expected: int) -> dict:
    if response.status_code != expected:
        _fail(label, f"expected {expected}, got {response.status_code} — {response.text}")
    _ok(f"{label} (HTTP {response.status_code})")
    return response.json() if response.content else {}


# ─── Test Cases ───────────────────────────────────────────────────────────────


async def test_health():
    print("\n[1] Health Check")
    r = await client.get("/health")
    await _assert_status("GET /health", r, 200)


async def test_register_and_get_verify_token(email: str, password: str) -> str:
    """Registers a user and extracts the verification token from the server logs.

    NOTE: In dev mode the token is printed to the server console.
    We trigger registration and then ask you to paste the token manually,
    OR you can read it from the server stdout if running in the same terminal.
    """
    print("\n[2] Registration")
    r = await client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Test User",
    })
    await _assert_status("POST /auth/register", r, 201)
    data = r.json()
    assert data["email"] == email
    assert data["is_verified"] is False

    print(f"\n  ⚠️  Check the server console for the verification token for: {email}")
    token = input("  Paste verification token here: ").strip()
    return token


async def test_duplicate_register(email: str, password: str):
    print("\n[3] Duplicate Registration Guard")
    r = await client.post("/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Duplicate User",
    })
    await _assert_status("POST /auth/register (duplicate → 409)", r, 409)


async def test_verify_email(token: str) -> None:
    print("\n[4] Email Verification")
    r = await client.post("/auth/verify-email", json={"token": token})
    await _assert_status("POST /auth/verify-email", r, 200)
    data = r.json()
    assert data["is_verified"] is True


async def test_login_and_get_tokens(email: str, password: str) -> tuple[str, str]:
    print("\n[5] Login")
    r = await client.post("/auth/login", json={"email": email, "password": password})
    await _assert_status("POST /auth/login", r, 200)
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    return data["access_token"], data["refresh_token"]


async def test_get_me(access_token: str, expected_email: str) -> None:
    print("\n[6] GET /auth/me")
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    await _assert_status("GET /auth/me", r, 200)
    assert r.json()["email"] == expected_email


async def test_unverified_cannot_create_workspace(email: str, password: str) -> None:
    print("\n[7] Unverified User Cannot Create Workspace")
    # Register without verifying
    unverified_email = _random_email()
    r = await client.post("/auth/register", json={
        "email": unverified_email,
        "password": password,
        "full_name": "Unverified User",
    })
    await _assert_status("POST /auth/register (unverified)", r, 201)

    # Login
    r = await client.post("/auth/login", json={"email": unverified_email, "password": password})
    await _assert_status("POST /auth/login (unverified)", r, 200)
    token = r.json()["access_token"]

    # Try to create workspace — should fail 403
    r = await client.post(
        "/workspaces",
        json={"name": "Should Fail"},
        headers={"Authorization": f"Bearer {token}"},
    )
    await _assert_status("POST /workspaces (unverified → 403)", r, 403)


async def test_create_workspace(access_token: str) -> str:
    print("\n[8] Create Workspace")
    r = await client.post(
        "/workspaces",
        json={"name": "My Test Workspace"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    await _assert_status("POST /workspaces", r, 201)
    data = r.json()
    assert data["role"] == "owner"
    workspace_id = data["id"]
    _ok(f"Workspace ID: {workspace_id}")
    return workspace_id


async def test_list_workspaces(access_token: str, workspace_id: str) -> None:
    print("\n[9] List Workspaces")
    r = await client.get(
        "/workspaces",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    await _assert_status("GET /workspaces", r, 200)
    ids = [ws["id"] for ws in r.json()]
    assert workspace_id in ids


async def test_get_workspace_members(access_token: str, workspace_id: str) -> None:
    print("\n[10] Get Workspace Members")
    r = await client.get(
        f"/workspaces/{workspace_id}/members",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    await _assert_status(f"GET /workspaces/{workspace_id}/members", r, 200)
    members = r.json()
    assert len(members) == 1
    assert members[0]["role"] == "owner"


async def test_token_refresh(refresh_token: str) -> None:
    print("\n[11] Token Refresh")
    r = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    await _assert_status("POST /auth/refresh", r, 200)
    data = r.json()
    assert "access_token" in data


# ─── Main ─────────────────────────────────────────────────────────────────────


async def main():
    print("=" * 60)
    print("  OmniRAG Phase 8.1 — Auth & Workspace Integration Test")
    print("=" * 60)

    email = _random_email()
    password = "SecureP@ss123"

    await test_health()
    verify_token = await test_register_and_get_verify_token(email, password)
    await test_duplicate_register(email, password)
    await test_verify_email(verify_token)
    access_token, refresh_token = await test_login_and_get_tokens(email, password)
    await test_get_me(access_token, email)
    await test_unverified_cannot_create_workspace(email, password)
    workspace_id = await test_create_workspace(access_token)
    await test_list_workspaces(access_token, workspace_id)
    await test_get_workspace_members(access_token, workspace_id)
    await test_token_refresh(refresh_token)

    print("\n" + "=" * 60)
    print("  ✅  All tests passed! Phase 8.1 backend is working correctly.")
    print("=" * 60)
    await client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
