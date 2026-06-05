from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models.all_models
from models.ingredient import Ingredient
from schemas.ingredient import IngredientCreate, IngredientUpdate


async def get_ingredients(db: AsyncSession) -> list[Ingredient]:
    result = await db.execute(select(Ingredient).order_by(Ingredient.id))
    return list(result.scalars().all())


async def get_ingredient(db: AsyncSession, ingredient_id: int) -> Ingredient | None:
    return await db.get(Ingredient, ingredient_id)


async def create_ingredient(db: AsyncSession, ingredient_data: IngredientCreate) -> Ingredient:
    ingredient = Ingredient(**ingredient_data.model_dump())
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    return ingredient


async def update_ingredient(
    db: AsyncSession, ingredient: Ingredient, ingredient_data: IngredientUpdate
) -> Ingredient:
    update_data = ingredient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ingredient, field, value)

    await db.commit()
    await db.refresh(ingredient)
    return ingredient


async def delete_ingredient(db: AsyncSession, ingredient: Ingredient) -> None:
    await db.delete(ingredient)
    await db.commit()
