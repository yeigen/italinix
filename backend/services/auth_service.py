from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, verify_password
from models.user import User
from services.user_service import get_user_by_email


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> User | None:
    user = await get_user_by_email(db, email)
    if user is None:
        return None

    if not verify_password(password, user.password):
        return None

    return user


def create_user_token(user: User) -> str:
    return create_access_token(
        {
            "sub": str(user.id),
            "role": user.rol.value,
        }
    )
