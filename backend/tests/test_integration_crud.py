from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from core.security import decode_access_token, verify_password
from database.db import async_session
from main import app
from models.order_item import OrderItem
from models.order_item_ingredient import OrderItemIngredient
from models.user import UserRole
from schemas.category import CategoryCreate, CategoryUpdate
from schemas.ingredient import IngredientCreate, IngredientUpdate
from schemas.location import LocationCreate, LocationUpdate
from schemas.order import OrderCreate, OrderUpdate
from schemas.order_item import OrderItemCreate
from schemas.order_item_ingredient import OrderItemIngredientCreate
from schemas.product import ProductCreate, ProductUpdate
from schemas.shipping import ShippingCreate, ShippingUpdate
from schemas.user import UserCreate, UserUpdate
from services import category_service
from services import auth_service
from services import ingredient_service
from services import location_service
from services import order_service
from services import product_service
from services import shipping_service
from services import user_service


@pytest.mark.anyio
async def test_full_crud_flow_against_database():
    suffix = uuid4().hex[:8]
    created = {
        "category": None,
        "ingredients": [],
        "location": None,
        "order": None,
        "product": None,
        "shipping": None,
        "users": [],
    }

    async with async_session() as db:
        try:
            client = await user_service.create_user(
                db,
                UserCreate(
                    name=f"Cliente Test {suffix}",
                    email=f"cliente-{suffix}@example.com",
                    password="secret",
                    phone="555-0001",
                    rol=UserRole.CLIENTE,
                ),
            )
            created["users"].append(client)
            assert client.password != "secret"
            assert verify_password("secret", client.password)

            authenticated_user = await auth_service.authenticate_user(
                db, client.email, "secret"
            )
            assert authenticated_user is not None
            assert authenticated_user.id == client.id

            invalid_user = await auth_service.authenticate_user(
                db, client.email, "wrong-password"
            )
            assert invalid_user is None

            token = auth_service.create_user_token(client)
            payload = decode_access_token(token)
            assert payload is not None
            assert payload["sub"] == str(client.id)
            assert payload["role"] == UserRole.CLIENTE.value

            delivery_person = await user_service.create_user(
                db,
                UserCreate(
                    name=f"Repartidor Test {suffix}",
                    email=f"repartidor-{suffix}@example.com",
                    password="secret",
                    phone="555-0002",
                    rol=UserRole.REPARTIDOR,
                ),
            )
            created["users"].append(delivery_person)

            admin = await user_service.create_user(
                db,
                UserCreate(
                    name=f"Admin Test {suffix}",
                    email=f"admin-{suffix}@example.com",
                    password="admin-secret",
                    phone="555-0003",
                    rol=UserRole.ADMIN,
                ),
            )
            created["users"].append(admin)

            updated_client = await user_service.update_user(
                db, client, UserUpdate(phone="555-9999")
            )
            assert updated_client.phone == "555-9999"

            updated_client = await user_service.update_user(
                db, client, UserUpdate(password="new-secret")
            )
            assert updated_client.password != "new-secret"
            assert verify_password("new-secret", updated_client.password)
            assert await auth_service.authenticate_user(
                db, client.email, "new-secret"
            ) is not None

            api_client = TestClient(app)
            login_response = api_client.post(
                "/auth/login",
                json={"email": client.email, "password": "new-secret"},
            )
            assert login_response.status_code == 200
            token_data = login_response.json()
            assert token_data["token_type"] == "bearer"

            payload = decode_access_token(token_data["access_token"])
            assert payload is not None
            assert payload["sub"] == str(client.id)
            assert payload["role"] == UserRole.CLIENTE.value

            me_response = api_client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert me_response.status_code == 200
            me_data = me_response.json()
            assert me_data["id"] == client.id
            assert me_data["email"] == client.email
            assert me_data["rol"] == UserRole.CLIENTE.value
            assert "password" not in me_data

            missing_token_response = api_client.get("/auth/me")
            assert missing_token_response.status_code == 401

            invalid_token_response = api_client.get(
                "/auth/me", headers={"Authorization": "Bearer invalid-token"}
            )
            assert invalid_token_response.status_code == 401

            invalid_login_response = api_client.post(
                "/auth/login",
                json={"email": client.email, "password": "wrong-password"},
            )
            assert invalid_login_response.status_code == 401

            forbidden_category_response = api_client.post(
                "/categories/",
                json={"name": f"Forbidden {suffix}", "description": None},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert forbidden_category_response.status_code == 403

            admin_login_response = api_client.post(
                "/auth/login",
                json={"email": admin.email, "password": "admin-secret"},
            )
            assert admin_login_response.status_code == 200
            admin_token = admin_login_response.json()["access_token"]

            admin_category_response = api_client.post(
                "/categories/",
                json={
                    "name": f"Categoria Admin Test {suffix}",
                    "description": "Creada por admin",
                },
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_category_response.status_code == 201

            admin_category = await category_service.get_category(
                db, admin_category_response.json()["id"]
            )
            assert admin_category is not None
            await category_service.delete_category(db, admin_category)

            category = await category_service.create_category(
                db,
                CategoryCreate(
                    name=f"Categoria Test {suffix}", description="Categoria temporal"
                ),
            )
            created["category"] = category

            category = await category_service.update_category(
                db, category, CategoryUpdate(description="Categoria actualizada")
            )
            assert category.description == "Categoria actualizada"

            ingredient_one = await ingredient_service.create_ingredient(
                db,
                IngredientCreate(
                    name=f"Ingrediente A {suffix}", additional_price=Decimal("1.50")
                ),
            )
            ingredient_two = await ingredient_service.create_ingredient(
                db,
                IngredientCreate(
                    name=f"Ingrediente B {suffix}", additional_price=Decimal("2.00")
                ),
            )
            created["ingredients"].extend([ingredient_one, ingredient_two])

            ingredient_one = await ingredient_service.update_ingredient(
                db,
                ingredient_one,
                IngredientUpdate(additional_price=Decimal("1.75")),
            )
            assert ingredient_one.additional_price == Decimal("1.75")

            product = await product_service.create_product(
                db,
                ProductCreate(
                    category_id=category.id,
                    name=f"Producto Test {suffix}",
                    description="Producto temporal",
                    price=Decimal("12.00"),
                    ingredient_ids=[ingredient_one.id, ingredient_two.id],
                ),
            )
            created["product"] = product

            product = await product_service.update_product(
                db, product, ProductUpdate(price=Decimal("13.00"))
            )
            assert product.price == Decimal("13.00")

            product_detail = await product_service.get_product_with_details(db, product.id)
            assert product_detail is not None
            assert product_detail.category.id == category.id
            assert {ingredient.id for ingredient in product_detail.ingredients} == {
                ingredient_one.id,
                ingredient_two.id,
            }

            location = await location_service.create_location(
                db,
                LocationCreate(
                    user_id=client.id,
                    location=f"Calle Test {suffix}",
                    city="Ciudad Test",
                    indications="Casa temporal",
                    is_principal=True,
                ),
            )
            created["location"] = location

            location = await location_service.update_location(
                db, location, LocationUpdate(indications="Indicaciones actualizadas")
            )
            assert location.indications == "Indicaciones actualizadas"

            order = await order_service.create_order(
                db,
                OrderCreate(
                    user_id=client.id,
                    location_id=location.id,
                    total=Decimal("14.75"),
                    notes="Orden temporal",
                    items=[
                        OrderItemCreate(
                            product_id=product.id,
                            quantity=1,
                            unit_price=Decimal("13.00"),
                            ingredients=[
                                OrderItemIngredientCreate(
                                    ingredient_id=ingredient_one.id,
                                    additional_price=Decimal("1.75"),
                                )
                            ],
                        )
                    ],
                ),
            )
            created["order"] = order

            order = await order_service.update_order(
                db, order, OrderUpdate(notes="Orden actualizada")
            )
            assert order.notes == "Orden actualizada"

            order_detail = await order_service.get_order_with_details(db, order.id)
            assert order_detail is not None
            assert order_detail.location.id == location.id
            assert len(order_detail.items) == 1
            assert order_detail.items[0].product.id == product.id
            assert len(order_detail.items[0].ingredients) == 1

            shipping = await shipping_service.create_shipping(
                db,
                ShippingCreate(
                    order_id=order.id,
                    delivery_person_id=delivery_person.id,
                ),
            )
            created["shipping"] = shipping

            shipping = await shipping_service.update_shipping(
                db, shipping, ShippingUpdate(status="in_transit")
            )
            assert shipping.status.value == "in_transit"

            assert await shipping_service.get_shipping_by_order(db, order.id) is not None
            assert len(
                await shipping_service.get_delivery_person_shippings(
                    db, delivery_person.id
                )
            ) == 1
        finally:
            await _cleanup_created_data(db, created)


async def _cleanup_created_data(db, created):
    if created["shipping"] is not None:
        await shipping_service.delete_shipping(db, created["shipping"])

    if created["order"] is not None:
        order_id = created["order"].id
        result = await db.execute(select(OrderItem.id).where(OrderItem.order_id == order_id))
        order_item_ids = list(result.scalars().all())

        if order_item_ids:
            await db.execute(
                delete(OrderItemIngredient).where(
                    OrderItemIngredient.order_item_id.in_(order_item_ids)
                )
            )

        await db.execute(
            delete(OrderItem).where(OrderItem.order_id == order_id)
        )
        await db.commit()
        await order_service.delete_order(db, created["order"])

    if created["location"] is not None:
        await location_service.delete_location(db, created["location"])

    if created["product"] is not None:
        await product_service.delete_product(db, created["product"])

    for ingredient in created["ingredients"]:
        await ingredient_service.delete_ingredient(db, ingredient)

    if created["category"] is not None:
        await category_service.delete_category(db, created["category"])

    for user in created["users"]:
        await user_service.delete_user(db, user)
