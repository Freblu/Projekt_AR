from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
import os
import random
from dotenv import load_dotenv
from pathlib import Path
from typing import List
from .schemas import UserOut
from email.message import EmailMessage
import aiosmtplib
from sqlalchemy import delete
from .auth import get_current_user
from . import models, schemas
from .database import engine, get_db
from .auth import create_access_token
from .models import PasswordReset
from .users import router as users_router
from .raw_endpoints import router as raw_router

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
     allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(raw_router)
app.include_router(users_router)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.get("/")
def read_root():
    return {"msg": "Backend działa poprawnie"}

@app.get("/elements")
def get_elements(db: Session = Depends(get_db)):
    return db.query(models.Element).all()

@app.post("/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email już istnieje")
    hashed_password = pwd_context.hash(user.password)
    new_user = models.User(email=user.email, password=hashed_password, role=user.role)
    db.add(new_user)
    db.add(models.RegisterLog(email=user.email, ip_address="TODO_IP"))
    new_user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email już istnieje")
    hashed_password = pwd_context.hash(user.password)
    new_user = models.User(email=user.email, password=hashed_password, role="user")
    db.add(new_user)
    db.add(models.RegisterLog(email=user.email, ip_address=request.client.host))
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    ip = request.client.host if request else "unknown"

    if not user or not pwd_context.verify(form_data.password, user.password):
        db.add(models.FailedLogin(email=form_data.username, ip_address=ip, reason="Nieprawidłowe dane logowania"))
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Nieprawidłowe dane logowania")

    db.add(models.RegisterLog(email=user.email, ip_address=ip))
    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
@app.put("/users/me")
def update_user(user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    return {"msg": "Brak uwierzytelniania – edycja profilu wyłączona"}

@app.delete("/users/me")
def delete_user():
    return {"msg": "Brak uwierzytelniania – usuwanie profilu wyłączone"}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"msg": "Wylogowano pomyślnie"}

@app.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    code = f"{random.randint(100000, 999999)}"
    code_hash = pwd_context.hash(code)

    db.query(PasswordReset).filter(PasswordReset.email == request.email).delete()
    reset = PasswordReset(email=request.email, code_hash=code_hash)
    db.add(reset)
    db.commit()

    message = EmailMessage()
    message["From"] = os.getenv("SMTP_SENDER")
    message["To"] = request.email
    message["Subject"] = "Kod resetu hasła"
    message.set_content(f"Twój kod resetu hasła to: {code}\nJest ważny przez 15 minut.")

    await aiosmtplib.send(
        message,
        hostname=os.getenv("SMTP_HOST"),
        port=int(os.getenv("SMTP_PORT")),
        username=os.getenv("SMTP_USER"),
        password=os.getenv("SMTP_PASSWORD"),
        start_tls=True,
    )

    return {"msg": "Kod resetu został wysłany"}

@app.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    entry = db.query(PasswordReset).filter(PasswordReset.email == request.email).order_by(PasswordReset.created_at.desc()).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Nie znaleziono kodu resetu")
    if (datetime.utcnow() - entry.created_at).total_seconds() > 900:
        db.delete(entry)
        db.commit()
        raise HTTPException(status_code=400, detail="Kod wygasł")
    if not pwd_context.verify(request.code, entry.code_hash):
        raise HTTPException(status_code=400, detail="Nieprawidłowy kod")

    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    user.password = pwd_context.hash(request.new_password)
    db.delete(entry)
    db.commit()
    return {"msg": "Hasło zostało zresetowane pomyślnie"}

@app.put("/users/{user_id}/active")
def set_user_active(user_id: int, is_active: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user.is_active = is_active
    db.commit()
    return {"msg": f"Konto użytkownika zostało {'aktywowane' if is_active else 'dezaktywowane'}"}

@app.delete("/configurations/cleanup")
def delete_invalid_configurations(db: Session = Depends(get_db)):
    deleted = db.query(models.Configuration).filter(models.Configuration.name == None).delete()
    db.commit()
    return {"msg": f"Usunięto {deleted} konfiguracji bez nazwy"}

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()
