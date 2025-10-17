"""
Validation utility functions.
"""

from datetime import datetime, timedelta, timezone
from typing import Tuple
from app.config import settings
from app.utils.exceptions import ValidationError


def validate_date_range(start_date: datetime, end_date: datetime) -> Tuple[datetime, datetime]:
    """
    Validate date range for data ingestion.
    
    Args:
        start_date: Start datetime
        end_date: End datetime
        
    Returns:
        Tuple of (start_date, end_date)
        
    Raises:
        ValidationError: If date range is invalid
    """
    # Check if end_date is after start_date
    if end_date <= start_date:
        raise ValidationError(
            "End date must be after start date",
            {"start_date": str(start_date), "end_date": str(end_date)}
        )
    
    # Check if date range is not too large
    days_diff = (end_date - start_date).days
    if days_diff > settings.max_days_back:
        raise ValidationError(
            f"Date range cannot exceed {settings.max_days_back} days",
            {"days_requested": days_diff, "max_allowed": settings.max_days_back}
        )
    
    # Check if end_date is not in the future
    # Make 'now' timezone-aware to match the incoming datetime
    now = datetime.now(timezone.utc)
    
    # Ensure both datetimes are timezone-aware for comparison
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    
    if end_date > now:
        raise ValidationError(
            "End date cannot be in the future",
            {"end_date": str(end_date), "current_time": str(now)}
        )
    
    return start_date, end_date


def validate_num_households(num_households: int) -> int:
    """
    Validate number of households.
    
    Args:
        num_households: Number of households
        
    Returns:
        Validated number of households
        
    Raises:
        ValidationError: If number is out of range
    """
    if num_households < settings.min_households or num_households > settings.max_households:
        raise ValidationError(
            f"Number of households must be between {settings.min_households} and {settings.max_households}",
            {
                "requested": num_households,
                "min": settings.min_households,
                "max": settings.max_households
            }
        )
    
    return num_households


def validate_country_code(country_code: str) -> str:
    """
    Validate country code.
    
    Args:
        country_code: Two-letter country code
        
    Returns:
        Validated country code (uppercase)
        
    Raises:
        ValidationError: If country code is invalid
    """
    from app.utils.entsoe_client import ENTSOEClient
    
    country_code = country_code.upper()
    
    if country_code not in ENTSOEClient.AREA_CODES:
        raise ValidationError(
            f"Invalid country code: {country_code}",
            {
                "provided": country_code,
                "available": list(ENTSOEClient.AREA_CODES.keys())
            }
        )
    
    return country_code