# Authentication Architecture

## Overview
This document describes the authentication system implemented in Phase 1 of Scope Sense. The system provides secure user registration, login, session management, and role-based access control.

## User Model

### Fields
- `id`: UUID (Primary Key)
- `email`: String (Unique, indexed, normalized to lowercase)
- `password_hash`: String (bcrypt hashed password)
- `first_name`: String
- `last_name`: String
- `role`: String (enum: freelancer, client, admin)
- `is_active`: Boolean (default: true)
- `is_verified`: Boolean (default: false)
- `created_at`: DateTime (timezone-aware, server default)
- `updated_at`: DateTime (timezone-aware, on update)
- `last_login_at`: DateTime (timezone-aware, nullable)

### Constraints
- Email uniqueness enforced at database level
- Email normalization (lowercase, trimmed) for consistent lookups
- Password never stored in plaintext
- Role validation against allowed values

## Password Security

### Hashing Algorithm
- **bcrypt** with automatic salt generation
- Configured via `passlib[bcrypt]` library
- Work factor: Default (appropriate for current hardware)

### Implementation
Located in `app/core/security.py`:
- `hash_password()`: Creates bcrypt hash from plaintext password
- `verify_password()`: Securely verifies plaintext against hash
- Never logs or returns password hashes in API responses

### Requirements Met
- [x] Never store plaintext passwords
- [x] Never log passwords
- [x] Never return password_hash in API responses
- [x] Password verification happens securely
- [x] Password hashing configuration is centralized

## JWT Authentication

### Token Structure
- **Algorithm**: HS256 (configurable via settings)
- **Claims**:
  - `sub`: User ID (UUID string)
  - `role`: User's role (string)
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp
  - `type`: Token type ("access")
- **Expiration**: Configurable (default: 8 hours)
- **Secret Key**: Stored in environment variable `SECRET_KEY`

### Implementation
Located in `app/core/security.py`:
- `create_access_token()`: Generates JWT with user ID and role
- `decode_token()`: Validates and decodes JWT
- `get_token_expiration()`: Retrieves expiration time

### Security Properties
- [x] Never puts password or sensitive data in JWT
- [x] Uses environment configuration for secrets
- [x] Proper expiration handling
- [x] Invalid/expired tokens return appropriate HTTP errors

## API Endpoints

### Authentication Routes (`/api/v1/auth/*`)

#### POST `/register`
- **Description**: Register a new user
- **Request Body**: `UserCreate` schema
- **Success Response**: `TokenResponse` (201 Created)
- **Error Responses**:
  - 409 Conflict: Email already exists
  - 422 Unprocessable Entity: Validation error
- **Security**: Password hashed before storage

#### POST `/login`
- **Description**: Authenticate user and return access token
- **Request Body**: `UserLogin` schema
- **Success Response**: `TokenResponse` (200 OK)
- **Error Responses**:
  - 401 Unauthorized: Invalid credentials
- **Security**: Timing attack resistant password verification

#### GET `/me`
- **Description**: Get current authenticated user's information
- **Requirements**: Valid Bearer token in Authorization header
- **Success Response**: `UserResponse` (200 OK)
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 403 Forbidden: Inactive user

#### POST `/logout`
- **Description**: Logout endpoint (client-side token removal)
- **Note**: JWT tokens are stateless; this endpoint exists for API completeness
- **Success Response**: `MessageResponse` (200 OK)
- **Client Responsibility**: Remove token from storage

## Role-Based Authorization

### Roles
- `FREELANCER`: Independent contractors offering services
- `CLIENT`: Individuals or organizations hiring freelancers
- `ADMIN`: System administrators (reserved for future use)

### Implementation
- **Enum**: `UserRole` in `app/models/roles.py` provides type safety
- **Validation**: Pydantic schemas validate role values
- **Authorization Dependency**: `get_current_user()` in `app/api/v1/endpoints/auth.py`
- **Future Expansion**: Designed to support `require_role()` dependency

### Current Usage
- Role stored in JWT token for client-side access decisions
- Role validation during registration and updates
- Role-based UI elements in frontend (conditional rendering)

## Frontend Implementation

### Authentication Context
- **Location**: `frontend/src/context/AuthContext.tsx`
- **State Management**: React Context for auth state
- **Stored Data**: User object, authentication status, loading state
- **Methods**: `login()`, `register()`, `logout()`, `refreshUser()`

### Protected Routes
- **Component**: `ProtectedRoute` in `frontend/src/components/layouts/ProtectedRoute.tsx`
- **Behavior**: Redirects unauthenticated users to `/login`
- **Location Awareness**: Preserves attempted destination for post-login redirect

### Pages
- **Login Page**: `/login` - Email/password form with validation
- **Register Page**: `/register` - Registration form with role selection
- **Dashboard Page**: `/dashboard` - Protected placeholder showing user info

### API Integration
- **Axios Interceptor**: Automatically attaches Bearer token to requests
- **Token Storage**: `localStorage` (to be upgraded to HttpOnly cookies)
- **User Data**: Cached in localStorage for quick access

### Security Features
- [x] Login/registration forms with validation
- [x] Loading states and error handling
- [x] Protected route redirects
- [x] Authenticated UI showing user information
- [x] Logout functionality
- [x] Password visibility toggle (planned enhancement)

## Environment Configuration

### Required Variables
- `SECRET_KEY`: Secret key for JWT signing
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 480 = 8 hours)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `POSTGRES_*`: Database connection parameters
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins

### Security Notes
- [x] Secrets never hardcoded
- [x] Environment-based configuration
- [x] `.env.example` template provided
- [x] CORS properly configured

## Limitations and Future Improvements

### Known Limitations
1. **Token Storage**: Currently uses `localStorage` (vulnerable to XSS)
   - **Planned Improvement**: HttpOnly cookies with CSRF protection
2. **Token Revocation**: Stateless JWT cannot be invalidated server-side
   - **Planned Improvement**: Refresh token rotation + blacklist
3. **Email Verification**: Not implemented in Phase 1
   - **Planned Improvement**: Email verification workflow
4. **Password Reset**: Not implemented in Phase 1
   - **Planned Improvement**: Secure password reset via email
5. **Rate Limiting**: Not implemented on auth endpoints
   - **Planned Improvement**: Rate limiting to prevent brute force

### Security Enhancements Planned
1. **HttpOnly Cookies**: For secure token storage
2. **CSRF Protection**: For cookie-based authentication
3. **Refresh Tokens**: For secure token renewal
4. **Rate Limiting**: On authentication endpoints
5. **Account Lockout**: After failed login attempts
6. **Password Strength**: Enhanced requirements (special chars, etc.)
7. **Audit Logging**: For authentication events
8. **Multi-Factor Authentication**: Optional MFA support

## Testing

### Backend Tests
Located in `backend/tests/test_auth.py`:
- User registration (valid/invalid cases)
- Login/logout functionality
- Token validation and protection
- Password hashing verification
- Role-based access control
- Error handling and edge cases

### Frontend Tests
Located in `frontend/src/tests/auth.test.tsx`:
- Form rendering and validation
- Authentication success/failure flows
- Protected route behavior
- Token storage and retrieval
- User interface updates

### Test Commands
```bash
# Backend
cd backend
PYTHONPATH=src python -m pytest tests/test_auth.py -v

# Frontend
cd frontend
npm run test
```