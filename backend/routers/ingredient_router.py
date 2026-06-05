from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import require_admin
from models.user import User
from schemas.ingredient import IngredientCreate, IngredientRead, IngredientUpdate
from services import ingredient_service

router = APIRouter(prefix="/ingredients", tags=["ingredients"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin)]


@router.get("/", response_model=list[IngredientRead])
async def list_ingredients(db: DbSession):
    return await ingredient_service.get_ingredients(db)


@router.get("/{ingredient_id}", response_model=IngredientRead)
async def get_ingredient(ingredient_id: int, db: DbSession):
    ingredient = await ingredient_service.get_ingredient(db, ingredient_id)
    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )
    return ingredient


@router.post("/", response_model=IngredientRead, status_code=status.HTTP_201_CREATED)
async def create_ingredient(ingredient_data: IngredientCreate, db: DbSession, _: AdminUser):
    return await ingredient_service.create_ingredient(db, ingredient_data)


@router.patch("/{ingredient_id}", response_model=IngredientRead)
async def update_ingredient(
    ingredient_id: int, ingredient_data: IngredientUpdate, db: DbSession, _: AdminUser
):
    ingredient = await ingredient_service.get_ingredient(db, ingredient_id)
    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )
    return await ingredient_service.update_ingredient(db, ingredient, ingredient_data)


@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(ingredient_id: int, db: DbSession, _: AdminUser):
    ingredient = await ingredient_service.get_ingredient(db, ingredient_id)
    if ingredient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found"
        )
    await ingredient_service.delete_ingredient(db, ingredient)
