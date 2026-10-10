import uuid
from datetime import date, datetime
from enum import Enum
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, Numeric, String
from sqlalchemy.sql import func

from app.db.database import Base


class ProjectStatus(str, Enum):
    """Project status enumeration."""

    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

    @property
    def display_name(self) -> str:
        return self.value.capitalize()


class ProjectType(str, Enum):
    """Project type enumeration (optional field)."""

    FREELANCE = "freelance"
    CLIENT = "client"
    INTERNAL = "internal"


class Project(Base):
    """Project model representing a user's freelance/client project.

    Every project belongs to an authenticated user (owner_id).
    Projects can be in various states: DRAFT, ACTIVE, COMPLETED, or ARCHIVED.
    """

    __tablename__ = "projects"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    owner_id = Column(
        String(36),
        nullable=False,
        index=True,
    )

    name = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        String(1000),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default=ProjectStatus.DRAFT.value,
    )

    project_type = Column(
        String(50),
        nullable=True,
    )

    budget_amount = Column(
        Numeric(precision=12, scale=2),
        nullable=True,
    )

    currency = Column(
        String(3),
        nullable=True,
        default="USD",
    )

    start_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    target_end_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship to User (lazy="selectin")
    # owner = relationship("User", back_populates="projects")

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, owner_id={self.owner_id}, status={self.status})>"