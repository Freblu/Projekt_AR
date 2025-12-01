from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import get_db
from passlib.context import CryptContext
from .schemas import ResetPasswordRequest
from . import schemas

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/raw-users")
def get_users_raw(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT id, email, role FROM users"))
    return [dict(row) for row in result]

@router.get("/raw-elements")
def get_elements_raw(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT id, symbol, name, atomic_number FROM elements"))
    return [dict(row) for row in result]

@router.delete("/raw-delete-user/{user_id}")
def delete_user_raw(user_id: int, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})
    db.commit()
    return {"msg": "Użytkownik usunięty (RAW SQL)", "id": user_id}

@router.post("/raw-reset-password")
def reset_password_raw(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    row = db.execute(text(
        "SELECT * FROM password_resets WHERE email = :email ORDER BY created_at DESC LIMIT 1"
    ), {"email": request.email}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Nie znaleziono kodu resetu")

    is_valid = db.execute(text("SELECT is_code_valid(:created_at) AS valid"),
                          {"created_at": row.created_at}).fetchone()["valid"]

    if not is_valid:
        raise HTTPException(status_code=400, detail="Kod wygasł")

    if not pwd_context.verify(request.code, row.code_hash):
        raise HTTPException(status_code=400, detail="Nieprawidłowy kod")

    hashed = pwd_context.hash(request.new_password)

    with db.begin():
        db.execute(text("UPDATE users SET password = :p WHERE email = :e"),
                   {"p": hashed, "e": request.email})
        db.execute(text("CALL log_password_change(:e)"), {"e": request.email})
        db.execute(text("DELETE FROM password_resets WHERE email = :e"), {"e": request.email})

    return {"msg": "Hasło zresetowane (RAW SQL + procedura + funkcja)"}

@router.post("/raw-create-user")
def create_user_raw(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # sprawdź, czy email istnieje
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": user.email}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Email już istnieje")

    # zahaszuj hasło
    hashed = pwd_context.hash(user.password)

    # INSERT przez RAW SQL
    db.execute(
        text("INSERT INTO users (email, password, role) VALUES (:email, :password, :role)"),
        {"email": user.email, "password": hashed, "role": user.role}
    )
    db.commit()

    return {"msg": "Użytkownik utworzony (RAW SQL)"}
