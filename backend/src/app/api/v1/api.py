from fastapi import APIRouter

from app.api.v1 import health
from app.api.v1.endpoints import auth, project

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(project.router, tags=["projects"])