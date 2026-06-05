from contextlib import asynccontextmanager
from fastapi import FastAPI
from database.db import engine, Base
from sqlalchemy import text
from routers.category_router import router as category_router
from routers.ingredient_router import router as ingredient_router
from routers.location_router import router as location_router
from routers.order_router import router as order_router
from routers.product_router import router as product_router
from routers.shipping_router import router as shipping_router
from routers.user_router import router as user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("Conexión sabrosonga")
    except Exception as e:
        print(f"Error conectando la DB {e}")
        raise

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(category_router)
app.include_router(ingredient_router)
app.include_router(location_router)
app.include_router(order_router)
app.include_router(product_router)
app.include_router(shipping_router)
app.include_router(user_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
