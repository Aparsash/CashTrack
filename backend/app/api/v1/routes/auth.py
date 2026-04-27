from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.db.supabase import get_supabase

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(data: RegisterRequest):
    db = get_supabase()
    try:
        response = db.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
        return {"message": "Registration successful. Please check your email."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
def login(data: LoginRequest):
    db = get_supabase()
    try:
        response = db.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )