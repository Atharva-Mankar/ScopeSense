import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext
from pydantic import SecretStr

from app.core.config import settings
from app.models.roles import UserRole


# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password to hash.

    Returns:
        Hashed password string.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The stored hashed password.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


def generate_secret_key() -> str:
    """Generate a secure random secret key for JWT signing."""
    return secrets.token_urlsafe(32)


# JWT token handling
def create_access_token(
    subject: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token.

    Args:
        subject: The user ID (UUID string) to encode in the token.
        role: The user's role.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": subject,
        "role": role.value,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token.

    Args:
        token: The JWT token string.

    Returns:
        Decoded payload dict if valid, None otherwise.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.get_secret_value(),
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.JWTError:
        return None


def get_token_expiration(token: str) -> Optional[datetime]:
    """Get the expiration time of a token without full validation.

    Useful for displaying token expiry in UI.

    Args:
        token: The JWT token string.

    Returns:
        Expiration datetime if token is valid, None otherwise.
    """
    payload = decode_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return None