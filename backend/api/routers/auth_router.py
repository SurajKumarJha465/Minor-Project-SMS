import pyotp
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import (
    authenticate_user, create_access_token, get_current_user,
    create_pending_2fa_token, decode_pending_2fa_token,
)
from api.models import User
from api.schemas import TwoFactorLoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)  # OAuth2 form calls it "username", we treat it as email
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if user.totp_enabled:
        # Correct password, but this account has 2FA — don't hand out a real
        # access token yet. The frontend must call /api/auth/2fa/verify with
        # this pending_token plus a TOTP code within PENDING_2FA_EXPIRE_MINUTES.
        return {
            "requires_2fa": True,
            "pending_token": create_pending_2fa_token(user.id),
        }

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "requires_2fa": False,
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "must_change_password": user.must_change_password,
    }


@router.post("/2fa/verify")
def verify_login_2fa(payload: TwoFactorLoginRequest, db: Session = Depends(get_db)):
    user_id = decode_pending_2fa_token(payload.pending_token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=401, detail="Two-factor authentication is not active on this account")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code.strip(), valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {
        "requires_2fa": False,
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "must_change_password": user.must_change_password,
    }


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}