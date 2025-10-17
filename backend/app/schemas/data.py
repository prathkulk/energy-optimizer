"""
Pydantic schemas for data ingestion endpoints.
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class CountryCode(str, Enum):
    """Supported European country codes."""
    DE = "DE"  # Germany
    FR = "FR"  # France
    IT = "IT"  # Italy
    ES = "ES"  # Spain
    NL = "NL"  # Netherlands
    BE = "BE"  # Belgium
    AT = "AT"  # Austria
    PL = "PL"  # Poland
    SE = "SE"  # Sweden
    NO = "NO"  # Norway


class DataIngestionRequest(BaseModel):
    """Request schema for data ingestion endpoint."""
    
    country_code: CountryCode = Field(
        ...,
        description="Two-letter country code"
    )
    start_date: datetime = Field(
        ...,
        description="Start date for data fetch (UTC)"
    )
    end_date: datetime = Field(
        ...,
        description="End date for data fetch (UTC)"
    )
    num_households: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Number of synthetic households to create"
    )
    
    @field_validator('end_date')
    @classmethod
    def validate_date_range(cls, end_date: datetime, info) -> datetime:
        """Validate that end_date is after start_date."""
        start_date = info.data.get('start_date')
        if start_date and end_date <= start_date:
            raise ValueError("end_date must be after start_date")
        return end_date
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "country_code": "DE",
                    "start_date": "2025-10-01T00:00:00Z",
                    "end_date": "2025-10-07T23:59:59Z",
                    "num_households": 100
                }
            ]
        }
    }


class ConsumptionStatistics(BaseModel):
    """Statistics about consumption data."""
    
    mean_consumption: float = Field(..., description="Mean consumption in kWh per hour")
    median_consumption: float = Field(..., description="Median consumption in kWh per hour")
    std_deviation: float = Field(..., description="Standard deviation of consumption")
    min_consumption: float = Field(..., description="Minimum consumption value")
    max_consumption: float = Field(..., description="Maximum consumption value")
    total_consumption: float = Field(..., description="Total consumption across all records")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "mean_consumption": 1.245,
                    "median_consumption": 1.156,
                    "std_deviation": 0.423,
                    "min_consumption": 0.102,
                    "max_consumption": 3.872,
                    "total_consumption": 20916.5
                }
            ]
        }
    }


class DateRange(BaseModel):
    """Date range information."""
    
    start: datetime = Field(..., description="Start datetime")
    end: datetime = Field(..., description="End datetime")
    total_hours: int = Field(..., description="Total hours in range")


class DataIngestionResponse(BaseModel):
    """Response schema for data ingestion endpoint."""
    
    status: str = Field(..., description="Ingestion status (success/failed)")
    message: str = Field(..., description="Status message")
    total_records: int = Field(..., description="Total records ingested")
    unique_households: int = Field(..., description="Number of unique households")
    country: str = Field(..., description="Country code")
    date_range: DateRange = Field(..., description="Date range of ingested data")
    statistics: ConsumptionStatistics = Field(..., description="Consumption statistics")
    ingestion_time_seconds: float = Field(..., description="Time taken for ingestion")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "message": "Successfully ingested 16800 records",
                    "total_records": 16800,
                    "unique_households": 100,
                    "country": "DE",
                    "date_range": {
                        "start": "2025-10-01T00:00:00Z",
                        "end": "2025-10-07T23:00:00Z",
                        "total_hours": 168
                    },
                    "statistics": {
                        "mean_consumption": 1.245,
                        "median_consumption": 1.156,
                        "std_deviation": 0.423,
                        "min_consumption": 0.102,
                        "max_consumption": 3.872,
                        "total_consumption": 20916.5
                    },
                    "ingestion_time_seconds": 4.52
                }
            ]
        }
    }


class DataSummaryResponse(BaseModel):
    """Response schema for data summary endpoint."""
    
    total_records: int = Field(..., description="Total records in database")
    unique_households: int = Field(..., description="Number of unique households")
    countries: List[str] = Field(..., description="List of countries with data")
    date_range: Optional[DateRange] = Field(None, description="Overall date range")
    statistics: Optional[ConsumptionStatistics] = Field(None, description="Overall statistics")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "total_records": 16800,
                    "unique_households": 100,
                    "countries": ["DE"],
                    "date_range": {
                        "start": "2025-10-01T00:00:00Z",
                        "end": "2025-10-07T23:00:00Z",
                        "total_hours": 168
                    },
                    "statistics": {
                        "mean_consumption": 1.245,
                        "median_consumption": 1.156,
                        "std_deviation": 0.423,
                        "min_consumption": 0.102,
                        "max_consumption": 3.872,
                        "total_consumption": 20916.5
                    }
                }
            ]
        }
    }


class ConsumptionRecordResponse(BaseModel):
    """Response schema for individual consumption record."""
    
    id: int
    household_id: int
    timestamp: datetime
    consumption_kwh: float
    country: Optional[str] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "household_id": 0,
                    "timestamp": "2025-10-01T00:00:00Z",
                    "consumption_kwh": 1.245,
                    "country": "DE"
                }
            ]
        }
    }