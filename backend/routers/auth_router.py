from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import get_current_active_user
from models.user import User
from schemas.auth import LoginRequest, Token
from schemas.user import UserRead
from services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_active_user)]


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: DbSession):
    return await _create_token_response(db, login_data.email, login_data.password)


async def _create_token_response(db: AsyncSession, email: str, password: str) -> Token:
    user = await auth_service.authenticate_user(db, email, password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(access_token=auth_service.create_user_token(user))


@router.get("/me", response_model=UserRead)
async def get_me(current_user: CurrentUser):
    return current_user
