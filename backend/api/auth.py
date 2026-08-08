import os
from datetime import datetime, timedelta
from typing import Optional
import secrets
import string

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import User, RoleEnum

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-change-this-before-any-real-deployment")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours — a school day
PENDING_2FA_EXPIRE_MINUTES = 5        # window to submit a TOTP code after password check

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def generate_default_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        # A pending-2FA token must never be usable as a real access token.
        if payload.get("purpose") == "2fa_pending":
            raise credentials_exception
        raise credentials_exception
    return user


def require_role(*allowed_roles: RoleEnum):
    """Dependency factory — e.g. Depends(require_role(RoleEnum.teacher, RoleEnum.admin))"""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this action",
            )
        return current_user
    return checker

def create_pending_2fa_token(user_id: int) -> str:
    """Issued after a correct password when the account has 2FA enabled.
    Deliberately NOT a usable access token — carries purpose=2fa_pending so
    get_current_user rejects it, and only /api/auth/2fa/verify accepts it."""
    return create_access_token(
        data={"sub": str(user_id), "purpose": "2fa_pending"},
        expires_delta=timedelta(minutes=PENDING_2FA_EXPIRE_MINUTES),
    )


def decode_pending_2fa_token(token: str) -> int:
    """Returns the user id encoded in a pending-2FA token, or raises 401."""
    pending_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your 2FA session has expired — please log in again",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise pending_exception
    if payload.get("purpose") != "2fa_pending":
        raise pending_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise pending_exception
    return int(user_id)