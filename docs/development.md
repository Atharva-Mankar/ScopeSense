# Scope Sense Development Guide

## Development Environment

### Prerequisites

Before you begin, make sure you have the following installed:
- Node.js (v18 or higher)
- Python (v3.11 or higher)
- Docker & Docker Compose (optional, for containerized development)

### Project Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ScopeSense
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Install backend dependencies:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -e ".[dev]"
```

4. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Running the Application

### Backend Development Server

**Method 1: Direct (no containers)**
```bash
cd backend
.\venv\Scripts\activate
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Method 2: Using Docker Compose**
```bash
docker-compose up backend
```

The backend will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Development Server

**Method 1: Direct (no containers)**
```bash
cd frontend
npm run dev
```

**Method 2: Using Docker Compose**
```bash
docker-compose up frontend
```

The frontend will be available at `http://localhost:5173`

### PostgreSQL Database

The database is typically started as part of Docker Compose:
```bash
docker-compose up db
```

**Default database credentials:**
- Host: `localhost` (or `db` from within containers)
- Port: `5432`
- Database: `scopesense`
- User: `postgres`
- Password: Change this in your `.env` file!

### Starting All Services

The recommended way to run the entire application stack:
```bash
docker-compose up
```

To run in detached mode:
```bash
docker-compose up -d
```

## Database Management

### Setting Up the Database

1. Start the PostgreSQL database
2. Create the initial migrations:
```bash
cd backend
# Configure alembic.ini with your database URL
python -m alembic upgrade head
```

### Running Migrations

```bash
cd backend
# Apply new migrations
python -m alembic upgrade head

# Rollback one migration
python -m alembic downgrade -1

# Create a new migration
python -m alembic revision --autogenerate -m "description"

# View migration status
python -m alembic history

# View migration tree
python -m alembic history --graph
```

### Database Health Check

```bash
# Backend health check with database
curl http://localhost:8000/api/v1/health/db
```

## Testing

### Backend Tests

```bash
cd backend
.\venv\Scripts\activate
PYTHONPATH=src python -m pytest tests/ -v
```

**Run specific tests:**
```bash
PYTHONPATH=src python -m pytest tests/test_health.py -v
```

**Run with coverage:**
```bash
pip install pytest-cov
PYTHONPATH=src python -m pytest tests/ -v --cov=src --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
```

**Run specific test file:**
```bash
npm run test tests/App.test.tsx
```

## Code Quality

### Linting

**Frontend:**
```bash
cd frontend
npm run lint
```

**Backend:**
```bash
cd backend
.\venv\Scripts\activate
ruff check src/
```

### Formatting

**Frontend (Prettier):**
```bash
cd frontend
npx prettier --write src/
```

**Backend (Black):**
```bash
cd backend
.\venv\Scripts\activate
pip install black
black src/
```

### Type Checking

**Frontend:**
```bash
cd frontend
npm run build
```
(Produces TypeScript errors if any)

**Backend:**
```bash
cd backend
.\venv\Scripts\activate
pip install mypy
mypy src/
```

## Git Workflow

### Branch Strategy

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add -A
git commit -m "feat: your descriptive commit message"
```

3. Push and create a pull request:
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention (Conventional Commits)

Use the following format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependencies, etc.

**Examples:**
```
feat: add user registration endpoint
fix: resolve database connection timeout issue
docs: update API documentation
style: format code with prettier
refactor: extract shared database utility functions
test: add tests for health endpoint
chore: update dependencies
```

## Project Directory Structure

```
ScopeSense/
├── frontend/                 # React frontend application
│   ├── src/                  # Source code
│   │   ├── api/              # API client configuration
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # Basic UI components
│   │   │   └── layouts/      # Layout components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── contexts/         # React contexts
│   │   ├── types/            # TypeScript type definitions
│   │   ├── main.tsx          # Application entry point
│   │   ├── App.tsx           # Root component
│   │   └── vite-env.d.ts     # Vite environment types
│   ├── tests/                # Frontend tests
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration
│
├── backend/                  # FastAPI backend application
│   ├── src/app/              # Application source code
│   │   ├── api/              # API routes
│   │   │   └── v1/           # API version 1
│   │   ├── core/             # Core functionality
│   │   ├── db/               # Database configuration
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   └── utils/            # Utility functions
│   ├── tests/                # Backend tests
│   ├── alembic/              # Database migrations
│   ├── pyproject.toml        # Python configuration
│   └── requirements.txt      # Python dependencies
│
├── database/                 # Database scripts
├── infra/                    # Infrastructure configurations
├── docs/                     # Documentation
│   ├── architecture.md       # Architecture documentation
│   ├── development.md        # Development guide
│   └── roadmap.md            # Project roadmap
├── tests/                    # Shared/integration tests
├── scripts/                  # Utility scripts
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Docker Compose configuration
├── README.md                 # Main documentation
└── LICENSE                   # License file
```

## Common Tasks

### Adding a New API Endpoint

1. Create a new router in `backend/src/app/api/v1/`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/items")
async def get_items():
    return [{"id": 1, "name": "Example"}]
```

2. Register the router in `backend/src/app/api/v1/api.py`:
```python
from app.api.v1 import items

api_router = APIRouter()
api_router.include_router(items.router, tags=["items"])
```

### Adding a Database Migration

1. Make your model changes
2. Generate a new migration:
```bash
cd backend
python -m alembic revision --autogenerate -m "your description"
```

3. Review the generated migration file
4. Apply the migration:
```bash
python -m alembic upgrade head
```

### Running in Development with Docker

```bash
# Start all services
docker-compose up

# Start only backend
docker-compose up backend

# Start only frontend
docker-compose up frontend

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Troubleshooting

### Port Already in Use

If a port is already in use:
- Backend: Change the port in the `uvicorn` command
- Frontend: Change the port in the `vite` command
- PostgreSQL: Change the port in `.env.example` and docker-compose.yml

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check your `.env` file for correct credentials
3. Verify the database exists
4. Check if the port is accessible

### Frontend Can't Reach Backend

1. Verify backend is running
2. Check `VITE_API_URL` in frontend
3. Check CORS configuration in backend

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

For more information, see the architecture documentation or the project roadmap.