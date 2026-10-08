from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.roles import UserRole

# Roles that public registration is allowed to select.
# ADMIN is intentionally excluded: admin accounts are created
# through internal/provisioning channels only.
PUBLIC_ROLES = frozenset({UserRole.FREELANCER.value, UserRole.CLIENT.value})


class UserBase(BaseModel):
    """Base schema for user data."""

    email: str
    first_name: str
    last_name: str
    role: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        """Normalize email: lowercase and strip whitespace."""
        return v.strip().lower()

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate that the role is a known user role."""
        if not isinstance(v, str):
            raise ValueError("Role must be a string")
        normalized = v.strip().lower()
        if normalized not in [r.value for r in UserRole]:
            raise ValueError(
                f"Invalid role '{v}'. Must be one of: {', '.join(UserRole.allowed_values())}"
            )
        return normalized


class UserCreate(UserBase):
    """Schema for user registration.

    Public registration is restricted to PUBLIC_ROLES (freelancer, client).
    ADMIN role is not allowed for self-registration and must be created
    through internal/provisioning channels.
    """

    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets minimum requirements."""
        if not v:
            raise ValueError("Password is required")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        return v

    @field_validator("role")
    @classmethod
    def validate_public_role(cls, v: str) -> str:
        """Validate that the role is allowed for public registration.

        Only freelancer and client are allowed. Admin must be created
        through internal provisioning.
        """
        if not isinstance(v, str):
            raise ValueError("Role must be a string")
        normalized = v.strip().lower()
        if normalized not in PUBLIC_ROLES:
            raise ValueError(
                f"Invalid role '{v}' for registration. "
                f"Must be one of: {', '.join(sorted(PUBLIC_ROLES))}"
            )
        return normalized


class UserLogin(BaseModel):
    """Schema for user login."""

    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    """Schema for updating user profile.

    All fields are optional — only provided fields will be updated.
    """

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().lower()
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            normalized = v.strip().lower()
            if normalized not in [r.value for r in UserRole]:
                raise ValueError(
                    f"Invalid role '{v}'. Must be one of: {', '.join(UserRole.allowed_values())}"
                )
            return normalized
        return v


class UserResponse(BaseModel):
    """Schema for user responses.

    NEVER exposes password_hash in API responses.
    """

    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    user: Optional[UserResponse] = None


class MessageResponse(BaseModel):
    """Generic message response schema."""

    message: str