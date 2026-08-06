from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import authenticate_user, create_access_token, get_current_user
from api.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)  # OAuth2 form calls it "username", we treat it as email
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "must_change_password": user.must_change_password,
    }


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}