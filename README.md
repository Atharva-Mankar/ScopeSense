# Scope Sense

## Contract and Scope Governance Platform

Scope Sense is a contract and scope-governance platform for freelance and service projects.

### Current Development Phase: Phase 0 — Foundation

This phase focuses on building a clean, scalable full-stack foundation for the Scope Sense application. The eventual application will contain features like authentication, users, client/freelancer roles, organizations, projects, contracts, scope items, milestones, change requests, and more.

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios for API calls
- ESLint & Prettier for code quality

**Backend:**
- Python 3.11
- FastAPI
- SQLAlchemy ORM
- Alembic for database migrations
- Pydantic for data validation
- PostgreSQL database
- Uvicorn ASGI server
- Pytest for testing

**Infrastructure:**
- Docker & Docker Compose
- Environment-based configuration

### Getting Started

#### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- Docker & Docker Compose (optional)

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Unix/macOS:
source venv/bin/activate

# Install dependencies
pip install -e .

# Run the development server
uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Using Docker (Recommended for Development)
```bash
# Start all services
docker-compose up

# The application will be available at:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

#### Health Check
Verify the backend is running:
```bash
curl http://localhost:8000/health
# Returns: {"status": "ok"}
```

### Project Structure

```
ScopeSense/
├── frontend/                 # React + Vite + TypeScript application
├── backend/                  # FastAPI + Python application
├── database/                 # Database scripts and configurations
├── infra/                    # Infrastructure as code
├── docs/                     # Documentation
├── tests/                    # Test files
├── scripts/                  # Utility scripts
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── docker-compose.yml       # Docker compose configuration
└── README.md                # This file
```

### API Endpoints

- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/health/db` - Database health check (when database is configured)

### Testing

#### Backend Tests
```bash
cd backend
PYTHONPATH=src python -m pytest tests/ -v
```

#### Frontend Tests
```bash
cd frontend
npm run test
```

### Development Guidelines

1. **Environment Variables**: Never commit secrets. Use `.env.example` as template and create local `.env` file.
2. **Code Quality**: Follow existing code style. Linting and formatting tools are configured.
3. **Commits**: Use conventional commit messages (feat:, fix:, docs:, style:, refactor:, test:, chore:).
4. **Branching**: Use feature branches for new work.

### Next Phase (Phase 1 — Authentication)

After completing Phase 0, the next phase will implement:
- User registration and authentication
- JWT-based token management
- Role-based access control (Client/Freelancer/Admin)
- Password hashing and security
- Session management

### License

MIT License - See LICENSE file for details.

---
*Built with ❤️ for freelancers and service professionals who need better contract and scope management.*