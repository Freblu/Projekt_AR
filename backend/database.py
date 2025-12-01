from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Wczytaj .env z folderu backend/
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Pobierz URL z .env
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Nie udało się załadować DATABASE_URL z pliku .env")

# Debug (możesz usunąć później)
print("DATABASE_URL =", DATABASE_URL)

# SQLAlchemy konfiguracja
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()