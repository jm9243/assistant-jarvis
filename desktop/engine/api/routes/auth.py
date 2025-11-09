"""认证相关API"""
from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.common import Result

router = APIRouter()


class LoginRequest(BaseModel):
    identifier: str
    password: str


class RefreshRequest(BaseModel):
    refreshToken: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    title: str = "Workflow Admin"
    organization: str = "Jarvis Labs"
    avatar: str | None = None


class TokenPair(BaseModel):
    accessToken: str
    refreshToken: str
    expiresAt: str


class AuthResponse(BaseModel):
    tokens: TokenPair
    profile: UserProfile


_DEMO_USERS: Dict[str, Dict[str, str]] = {
    "demo@jarvis.dev": {
        "password": "Jarvis@123",
        "name": "Jarvis Admin",
    }
}


def _build_tokens(identifier: str) -> TokenPair:
    now = datetime.utcnow()
    return TokenPair(
        accessToken=f"access-{identifier}-{int(now.timestamp())}",
        refreshToken=f"refresh-{identifier}-{int(now.timestamp())}",
        expiresAt=(now + timedelta(minutes=30)).isoformat(),
    )


@router.post("/login")
async def login(payload: LoginRequest):
    user = _DEMO_USERS.get(payload.identifier)
    if not user or payload.password != user["password"]:
        raise HTTPException(status_code=401, detail="账号或密码错误")

    tokens = _build_tokens(payload.identifier)
    profile = UserProfile(
        id=f"user-{payload.identifier}",
        name=user["name"],
        email=payload.identifier,
    )
    return Result(success=True, data=AuthResponse(tokens=tokens, profile=profile).model_dump())


@router.post("/refresh")
async def refresh(payload: RefreshRequest):
    if not payload.refreshToken:
        raise HTTPException(status_code=400, detail="refreshToken 缺失")
    # 简化：刷新仍返回同一个 demo 用户
    identifier = payload.refreshToken.split("-")[1] if "-" in payload.refreshToken else "demo@jarvis.dev"
    tokens = _build_tokens(identifier)
    return Result(success=True, data=tokens.model_dump())


@router.get("/profile")
async def profile():
    user = _DEMO_USERS["demo@jarvis.dev"]
    profile = UserProfile(id="user-demo", name=user["name"], email="demo@jarvis.dev")
    return Result(success=True, data=profile.model_dump())
