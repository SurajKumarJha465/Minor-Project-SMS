import pyotp
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from api.database import get_db
from api.auth import (
    authenticate_user, create_access_token, get_current_user,
    create_pending_2fa_token, decode_pending_2fa_token,
)
from api.models import User, RoleEnum, SystemSettings
from api.schemas import TwoFactorLoginRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_settings(db: Session) -> SystemSettings | None:
    return db.query(SystemSettings).filter(SystemSettings.id == 1).first()


def _session_expiry(settings: SystemSettings | None) -> timedelta | None:
    # None -> auth.create_access_token falls back to its own 8h default.
    if settings and settings.session_timeout_enabled:
        return timedelta(minutes=30)
    return None


def _enforce_password_rotation(db: Session, user: User, settings: SystemSettings | None) -> None:
    """If rotation is on and this account's password is >=90 days old, flip
    must_change_password so the frontend's existing forced-change flow catches it.
    Skipped for accounts with no recorded change date (legacy rows) to avoid
    mass-locking everyone the moment the toggle is switched on."""
    if not settings or not settings.password_rotation_enabled or not user.password_changed_at:
        return
    if datetime.utcnow() - user.password_changed_at >= timedelta(days=90):
        user.must_change_password = True
        db.commit()


def _requires_2fa_setup(user: User, settings: SystemSettings | None) -> bool:
    # Policy currently scoped to admin accounts, matching the settings page copy
    # ("Require 2FA for all admin accounts").
    return bool(settings and settings.require_2fa and user.role == RoleEnum.admin and not user.totp_enabled)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)  # OAuth2 form calls it "username", we treat it as email
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    settings = _get_settings(db)
    _enforce_password_rotation(db, user, settings)

    if user.totp_enabled:
        # Correct password, but this account has 2FA — don't hand out a real
        # access token yet. The frontend must call /api/auth/2fa/verify with
        # this pending_token plus a TOTP code within PENDING_2FA_EXPIRE_MINUTES.
        return {
            "requires_2fa": True,
            "pending_token": create_pending_2fa_token(user.id),
        }

    token = create_access_token(data={"sub": str(user.id), "role": user.role.value}, expires_delta=_session_expiry(settings))
    return {
        "requires_2fa": False,
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "must_change_password": user.must_change_password,
        "must_setup_2fa": _requires_2fa_setup(user, settings),
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

    settings = _get_settings(db)
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value}, expires_delta=_session_expiry(settings))
    return {
        "requires_2fa": False,
        "access_token": token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "must_change_password": user.must_change_password,
        "must_setup_2fa": False,  # they just verified a live TOTP code, so 2FA is already set up
    }


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "role": current_user.role.value}