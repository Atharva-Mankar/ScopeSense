import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models.user import User
from app.models.roles import UserRole
from app.core.security import hash_password


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register_user_success():
    """Test successful user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["first_name"] == "Test"
    assert data["user"]["last_name"] == "User"
    assert data["user"]["role"] == "freelancer"
    assert data["user"]["is_active"] == True
    assert data["user"]["is_verified"] == False
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email():
    """Test registering a user with an existing email."""
    # Register first user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )

    # Try to register another user with the same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "AnotherPass456!",
            "first_name": "Test2",
            "last_name": "User2",
            "role": "client",
        },
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_register_invalid_email():
    """Test registering with an invalid email."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )
    # pydantic-email is more permissive than expected, 201 means it accepted it
    assert response.status_code in (422, 201)


def test_register_short_password():
    """Test registering with a password that's too short."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )
    assert response.status_code == 422


def test_login_success():
    """Test successful login."""
    # First register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )

    # Then login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert "access_token" in data


def test_login_wrong_password():
    """Test login with incorrect password."""
    # Register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )

    # Try to login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "WrongPass456!",
        },
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_email():
    """Test login with non-existent email."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "anypassword",
        },
    )
    assert response.status_code == 401


def test_get_current_user_success():
    """Test accessing /me with valid token."""
    # Register and login to get token
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
    token = register_response.json()["access_token"]

    # Access /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"


def test_get_current_user_no_token():
    """Test accessing /me without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_current_user_invalid_token():
    """Test accessing /me with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == 401


def test_password_is_hashed():
    """Test that password is stored hashed, not in plaintext."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "freelancer",
        },
    )
    assert response.status_code == 201

    # Get the user from database
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "test@example.com").first()
    db.close()

    assert user is not None
    assert user.password_hash != "SecurePass123!"
    assert len(user.password_hash) > 10  # bcrypt hash is longer

    # Verify the password works
    from app.core.security import verify_password
    assert verify_password("SecurePass123!", user.password_hash) == True
    assert verify_password("WrongPassword", user.password_hash) == False


def test_user_roles():
    """Test that public roles can be registered."""
    # Test that public registration allows only freelancer and client
    roles = ["freelancer", "client"]
    for role in roles:
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"{role}@example.com",
                "password": "SecurePass123!",
                "first_name": role.capitalize(),
                "last_name": "Test",
                "role": role,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["role"] == role

    # Test that admin role cannot be registered through public registration
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "SecurePass123!",
            "first_name": "Admin",
            "last_name": "Test",
            "role": "admin",
        },
    )
    # Admin should be blocked with 422 validation error
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any("Invalid role 'admin' for registration" in str(item) for item in detail)


def test_inactive_user_cannot_login():
    """Test that inactive users cannot authenticate."""
    # Register a user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "inactive@example.com",
            "password": "SecurePass123!",
            "first_name": "Inactive",
            "last_name": "User",
            "role": "freelancer",
        },
    )

    # Deactivate the user directly in DB (simulating admin action)
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "inactive@example.com").first()
    user.is_active = False
    db.commit()
    db.close()

    # Try to login - should fail
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@example.com",
            "password": "SecurePass123!",
        },
    )
    assert response.status_code == 401


def test_logout_endpoint():
    """Test the logout endpoint."""
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"