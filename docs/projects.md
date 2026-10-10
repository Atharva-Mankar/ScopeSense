# Projects Architecture

## Overview
This document describes the project management system implemented in Phase 2 of Scope Sense. The system provides complete project lifecycle management (create, read, update, archive) with proper authorization, validation, and workspace functionality.

## Project Model

### Fields
- `id`: UUID (Primary Key)
- `owner_id`: UUID (Foreign Key to User, indexed, nullable=False)
- `name`: String (max 255 chars, nullable=False)
- `description`: Text (max 1000 chars, nullable=True)
- `status`: String (enum: draft, active, completed, archived, default: draft)
- `project_type`: String (enum: freelance, client, internal, nullable=True)
- `budget_amount`: Decimal (precision=12, scale=2, nullable=True)
- `currency`: String (ISO 4217, max 3 chars, default: "USD")
- `start_date`: DateTime (timezone-aware, nullable=True)
- `target_end_date`: DateTime (timezone-aware, nullable=True)
- `created_at`: DateTime (timezone-aware, server default, nullable=False)
- `updated_at`: DateTime (timezone-aware, server default + on update, nullable=False)

### Constraints
- Foreign key constraint: `owner_id` references `users.id`
- Check constraint: `budget_amount >= 0` (non-negative)
- Check constraint: `currency` must be uppercase ISO 4217 code (3 chars)
- Check constraint: `target_end_date >= start_date` when both are provided
- Index on `owner_id` for efficient user-specific queries
- Index on `status` for filtering
- Composite index on `(owner_id, status)` for owner+status filtering

### Status Enumeration
- `DRAFT`: Initial state, project being planned
- `ACTIVE`: Project actively in progress
- `COMPLETED`: Project finished successfully
- `ARCHIVED`: Soft-deleted project (preserved for audit/history)

### Project Type Enumeration
- `FREELANCE`: Projects where user is freelancer providing services
- `CLIENT`: Projects where user is client hiring services  
- `INTERNAL`: Internal projects for user's own organization

## Service Layer

### ProjectService Class
Located in `app/services/project_service.py`, provides business logic for project operations.

#### Methods
1. `create_project(project_data, owner_id)` → Project
   - Creates new project with validated data and owner_id
   - Returns created Project object

2. `get_projects(owner_id, skip=0, limit=100, status=None)` → List[Project]
   - Retrieves paginated projects for owner with optional status filter
   - Orders by created_at descending (newest first)

3. `get_project(project_id, owner_id)` → Optional[Project]
   - Retrieves specific project by ID, ensuring ownership
   - Returns None if not found or not authorized (prevents info leakage)

4. `update_project(project_id, project_data, owner_id)` → Optional[Project]
   - Updates project with validated data, ensuring ownership
   - Returns updated Project object or None

5. `archive_project(project_id, owner_id)` → bool
   - Soft deletes project by setting status to ARCHIVED
   - Returns True if successful, False if not found/not owned

6. `delete_project(project_id, owner_id)` → bool
   - Permanently deletes project (hard delete)
   - Returns True if successful, False if not found/not owned
   - Note: Prefer archive_project() for most use cases

7. `get_project_count(owner_id, status=None)` → int
   - Returns count of projects for owner with optional status filter
   - Used for pagination calculations

### Security Features
- All methods require `owner_id` parameter from authenticated user (never from client)
- `get_project()` and related methods filter by both `project_id` AND `owner_id`
- This prevents IDOR (Insecure Direct Object Reference) attacks
- Unauthorized access returns 404 (not 403/401) to avoid project enumeration
- Database-level constraints ensure data integrity

## API Endpoints

### Base Path: `/api/v1/projects`

#### GET `/projects`
- **Description**: Get paginated list of projects for authenticated user
- **Query Parameters**:
  - `skip`: Number of records to skip (default: 0)
  - `limit`: Maximum records to return (default: 100, max: 1000)
  - `status`: Filter by project status (draft, active, completed, archived)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (200 OK):
  ```json
  {
    "projects": [Project objects],
    "total": 42,
    "page": 1,
    "size": 100,
    "pages": 1
  }
  ```
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token

#### POST `/projects`
- **Description**: Create a new project
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: ProjectCreate schema
- **Success Response** (201 Created): Created Project object
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 422 Unprocessable Entity: Validation error

#### GET `/projects/{project_id}`
- **Description**: Get specific project by ID
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (200 OK): Project object
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 404 Not Found: Project not found or access denied (prevents enumeration)

#### PATCH `/projects/{project_id}`
- **Description**: Update project partially
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: ProjectUpdate schema
- **Success Response** (200 OK): Updated Project object
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 404 Not Found: Project not found or access denied
  - 422 Unprocessable Entity: Validation error

#### DELETE `/projects/{project_id}`
- **Description**: Archive project (soft delete)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (200 OK): `{"message": "Project archived successfully"}`
- **Error Responses**:
  - 401 Unauthorized: Missing or invalid token
  - 404 Not Found: Project not found or access denied

## Database Migration

### Alembic Migration: 002_create_project_table.py
Creates the projects table with:
- UUID primary key
- Foreign key to users table with CASCADE behavior
- All fields with appropriate types and constraints
- Check constraints for data validation:
  - `budget_amount >= 0`
  - `length(currency) = 3 AND currency = upper(currency)`
  - `(target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date)`
- Indexes:
  - `ix_projects_owner_id` (on owner_id)
  - `ix_projects_status` (on status)
  - `ix_projects_owner_id_status` (composite)

## Pydantic Schemas

