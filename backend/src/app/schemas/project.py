from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.project import ProjectStatus, ProjectType


class ProjectBase(BaseModel):
    """Base schema for project data."""

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Project name",
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Project description",
    )
    project_type: Optional[ProjectType] = Field(
        None,
        description="Project type",
    )
    budget_amount: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Project budget amount (non-negative)",
    )
    currency: Optional[str] = Field(
        "USD",
        min_length=3,
        max_length=3,
        description="Currency code (ISO 4217)",
    )
    start_date: Optional[date] = Field(
        None,
        description="Project start date",
    )
    target_end_date: Optional[date] = Field(
        None,
        description="Project target end date",
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Validate currency format (ISO 4217 3-letter code)."""
        if v is not None:
            v = v.strip().upper()
            if len(v) != 3 or not v.isalpha():
                raise ValueError("Currency must be a 3-letter ISO 4217 code")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectBase":
        """Validate that target_end_date is not before start_date."""
        if self.start_date and self.target_end_date:
            if self.target_end_date < self.start_date:
                raise ValueError("Target end date cannot be before start date")
        return self


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""

    pass


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project.

    All fields are optional — only provided fields will be updated.
    Note: owner_id cannot be updated via this schema.
    """

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Project name",
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Project description",
    )
    project_type: Optional[ProjectType] = Field(
        None,
        description="Project type",
    )
    budget_amount: Optional[Decimal] = Field(
        None,
        ge=0,
        decimal_places=2,
        description="Project budget amount (non-negative)",
    )
    currency: Optional[str] = Field(
        None,
        min_length=3,
        max_length=3,
        description="Currency code (ISO 4217)",
    )
    start_date: Optional[date] = Field(
        None,
        description="Project start date",
    )
    target_end_date: Optional[date] = Field(
        None,
        description="Project target end date",
    )
    status: Optional[ProjectStatus] = Field(
        None,
        description="Project status",
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Validate currency format (ISO 4217 3-letter code)."""
        if v is not None:
            v = v.strip().upper()
            if len(v) != 3 or not v.isalpha():
                raise ValueError("Currency must be a 3-letter ISO 4217 code")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectUpdate":
        """Validate that target_end_date is not before start_date."""
        if self.start_date and self.target_end_date:
            if self.target_end_date < self.start_date:
                raise ValueError("Target end date cannot be before start date")
        return self


class ProjectResponse(ProjectBase):
    """Schema for project responses."""

    id: UUID
    owner_id: UUID
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Schema for paginated project list responses."""

    projects: list[ProjectResponse]
    total: int
    page: int
    size: int
    pages: int