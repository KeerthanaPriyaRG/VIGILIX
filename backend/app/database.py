import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("vigilix.database")

Base = declarative_base()

def get_engine():
    """
    Attempts to connect to primary DATABASE_URL (PostgreSQL).
    If unavailable or fails, gracefully falls back to local SQLite database.
    """
    primary_url = settings.DATABASE_URL
    try:
        if primary_url.startswith("postgresql"):
            logger.info("Attempting connection to PostgreSQL...")
            engine = create_engine(
                primary_url, 
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to PostgreSQL database.")
            return engine, "postgresql"
        else:
            engine = create_engine(
                primary_url,
                connect_args={"check_same_thread": False} if primary_url.startswith("sqlite") else {}
            )
            return engine, "sqlite"
    except Exception as e:
        logger.warning(f"Failed to connect to primary database ({primary_url}): {e}")
        logger.warning(f"Falling back to local SQLite database: {settings.SQLITE_FALLBACK_URL}")
        fallback_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return fallback_engine, "sqlite"

engine, DB_DIALECT = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
