import os
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    expires_at = datetime.now(UTC) + timedelta(minutes=_get_access_token_expire_minutes())
    payload.update({"exp": expires_at})

    return jwt.encode(payload, _get_secret_key(), algorithm=_get_algorithm())


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, _get_secret_key(), algorithms=[_get_algorithm()])
    except JWTError:
        return None


def _get_secret_key() -> str:
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError("SECRET_KEY is not configured")
    return secret_key


def _get_algorithm() -> str:
    return os.getenv("ALGORITHM", "HS256")


def _get_access_token_expire_minutes() -> int:
    return int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
