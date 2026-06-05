from contextlib import asynccontextmanager
from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database.db import engine, Base
from sqlalchemy import text
from routers.auth_router import router as auth_router
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

cors_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(category_router)
app.include_router(ingredient_router)
app.include_router(location_router)
app.include_router(order_router)
app.include_router(product_router)
app.include_router(shipping_router)
app.include_router(user_router)

# Archivos estáticos (imágenes del menú servidas por el backend, fuente de la verdad)
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health")
async def health():
    return {"status": "ok"}
