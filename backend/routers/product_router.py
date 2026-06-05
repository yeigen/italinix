from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import get_db
from dependencies.auth import require_admin
from models.user import User
from schemas.product import ProductCreate, ProductDetailRead, ProductRead, ProductUpdate
from services import product_service

router = APIRouter(prefix="/products", tags=["products"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin)]


@router.get("/", response_model=list[ProductRead])
async def list_products(db: DbSession):
    return await product_service.get_products(db)


@router.get("/details", response_model=list[ProductDetailRead])
async def list_products_with_details(db: DbSession):
    return await product_service.get_products_with_details(db)


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, db: DbSession):
    product = await product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/{product_id}/details", response_model=ProductDetailRead)
async def get_product_with_details(product_id: int, db: DbSession):
    product = await product_service.get_product_with_details(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(product_data: ProductCreate, db: DbSession, _: AdminUser):
    try:
        return await product_service.create_product(db, product_data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int, product_data: ProductUpdate, db: DbSession, _: AdminUser
):
    product = await product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        return await product_service.update_product(db, product, product_data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: DbSession, _: AdminUser):
    product = await product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await product_service.delete_product(db, product)
