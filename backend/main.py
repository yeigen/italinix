from contextlib import asynccontextmanager
from fastapi import FastAPI
from database.db import engine, Base
from sqlalchemy import text

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


@app.get("/health")
async def health():
    return {"status": "ok"}