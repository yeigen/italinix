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

            delivery_login_response = api_client.post(
                "/auth/login",
                json={"email": delivery_person.email, "password": "secret"},
            )
            assert delivery_login_response.status_code == 200
            delivery_token = delivery_login_response.json()["access_token"]

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

            missing_users_token_response = api_client.get("/users/")
            assert missing_users_token_response.status_code == 401

            client_users_response = api_client.get(
                "/users/",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_users_response.status_code == 403

            admin_users_response = api_client.get(
                "/users/",
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_users_response.status_code == 200
            assert any(
                existing_user["id"] == delivery_person.id
                for existing_user in admin_users_response.json()
            )

            missing_user_token_response = api_client.get(f"/users/{client.id}")
            assert missing_user_token_response.status_code == 401

            client_self_response = api_client.get(
                f"/users/{client.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_self_response.status_code == 200
            assert client_self_response.json()["id"] == client.id

            client_other_user_response = api_client.get(
                f"/users/{delivery_person.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_other_user_response.status_code == 403

            client_role_update_response = api_client.patch(
                f"/users/{client.id}",
                json={"rol": "admin"},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_role_update_response.status_code == 403

            client_self_update_response = api_client.patch(
                f"/users/{client.id}",
                json={"phone": "555-1010"},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_self_update_response.status_code == 200
            assert client_self_update_response.json()["phone"] == "555-1010"

            admin_user_update_response = api_client.patch(
                f"/users/{delivery_person.id}",
                json={"active": False},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_user_update_response.status_code == 200
            assert admin_user_update_response.json()["active"] is False

            admin_user_update_response = api_client.patch(
                f"/users/{delivery_person.id}",
                json={"active": True},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_user_update_response.status_code == 200

            public_admin_register_response = api_client.post(
                "/users/",
                json={
                    "name": f"Public Admin {suffix}",
                    "email": f"public-admin-{suffix}@example.com",
                    "password": "secret",
                    "phone": None,
                    "rol": "admin",
                    "active": True,
                },
            )
            assert public_admin_register_response.status_code == 403

            admin_created_delivery_response = api_client.post(
                "/users/admin",
                json={
                    "name": f"Repartidor Admin API {suffix}",
                    "email": f"repartidor-admin-api-{suffix}@example.com",
                    "password": "secret",
                    "phone": None,
                    "rol": "repartidor",
                    "active": True,
                },
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_created_delivery_response.status_code == 201
            admin_created_delivery = await user_service.get_user(
                db, admin_created_delivery_response.json()["id"]
            )
            assert admin_created_delivery is not None
            created["users"].append(admin_created_delivery)

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

            missing_locations_token_response = api_client.get("/locations/")
            assert missing_locations_token_response.status_code == 401

            client_global_locations_response = api_client.get(
                "/locations/",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_global_locations_response.status_code == 403

            admin_locations_response = api_client.get(
                "/locations/",
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_locations_response.status_code == 200
            assert any(
                existing_location["id"] == location.id
                for existing_location in admin_locations_response.json()
            )

            client_location_response = api_client.get(
                f"/locations/{location.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_location_response.status_code == 200
            assert client_location_response.json()["id"] == location.id

            delivery_location_response = api_client.get(
                f"/locations/{location.id}",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_location_response.status_code == 403

            client_locations_response = api_client.get(
                f"/locations/user/{client.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_locations_response.status_code == 200
            assert any(
                existing_location["id"] == location.id
                for existing_location in client_locations_response.json()
            )

            spoofed_location_response = api_client.post(
                "/locations/",
                json={
                    "user_id": delivery_person.id,
                    "location": f"Calle falsa {suffix}",
                    "city": "Ciudad Test",
                    "indications": None,
                    "is_principal": False,
                },
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert spoofed_location_response.status_code == 403

            client_update_location_response = api_client.patch(
                f"/locations/{location.id}",
                json={"indications": "Actualizada por cliente"},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_update_location_response.status_code == 200
            assert client_update_location_response.json()["indications"] == "Actualizada por cliente"

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

            missing_order_token_response = api_client.get("/orders/details")
            assert missing_order_token_response.status_code == 401

            client_global_orders_response = api_client.get(
                "/orders/details",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_global_orders_response.status_code == 403

            admin_orders_response = api_client.get(
                "/orders/details",
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_orders_response.status_code == 200
            assert any(
                existing_order["id"] == order.id
                for existing_order in admin_orders_response.json()
            )

            client_order_response = api_client.get(
                f"/orders/{order.id}/details",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_order_response.status_code == 200
            assert client_order_response.json()["id"] == order.id

            delivery_order_response = api_client.get(
                f"/orders/{order.id}/details",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_order_response.status_code == 403

            client_user_orders_response = api_client.get(
                f"/orders/user/{client.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_user_orders_response.status_code == 200
            assert any(
                existing_order["id"] == order.id
                for existing_order in client_user_orders_response.json()
            )

            forbidden_user_orders_response = api_client.get(
                f"/orders/user/{client.id}",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert forbidden_user_orders_response.status_code == 403

            spoofed_order_response = api_client.post(
                "/orders/",
                json={
                    "user_id": delivery_person.id,
                    "location_id": location.id,
                    "status": "pending",
                    "total": "1.00",
                    "notes": None,
                    "items": [],
                },
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert spoofed_order_response.status_code == 403

            client_update_order_response = api_client.patch(
                f"/orders/{order.id}",
                json={"status": "confirmed"},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_update_order_response.status_code == 403

            admin_update_order_response = api_client.patch(
                f"/orders/{order.id}",
                json={"status": "confirmed"},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_update_order_response.status_code == 200
            assert admin_update_order_response.json()["status"] == "confirmed"

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

            assigned_delivery_order_response = api_client.get(
                f"/orders/{order.id}/details",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert assigned_delivery_order_response.status_code == 200
            assert assigned_delivery_order_response.json()["id"] == order.id

            missing_shipping_token_response = api_client.get("/shippings/")
            assert missing_shipping_token_response.status_code == 401


            client_global_shippings_response = api_client.get(
                "/shippings/",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_global_shippings_response.status_code == 403

            admin_shippings_response = api_client.get(
                "/shippings/",
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert admin_shippings_response.status_code == 200
            assert any(
                existing_shipping["id"] == shipping.id
                for existing_shipping in admin_shippings_response.json()
            )

            client_order_shipping_response = api_client.get(
                f"/shippings/order/{order.id}",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_order_shipping_response.status_code == 200
            assert client_order_shipping_response.json()["id"] == shipping.id

            delivery_shipping_response = api_client.get(
                f"/shippings/{shipping.id}",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_shipping_response.status_code == 200
            assert delivery_shipping_response.json()["id"] == shipping.id

            delivery_person_shippings_response = api_client.get(
                f"/shippings/delivery-person/{delivery_person.id}",
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_person_shippings_response.status_code == 200
            assert any(
                existing_shipping["id"] == shipping.id
                for existing_shipping in delivery_person_shippings_response.json()
            )

            client_update_shipping_response = api_client.patch(
                f"/shippings/{shipping.id}",
                json={"status": "delivered"},
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_update_shipping_response.status_code == 403

            delivery_reassign_shipping_response = api_client.patch(
                f"/shippings/{shipping.id}",
                json={"delivery_person_id": delivery_person.id},
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_reassign_shipping_response.status_code == 403

            delivery_update_shipping_response = api_client.patch(
                f"/shippings/{shipping.id}",
                json={"status": "delivered"},
                headers={"Authorization": f"Bearer {delivery_token}"},
            )
            assert delivery_update_shipping_response.status_code == 200
            assert delivery_update_shipping_response.json()["status"] == "delivered"

            client_create_shipping_response = api_client.post(
                "/shippings/",
                json={
                    "order_id": order.id,
                    "delivery_person_id": delivery_person.id,
                    "status": "assigned",
                },
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            assert client_create_shipping_response.status_code == 403

            duplicate_shipping_response = api_client.post(
                "/shippings/",
                json={
                    "order_id": order.id,
                    "delivery_person_id": delivery_person.id,
                    "status": "assigned",
                },
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert duplicate_shipping_response.status_code == 409
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
