"""
Custom exception classes for the application.
"""


class AppException(Exception):
    """Base exception class for application errors."""
    
    def __init__(self, message: str, error_code: str = "APP_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class DataIngestionError(AppException):
    """Raised when data ingestion fails."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "DATA_INGESTION_ERROR", details)


class ValidationError(AppException):
    """Raised when validation fails."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", details)


class ResourceNotFoundError(AppException):
    """Raised when a requested resource is not found."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "RESOURCE_NOT_FOUND", details)


class DatabaseError(AppException):
    """Raised when database operation fails."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "DATABASE_ERROR", details)