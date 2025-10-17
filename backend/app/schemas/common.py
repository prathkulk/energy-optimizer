"""
Common Pydantic schemas used across the application.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Generic, TypeVar, List

T = TypeVar('T')


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    
    error_code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error_code": "VALIDATION_ERROR",
                    "message": "Invalid country code provided",
                    "details": {"country_code": "XX"}
                }
            ]
        }
    }


class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    
    status: str = Field(..., description="Service status (healthy/unhealthy)")
    timestamp: datetime = Field(..., description="Timestamp of health check")
    database: str = Field(..., description="Database connection status")
    version: str = Field(..., description="API version")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "healthy",
                    "timestamp": "2025-10-17T12:00:00Z",
                    "database": "connected",
                    "version": "1.0.0"
                }
            ]
        }
    }


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=50, ge=1, le=100, description="Number of items per page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    
    items: List[T] = Field(..., description="List of items for current page")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        """Helper method to create paginated response."""
        total_pages = (total + page_size - 1) // page_size  # Ceiling division
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )