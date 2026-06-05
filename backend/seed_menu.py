"""Seed del menú público de la landing.

Crea/actualiza categorías y productos y asigna a cada producto la URL de su
imagen servida por el backend (`/static/menu/...`). El backend es la fuente de
la verdad de las imágenes. Idempotente: identifica por nombre y actualiza.

Uso:
    cd backend && .venv/bin/python seed_menu.py
    # o: uv run python seed_menu.py
"""

import asyncio
import os
from decimal import Decimal

from sqlalchemy import select

from database.db import async_session

# Importar todos los modelos para que SQLAlchemy configure los mappers/relaciones.
from models.category import Category
from models.product import Product
import models.ingredient  # noqa: F401
import models.product_ingredient  # noqa: F401
import models.user  # noqa: F401
import models.location  # noqa: F401
import models.order  # noqa: F401
import models.order_item  # noqa: F401
import models.order_item_ingredient  # noqa: F401
import models.shipping  # noqa: F401

STATIC_BASE_URL = os.getenv("STATIC_BASE_URL", "http://localhost:8000")


def image_url(filename: str) -> str:
    return f"{STATIC_BASE_URL}/static/menu/{filename}"


CATEGORIES = [
    ("Pizzas", "Pizzas artesanales italianas"),
    ("Pastas", "Pastas frescas con salsas tradicionales"),
    ("Risotti", "Risottos cremosos al estilo italiano"),
    ("Antipasti", "Entradas para empezar la mesa"),
    ("Postres", "Dolci para cerrar"),
]

# (nombre, categoría, descripción, precio, archivo_imagen)
PRODUCTS = [
    ("Pizza Margherita", "Pizzas", "Tomate San Marzano, mozzarella y albahaca fresca.", "9.99", "margherita.jpg"),
    ("Pizza Pepperoni", "Pizzas", "Doble pepperoni, mozzarella y salsa de tomate.", "11.99", "pepperoni.jpg"),
    ("Pasta Alfredo", "Pastas", "Pasta con salsa Alfredo cremosa al parmesano.", "10.50", "alfredo.jpg"),
    ("Lasagna alla Bolognese", "Pastas", "Capas de pasta, ragú lento y bechamel gratinada.", "13.90", "lasagna.jpg"),
    ("Risotto ai Funghi", "Risotti", "Arroz cremoso con hongos y parmesano.", "13.20", "risotto.jpg"),
    ("Bruschetta al Pomodoro", "Antipasti", "Pan tostado con tomate, ajo, albahaca y aceite de oliva.", "7.50", "bruschetta.jpg"),
    ("Tiramisú", "Postres", "Café, mascarpone y cacao. El clásico de la casa.", "6.50", "tiramisu.jpg"),
]


async def seed() -> None:
    async with async_session() as db:
        category_ids: dict[str, int] = {}
        for name, description in CATEGORIES:
            category = (
                await db.execute(select(Category).where(Category.name == name))
            ).scalar_one_or_none()
            if category is None:
                category = Category(name=name, description=description)
                db.add(category)
                await db.flush()
            category_ids[name] = category.id

        created, updated = 0, 0
        for name, category_name, description, price, filename in PRODUCTS:
            product = (
                await db.execute(select(Product).where(Product.name == name))
            ).scalar_one_or_none()
            url = image_url(filename)
            if product is None:
                db.add(
                    Product(
                        category_id=category_ids[category_name],
                        name=name,
                        description=description,
                        price=Decimal(price),
                        image_url=url,
                        available=True,
                    )
                )
                created += 1
            else:
                product.category_id = category_ids[category_name]
                product.description = description
                product.price = Decimal(price)
                product.image_url = url
                product.available = True
                updated += 1

        await db.commit()
        print(f"Seed completado: {created} creados, {updated} actualizados.")


if __name__ == "__main__":
    asyncio.run(seed())
