from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import decode_access_token
from database.db import get_db
from models.user import User, UserRole
from services.user_service import get_user

bearer_scheme = HTTPBearer()

DbSession = Annotated[AsyncSession, Depends(get_db)]
BearerCredentials = Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)]


async def get_current_user(credentials: BearerCredentials, db: DbSession) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user_id_int = int(user_id)
    except ValueError as error:
        raise credentials_exception from error

    user = await get_user(db, user_id_int)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    return current_user


async def require_admin(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    return current_user
