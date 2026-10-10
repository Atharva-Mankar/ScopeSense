from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.project import ProjectStatus
from app.schemas.project import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.api.v1.endpoints.auth import get_current_user
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create a new project owned by the authenticated user.

    The owner_id is automatically set from the authenticated user.
    Clients cannot specify their own owner_id.
    """
    project_service = ProjectService(db)

    try:
        project = project_service.create_project(project_data, current_user.id)
        return ProjectResponse.model_validate(project)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.get("/", response_model=ProjectListResponse)
def list_projects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    status: ProjectStatus | None = None,
    skip: int = 0,
    limit: int = 100,
):
    """List all projects owned by the authenticated user.

    Users can only see their own projects - no cross-user access.
    """
    project_service = ProjectService(db)

    projects = project_service.get_projects(
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
    )

    total_count = project_service.get_project_count(
        owner_id=current_user.id,
        status=status,
    )

    pages = (total_count // limit) + (1 if total_count % limit > 0 else 0)

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=total_count,
        page=skip // limit + 1,
        size=limit,
        pages=pages,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Get a specific project by ID.

    Authorization: Only the owner can access their projects.
    Returns 404 if not found or not owned by the user (security: no enumeration).
    """
    project_service = ProjectService(db)

    project = project_service.get_project(project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Update a project owned by the authenticated user.

    Authorization: Only the owner can update their project.
    The owner_id is never modifiable by clients.
    """
    project_service = ProjectService(db)

    project = project_service.update_project(
        project_id=project_id,
        project_data=project_data,
        owner_id=current_user.id,
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def archive_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Archive a project (soft delete).

    Authorization: Only the owner can archive their project.
    Archived projects are retained for audit/history purposes.

    Note: DELETE is used for archival (soft-delete) rather than hard deletion
    to preserve contractual history and audit trail.
    """
    project_service = ProjectService(db)

    success = project_service.archive_project(
        project_id=project_id,
        owner_id=current_user.id,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return {"message": "Project archived successfully"}