"""
Health check endpoint.
"""

from fastapi import APIRouter, status
from datetime import datetime

from app.schemas.common import HealthCheckResponse
from app.database import check_db_connection
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check if the API and its dependencies are healthy"
)
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint.
    
    Returns:
        HealthCheckResponse with service status
    """
    # Check database connection
    db_status = "connected" if check_db_connection() else "disconnected"
    
    # Determine overall status
    overall_status = "healthy" if db_status == "connected" else "unhealthy"
    
    return HealthCheckResponse(
        status=overall_status,
        timestamp=datetime.utcnow(),
        database=db_status,
        version=settings.app_version
    )