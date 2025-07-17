from fastapi import APIRouter
from datetime import datetime
from app.config import settings

router = APIRouter()

@router.get("/")
async def root():
    return {
        "message": "Welcome to Saransh - AI News App",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.APP_ENV,
        "api_version": "v1"
    }

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "saransh-news-app",
        "environment": settings.APP_ENV,
        "api_version": "v1"
    } 