import asyncio
from httpx import AsyncClient, ASGITransport
from api.server import create_app


def test_login_success():
    async def run():
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={"identifier": "demo@jarvis.dev", "password": "Jarvis@123"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert data["data"]["profile"]["email"] == "demo@jarvis.dev"

    asyncio.run(run())


def test_login_failure():
    async def run():
        app = create_app()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/api/auth/login", json={"identifier": "demo@jarvis.dev", "password": "wrong"})
            assert resp.status_code == 401

    asyncio.run(run())
