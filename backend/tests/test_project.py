"""Tests for project management endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models.user import User
from app.models.roles import UserRole
from app.models.project import ProjectStatus
from app.core.security import hash_password


def test_register_and_login_user(client):
    """Helper function to register and login a user, returning auth headers."""
    # Register user
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )
    # If user already exists (409), try to login instead
    if register_response.status_code == 409:
        register_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!",
            },
        )
        assert register_response.status_code == 200
    else:
        assert register_response.status_code == 201

    # Login to get token
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
        },
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}


def test_create_project_success(client):
    """Test successful project creation."""
    headers = test_register_and_login_user(client)

    project_data = {
        "name": "Test Project",
        "description": "A test project for verification",
        "project_type": "freelance",
        "budget_amount": 5000.00,
        "currency": "USD",
        "start_date": "2026-10-01",
        "target_end_date": "2026-12-31",
    }

    response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == project_data["name"]
    assert data["description"] == project_data["description"]
    assert data["project_type"] == project_data["project_type"]
    assert float(data["budget_amount"]) == project_data["budget_amount"]
    assert data["currency"] == project_data["currency"]
    assert data["status"] == "draft"
    assert "id" in data
    assert "owner_id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_create_project_missing_name(client):
    """Test project creation with missing name fails."""
    headers = test_register_and_login_user(client)

    project_data = {
        "description": "A test project",
        "budget_amount": 1000.00,
    }

    response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    # Handle Pydantic v2 validation error format
    if isinstance(detail, list):
        # Check if any validation error mentions the 'name' field
        name_errors = [error for error in detail if 'name' in str(error.get('loc', []))]
        assert len(name_errors) > 0, f"No name validation errors found in {detail}"
    else:
        # Fallback for unexpected format
        detail_str = str(detail)
        assert "name" in detail_str.lower()


def test_create_project_negative_budget(client):
    """Test project creation with negative budget fails."""
    headers = test_register_and_login_user(client)

    project_data = {
        "name": "Test Project",
        "budget_amount": -100.00,
    }

    response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    # Handle Pydantic v2 validation error format
    if isinstance(detail, list):
        # Check if any validation error mentions the 'budget_amount' field
        budget_errors = [error for error in detail if 'budget_amount' in str(error.get('loc', []))]
        assert len(budget_errors) > 0, f"No budget validation errors found in {detail}"
    else:
        # Fallback for unexpected format
        detail_str = str(detail)
        assert "budget" in detail_str.lower()


def test_get_projects_empty(client):
    """Test getting projects when none exist."""
    headers = test_register_and_login_user(client)

    response = client.get(
        "/api/v1/projects",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["projects"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["size"] == 100
    assert data["pages"] == 0


def test_get_projects_after_creation(client):
    """Test getting projects after creating one."""
    headers = test_register_and_login_user(client)

    # Create a project
    project_data = {
        "name": "Test Project",
        "description": "A test project",
        "budget_amount": 2500.00,
    }

    create_response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )
    assert create_response.status_code == 201
    created_project = create_response.json()

    # Get projects
    response = client.get(
        "/api/v1/projects",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["projects"]) == 1
    assert data["total"] == 1
    assert data["projects"][0]["id"] == created_project["id"]
    assert data["projects"][0]["name"] == project_data["name"]


def test_get_specific_project(client):
    """Test getting a specific project by ID."""
    headers = test_register_and_login_user(client)

    # Create a project
    project_data = {
        "name": "Specific Test Project",
        "description": "Testing specific project retrieval",
        "project_type": "client",
        "budget_amount": 7500.50,
    }

    create_response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )
    assert create_response.status_code == 201
    created_project = create_response.json()
    project_id = created_project["id"]

    # Get specific project
    response = client.get(
        f"/api/v1/projects/{project_id}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == project_id
    assert data["name"] == project_data["name"]
    assert data["description"] == project_data["description"]
    assert data["project_type"] == project_data["project_type"]
    assert float(data["budget_amount"]) == project_data["budget_amount"]


def test_update_project(client):
    """Test updating a project."""
    headers = test_register_and_login_user(client)

    # Create a project
    project_data = {
        "name": "Original Project Name",
        "description": "Original description",
        "budget_amount": 3000.00,
    }

    create_response = client.post(
        "/api/v1/projects",
        json=project_data,
        headers=headers,
    )
    assert create_response.status_code == 201
    created_project = create_response.json()
    project_id = created_project["id"]

    # Update the project
    update_data = {
        "name": "Updated Project Name",
        "description": "Updated description",
        "budget_amount": 4500.00,
        "project_type": "freelance",
    }

    response = client.patch(
        f"/api/v1/projects/{project_id}",
        json=update_data,
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert float(data["budget_amount"]) == update_data["budget_amount"]
    assert data["project_type"] == update_data["project_type"]
    assert data["id"] == project_id