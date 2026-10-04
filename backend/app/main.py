import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, DB_DIALECT
from app.ai.model_trainer import train_or_load_models
from database.seed.seed_data import seed_database
from app.routers import (
    auth_router,
    logs_router,
    threats_router,
    incidents_router,
    playbooks_router,
    ai_router,
    maturity_router,
    simulations_router,
    splunk_router,
    dashboard_router,
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vigilix")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Sequence
    logger.info("Initializing VIGILIX Intelligent Security Monitoring Platform...")
    logger.info(f"Database dialect active: {DB_DIALECT}")
    
    # 1. Initialize Tables
    init_db()
    
    # 2. Train or Load ML Models
    logger.info("Loading AI Threat Classification & Anomaly Detection models...")
    try:
        train_or_load_models()
        logger.info("AI Models online.")
    except Exception as e:
        logger.error(f"Failed to initialize ML models: {e}")

    # 3. Auto-seed if database is clean
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Seeding check notice: {e}")

    logger.info("VIGILIX Core is fully operational.")
    yield
    # Shutdown
    logger.info("Shutting down VIGILIX Core.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Intelligent Security Monitoring and Threat Response Platform (SOC/SIEM Intelligence)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(threats_router, prefix=settings.API_V1_STR)
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(playbooks_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(maturity_router, prefix=settings.API_V1_STR)
app.include_router(simulations_router, prefix=settings.API_V1_STR)
app.include_router(splunk_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": "VIGILIX Security Monitoring & Threat Response Platform",
        "version": settings.PROJECT_VERSION,
        "status": "Operational",
        "docs": "/docs",
        "mode": settings.ENVIRONMENT
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "Healthy",
        "database_dialect": DB_DIALECT,
        "splunk_mode": settings.SPLUNK_MODE,
        "ai_status": "Ready",
        "version": settings.PROJECT_VERSION
    }
