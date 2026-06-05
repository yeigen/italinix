from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models.all_models
from models.ingredient import Ingredient
from models.product import Product
from schemas.product import ProductCreate, ProductUpdate


async def get_products(db: AsyncSession) -> list[Product]:
    result = await db.execute(select(Product).order_by(Product.id))
    return list(result.scalars().all())


async def get_products_with_details(db: AsyncSession) -> list[Product]:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.ingredients))
        .order_by(Product.id)
    )
    return list(result.scalars().all())


async def get_product(db: AsyncSession, product_id: int) -> Product | None:
    return await db.get(Product, product_id)


async def get_product_with_details(
    db: AsyncSession, product_id: int
) -> Product | None:
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.ingredients))
    )
    return result.scalar_one_or_none()


async def create_product(db: AsyncSession, product_data: ProductCreate) -> Product:
    data = product_data.model_dump()
    ingredient_ids = data.pop("ingredient_ids")
    product = Product(**data)

    if ingredient_ids:
        product.ingredients = await _get_ingredients_by_ids(db, ingredient_ids)

    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product: Product, product_data: ProductUpdate
) -> Product:
    update_data = product_data.model_dump(exclude_unset=True)
    ingredient_ids = update_data.pop("ingredient_ids", None)

    for field, value in update_data.items():
        setattr(product, field, value)

    if ingredient_ids is not None:
        product.ingredients = await _get_ingredients_by_ids(db, ingredient_ids)

    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product: Product) -> None:
    await db.delete(product)
    await db.commit()


async def _get_ingredients_by_ids(
    db: AsyncSession, ingredient_ids: list[int]
) -> list[Ingredient]:
    result = await db.execute(select(Ingredient).where(Ingredient.id.in_(ingredient_ids)))
    ingredients = list(result.scalars().all())
    found_ids = {ingredient.id for ingredient in ingredients}
    missing_ids = set(ingredient_ids) - found_ids

    if missing_ids:
        raise ValueError(f"Ingredients not found: {sorted(missing_ids)}")

    return ingredients
