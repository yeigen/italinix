import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from dotenv import load_dotenv
load_dotenv() # cargo el .env

DATABASE_URL = os.getenv("DATABASE_URL") # defino la url del .env

engine = create_async_engine(DATABASE_URL, echo=False) # defino el motor con sqlalchemy para las conexiones con la db

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False) # expire_on_commit=False es para persistencia

class Base(DeclarativeBase): # es el modelo base para todas las clases, el padre
    pass

async def get_db(): # crear una session por request
    async with async_session() as session:
        yield session