### ProjectCreate (app/schemas/project.py)
- `name`: String (required, min 1, max 255)
- `description`: String (optional, max 1000)
- `project_type`: ProjectType enum (optional)
- `budget_amount`: Float (optional, gt=0)
- `currency`: String (length=3, uppercase, default="USD")
- `start_date`: Date (optional, ISO format)
- `target_end_date`: Date (optional, ISO format)

Validation:
- Budget must be non-negative
- Currency must be uppercase ISO 4217 code (3 letters)
- Target end date must be on or after start date (if both provided)

### ProjectUpdate (app/schemas/project.py)
All fields optional (for PATCH updates):
- Same fields and validations as ProjectCreate
- At least one field must be provided

### ProjectResponse (implicit from Project model)
All fields returned in API responses:
- Includes computed fields like id, owner_id, timestamps
- Budget amount as float for JSON serialization
- Status as string value

## Frontend Implementation

### Pages Created
1. **ProjectList.tsx** (`/projects`)
   - Displays paginated list of user's projects
   - Shows project name, type, budget, status, dates
   - Button to create new project
   - Loading, empty, and error states

2. **ProjectForm.tsx** (`/projects/new` and `/projects/:id/edit`)
   - Form for creating and editing projects
   - Fields: name, description, project type, budget, currency, dates
   - Currency dropdown with common ISO 4217 codes
   - Date pickers with validation (target ≥ start)
   - Submit button with loading state

3. **ProjectDetail.tsx** (`/projects/:id`)
   - Project workspace/dashboard view
   - Shows project information and metrics
   - Placeholder sections for future features (tasks, files, etc.)

4. **ProjectSettings.tsx** (`/projects/:id/settings`)
   - Displays all project details in read-only form
   - Useful for reviewing complete project information

### App Routing (App.tsx)
Added protected routes:
- `/projects` - ProjectList (requires auth)
- `/projects/new` - ProjectForm for creation (requires auth)
- `/projects/:id` - ProjectDetail (requires auth)
- `/projects/:id/edit` - ProjectForm for editing (requires auth)
- `/projects/:id/settings` - ProjectSettings (requires auth)

### API Service
- Reuses existing Phase 1 API client from `src/lib/api.ts`
- Automatic Bearer token injection via Axios interceptor
- Endpoints: `/api/v1/projects/*`

### Components
- Form validation with react-hook-form and zod/yup
- Currency selection dropdown
- Date pickers with validation
- Status badges with color coding
- Responsive layout using Ant Design grid system

## Security Considerations

### Authorization
- Owner ID always taken from authenticated user (JWT sub claim)
- Never trusts client-provided owner_id
- All service methods verify ownership before operating
- Prevents vertical privilege escalation

### Data Validation
- Input validation at API layer (Pydantic schemas)
- Database-level constraints as backup
- Sanitization of string fields to prevent XSS
- Proper parameter binding to prevent SQL injection

### Information Leakage Prevention
- Authorization failures return 404 (not 403/401)
- Prevents attackers from discovering project existence
- Consistent error messaging for security

### Audit Trail
- Soft delete (archive) preserves all project data
- Timestamps track creation and modification
- Owner relationship maintained for accountability

## Testing

### Backend Tests (tests/test_project.py)
Comprehensive test suite covering:
1. User authentication helper
2. Project creation (valid/invalid data)
3. Validation errors (missing name, negative budget)
4. Empty project list
5. Project list after creation
6. Specific project retrieval
7. Project updates
8. Project archiving (soft delete)
9. Unauthorized access prevention
10. Cross-user access prevention (IDOR testing)

### Test Patterns
- Uses TestClient for API testing
- In-memory SQLite database for isolation
- Helper function for user registration/login
- Tests both positive and negative cases
- Validates response schemas and status codes
- Checks for proper error handling

### Frontend Testing
- Would follow similar patterns to auth tests
- Form validation and submission
- Protected route behavior
- API integration mocking
- UI state management

## Limitations and Future Improvements

### Current Limitations
1. **No hard delete option**: Only soft delete (archive) available via API
2. **Limited project metadata**: No custom fields or tags
3. **Basic filtering**: Only by status, no date range or text search
4. **Simple pagination**: Offset-based (can be inefficient for large datasets)
5. **No project statistics**: No built-in reporting or analytics

### Planned Enhancements
1. **Hard delete option**: Add delete_project endpoint with confirmation
2. **Custom fields**: Allow user-defined project attributes
3. **Advanced filtering**: Date range, text search, budget ranges
4. **Keyset pagination**: More efficient pagination for large datasets
5. **Project statistics**: Summary metrics, progress tracking
6. **File attachments**: Ability to attach documents to projects
7. **Task management**: Basic task/todo lists within projects
8. **Collaboration**: Share projects with team members
9. **Notifications**: Project activity alerts
10. **Templates**: Save projects as templates for reuse

## Dependencies
- **Backend**: FastAPI, SQLAlchemy, Pydantic v2, python-jose, passlib
- **Frontend**: React, React Router, Axios, Ant Design/Formik/Yup (or similar)
- **Database**: PostgreSQL (development/testing with SQLite)
- **Testing**: Pytest, httpx, TestClient

## Implementation Notes
- Reused Phase 1 authentication system without modification
- Followed existing code patterns and conventions
- Maintained backward compatibility with existing auth
- Comprehensive error handling with appropriate HTTP status codes
- Type safety throughout (Python typing, TypeScript/Frontend types)
- Database migrations managed with Alembic
- All changes covered by automated tests