from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session

from app.models.project import Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    """Service for project management operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_project(self, project_data: ProjectCreate, owner_id: str) -> Project:
        """Create a new project for the specified owner.

        Args:
            project_data: Validated project creation data.
            owner_id: String ID of the project owner (authenticated user).

        Returns:
            The created Project object.
        """
        # Create new project instance
        new_project = Project(
            owner_id=owner_id,
            **project_data.model_dump(exclude_unset=True),
        )

        self.db.add(new_project)
        self.db.commit()
        self.db.refresh(new_project)
        return new_project

    def get_projects(
        self,
        owner_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[ProjectStatus] = None,
    ) -> List[Project]:
        """Get projects for a specific owner with optional filtering.

        Args:
            owner_id: String ID of the project owner.
            skip: Number of records to skip (for pagination).
            limit: Maximum number of records to return.
            status: Optional status filter.

        Returns:
            List of Project objects belonging to the owner.
        """
        query = select(Project).where(Project.owner_id == owner_id)

        if status:
            query = query.where(Project.status == status.value)

        query = query.offset(skip).limit(limit).order_by(desc(Project.created_at))

        return self.db.execute(query).scalars().all()

    def get_project(self, project_id: str, owner_id: str) -> Optional[Project]:
        """Get a specific project by ID, ensuring ownership.

        The query filters by owner_id so that non-owners cannot access
        other users' projects. A 404 is returned for both non-existent
        projects and unauthorized access (prevents project enumeration).

        Args:
            project_id: String ID of the project to retrieve.
            owner_id: String ID of the expected owner (for authorization).

        Returns:
            Project object if found and owned by the specified user, None otherwise.
        """
        return self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.owner_id == owner_id,
            )
        ).scalars().first()

    def update_project(
        self,
        project_id: str,
        project_data: ProjectUpdate,
        owner_id: str,
    ) -> Optional[Project]:
        """Update a project, ensuring ownership.

        Args:
            project_id: String ID of the project to update.
            project_data: Validated project update data.
            owner_id: String ID of the expected owner (for authorization).

        Returns:
            Updated Project object if found and owned, None otherwise.
        """
        project = self.get_project(project_id, owner_id)
        if not project:
            return None

        # Update only provided fields
        update_data = project_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(project, field, value)

        self.db.commit()
        self.db.refresh(project)
        return project

    def archive_project(self, project_id: str, owner_id: str) -> bool:
        """Archive a project (soft delete), ensuring ownership.

        Args:
            project_id: String ID of the project to archive.
            owner_id: String ID of the expected owner (for authorization).

        Returns:
            True if project was archived, False if not found or not owned.
        """
        project = self.get_project(project_id, owner_id)
        if not project:
            return False

        project.status = ProjectStatus.ARCHIVED.value
        self.db.commit()
        return True

    def delete_project(self, project_id: str, owner_id: str) -> bool:
        """Permanently delete a project, ensuring ownership.

        Note: This method performs a hard delete and should be used with caution.
        Prefer archive_project() for most use cases.

        Args:
            project_id: String ID of the project to delete.
            owner_id: String ID of the expected owner (for authorization).

        Returns:
            True if project was deleted, False if not found or not owned.
        """
        project = self.get_project(project_id, owner_id)
        if not project:
            return False

        self.db.delete(project)
        self.db.commit()
        return True

    def get_project_count(
        self,
        owner_id: str,
        status: Optional[ProjectStatus] = None,
    ) -> int:
        """Get count of projects for a specific owner.

        Args:
            owner_id: String ID of the project owner.
            status: Optional status filter.

        Returns:
            Number of projects belonging to the owner.
        """
        query = select(func.count()).select_from(Project).where(Project.owner_id == owner_id)

        if status:
            query = query.where(Project.status == status.value)

        result = self.db.execute(query).scalar()
        return result if result is not None else 0