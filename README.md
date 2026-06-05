## Backend

```bash
cd backend
uvicorn main:app --reload
```

Variables necesarias en `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://...
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Tests

Usan `DATABASE_URL` desde `backend/.env`.

```bash
cd backend
uv run pytest -v
```

## Frontend

```bash
cd frontend
pnpm dev
```
