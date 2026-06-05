from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import require_admin
from models.user import User
from schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from services import category_service

router = APIRouter(prefix="/categories", tags=["categories"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin)]


@router.get("/", response_model=list[CategoryRead])
async def list_categories(db: DbSession):
    return await category_service.get_categories(db)


@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(category_id: int, db: DbSession):
    category = await category_service.get_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(category_data: CategoryCreate, db: DbSession, _: AdminUser):
    return await category_service.create_category(db, category_data)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int, category_data: CategoryUpdate, db: DbSession, _: AdminUser
):
    category = await category_service.get_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return await category_service.update_category(db, category, category_data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: DbSession, _: AdminUser):
    category = await category_service.get_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await category_service.delete_category(db, category)
