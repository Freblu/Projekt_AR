from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import User as UserModel
from .schemas import UserOut, RoleUpdate
from typing import List
from passlib.context import CryptContext
from .schemas import PasswordUpdate
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None
        }
        for u in users
    ]

@router.put("/{user_id}/role")
def change_user_role(user_id: int, data: RoleUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user.role = data.new_role
    db.commit()
    return {"message": "Rola zaktualizowana"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    db.delete(user)
    db.commit()
    return {"message": "Użytkownik usunięty"}


@router.put("/{user_id}/active")
def toggle_active(user_id: int, is_active: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user.is_active = bool(is_active)
    db.commit()
    return {"message": "Status konta zaktualizowany"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.put("/{user_id}/password")
def change_user_password(user_id: int, data: PasswordUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    user.password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Hasło zaktualizowane"}