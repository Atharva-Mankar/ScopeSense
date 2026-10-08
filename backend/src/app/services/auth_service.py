from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.roles import UserRole
from app.schemas.user import UserCreate, UserLogin, UserUpdate, UserResponse


class AuthService:
    """Authentication service handling user registration, login, and token management."""

    def __init__(self, db: Session):
        self.db = db

    def register_user(self, user_data: UserCreate) -> User:
        """Register a new user.

        Args:
            user_data: Validated user registration data.

        Returns:
            The created User object.

        Raises:
            ValueError: If a user with the email already exists.
        """
        # Check if user with email already exists
        existing_user = self.db.execute(
            select(User).where(User.email == user_data.email)
        ).scalar_one_or_none()
        if existing_user:
            raise ValueError(f"User with email '{user_data.email}' already exists")

        # Hash the password
        hashed_password = hash_password(user_data.password)

        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            is_active=True,
            is_verified=False,  # Email verification would be implemented later
        )

        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        return new_user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password.

        Args:
            email: The user's email address.
            password: The plain text password.

        Returns:
            The User object if authentication succeeds, None otherwise.
        """
        # Normalize email for lookup
        normalized_email = email.strip().lower()

        # Find user by email
        user = self.db.execute(
            select(User).where(User.email == normalized_email)
        ).scalar_one_or_none()

        if not user:
            return None

        # Verify password
        if not verify_password(password, user.password_hash):
            return None

        # Check if user is active
        if not user.is_active:
            return None

        return user

    def update_last_login(self, user_id: UUID) -> None:
        """Update the last_login_at timestamp for a user.

        Args:
            user_id: The user's ID.
        """
        user = self.db.get(User, user_id)
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            self.db.commit()

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Retrieve a user by their ID.

        Args:
            user_id: The user's ID.

        Returns:
            The User object if found, None otherwise.
        """
        return self.db.get(User, user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Retrieve a user by their email.

        Args:
            email: The user's email address.

        Returns:
            The User object if found, None otherwise.
        """
        normalized_email = email.strip().lower()
        return self.db.execute(
            select(User).where(User.email == normalized_email)
        ).scalar_one_or_none()

    def activate_user(self, user_id: UUID) -> bool:
        """Activate a user account.

        Args:
            user_id: The user's ID.

        Returns:
            True if user was activated, False if user not found.
        """
        user = self.get_user_by_id(user_id)
        if user:
            user.is_active = True
            self.db.commit()
            return True
        return False

    def deactivate_user(self, user_id: UUID) -> bool:
        """Deactivate a user account.

        Args:
            user_id: The user's ID.

        Returns:
            True if user was deactivated, False if user not found.
        """
        user = self.get_user_by_id(user_id)
        if user:
            user.is_active = False
            self.db.commit()
            return True
        return False

    def verify_user(self, user_id: UUID) -> bool:
        """Mark a user as verified (e.g., after email verification).

        Args:
            user_id: The user's ID.

        Returns:
            True if user was verified, False if user not found.
        """
        user = self.get_user_by_id(user_id)
        if user:
            user.is_verified = True
            self.db.commit()
            return True
        return False

    def update_user(
        self, user_id: UUID, user_update: UserUpdate
    ) -> Optional[User]:
        """Update a user's profile information.

        Args:
            user_id: The user's ID.
            user_update: The fields to update.

        Returns:
            The updated User object if found, None otherwise.
        """
        user = self.get_user_by_id(user_id)
        if not user:
            return None

        # Update only provided fields
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def create_access_token_for_user(self, user: User) -> str:
        """Create an access token for a user.

        Args:
            user: The User object.

        Returns:
            JWT access token string.
        """
        role = UserRole.from_string(user.role)
        return create_access_token(
            subject=str(user.id),
            role=role,
        )

    def login_user(self, login_data: UserLogin) -> tuple[Optional[User], Optional[str]]:
        """Authenticate a user and create an access token.

        Args:
            login_data: Validated login credentials.

        Returns:
            Tuple of (user, access_token) if successful, (None, None) otherwise.
        """
        user = self.authenticate_user(login_data.email, login_data.password)
        if not user:
            return None, None

        # Update last login time
        self.update_last_login(user.id)

        # Create access token
        access_token = self.create_access_token_for_user(user)

        return user, access_token