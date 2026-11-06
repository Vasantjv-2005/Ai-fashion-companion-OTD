from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database file location
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "digital_closet.db"

# SQLite connection URL
SQLALCHEMY_DATABASE_URL = (
    f"sqlite:///{DATABASE_PATH.as_posix()}"
)

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for database models
Base = declarative_base()


# Database dependency for FastAPI
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()