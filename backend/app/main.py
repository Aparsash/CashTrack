from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import auth, records

app = FastAPI(
    title="CashTrack API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(records.router, prefix="/api/v1/records", tags=["records"])


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/debug-env")
def debug_env():
    from app.core.config import settings
    return {
        "url": settings.supabase_url[:30],
        "anon_key_prefix": settings.supabase_anon_key[:20],
    }