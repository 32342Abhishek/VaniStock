"""VaaniStock — FastAPI Main Application"""
import re
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.database.mongodb import connect_db, disconnect_db
from app.routes import auth, products, inventory, voice, transactions, alerts, settings as settings_route

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def is_allowed_origin(origin: str) -> bool:
    if origin in settings.CORS_ORIGINS:
        return True
    # Allow all Vercel preview deployments
    if re.match(r'https://.*\.vercel\.app$', origin):
        return True
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 VaaniStock API starting...")
    connect_db()
    logger.info(f"🤖 AI Provider: {settings.AI_PROVIDER}")
    logger.info(f"🎙 STT Provider: {settings.STT_PROVIDER}")
    yield
    # Shutdown
    disconnect_db()
    logger.info("👋 VaaniStock API stopped")


app = FastAPI(
    title="VaaniStock API",
    description="Voice-Based Inventory Management for Small Businesses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r'https://.*\.vercel\.app$',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred"}
        }
    )

# Routes
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(voice.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(settings_route.router)


@app.get("/api/health")
async def health():
    from app.database.mongodb import get_db
    try:
        db = get_db()
        db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "success": True,
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {
        "app": "VaaniStock",
        "tagline": "Manage Your Stock. Just Speak.",
        "docs": "/docs",
        "health": "/api/health",
    }
