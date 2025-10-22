"""
Data ingestion API endpoints.
Handles fetching data from ENTSO-E and storing in database.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import pandas as pd
import time
import logging
from datetime import timezone

from app.database import get_db
from app.models.consumption import ConsumptionRecord
from app.schemas.data import (
    DataIngestionRequest,
    DataIngestionResponse,
    DataSummaryResponse,
    ConsumptionStatistics,
    DateRange
)
from app.utils.data_ingestion import DataIngestionPipeline
from app.utils.exceptions import DataIngestionError, ValidationError
from app.utils.validators import validate_date_range, validate_num_households
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["Data Ingestion"])

@router.post(
    "/ingest",
    response_model=DataIngestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest energy consumption data",
    description="Fetch energy consumption data from ENTSO-E API and store in database"
)
async def ingest_data(
    request: DataIngestionRequest,
    db: Session = Depends(get_db)
) -> DataIngestionResponse:
    
    start_time = time.time()

    try:
        # Validate inputs
        logger.info(f"Starting data ingestion for {request.country_code}")
        start_date, end_date = validate_date_range(request.start_date, request.end_date)
        validate_num_households(request.num_households)
        
        # Initialize pipeline
        pipeline = DataIngestionPipeline()
        
        # Convert timezone-aware datetimes to naive for ENTSO-E client
        # IMPORTANT: Round to hour boundaries (ENTSO-E requirement)
        start_date_naive = start_date.replace(tzinfo=None, minute=0, second=0, microsecond=0) if start_date.tzinfo else start_date.replace(minute=0, second=0, microsecond=0)
        end_date_naive = end_date.replace(tzinfo=None, minute=0, second=0, microsecond=0) if end_date.tzinfo else end_date.replace(minute=0, second=0, microsecond=0)
        
        # Fetch data directly using the client instead of fetch_and_process
        # This gives us more control over the date range
        logger.info(f"Fetching data for {request.country_code} from {start_date_naive} to {end_date_naive}")
        
        # Fetch country-level load data
        load_df = pipeline.client.fetch_actual_load(
            request.country_code.value,
            start_date_naive,
            end_date_naive
        )
        
        # Convert to household-level consumption
        from app.utils.entsoe_client import convert_to_household_consumption
        household_df = convert_to_household_consumption(load_df, request.num_households)
        
        # Convert DataFrame timestamps to timezone-naive UTC for consistency with database
        # This prevents timezone comparison issues
        if pd.api.types.is_datetime64tz_dtype(household_df['timestamp']):
            household_df['timestamp'] = household_df['timestamp'].dt.tz_localize(None)
        
        # Filter to exact date range (both are now naive)
        household_df = household_df[
            (household_df['timestamp'] >= start_date_naive) &
            (household_df['timestamp'] <= end_date_naive)
        ]
        
        # Add country column
        household_df['country'] = request.country_code.value
        
        # Store in database
        logger.info(f"Storing {len(household_df)} records in database")
        _store_consumption_data(db, household_df)
        
        # Calculate statistics
        stats = _calculate_statistics(household_df)
        
        # Calculate date range info
        min_timestamp = household_df['timestamp'].min()
        max_timestamp = household_df['timestamp'].max()
        
        # Calculate actual duration in hours (not number of timestamps)
        duration = max_timestamp - min_timestamp  
        total_hours = int(duration.total_seconds() / 3600)
        
        date_range = DateRange(
            start=min_timestamp,
            end=max_timestamp,
            total_hours=total_hours  # This is actual duration, not count of timestamps
        )
        
        ingestion_time = time.time() - start_time
        
        logger.info(f"Data ingestion completed in {ingestion_time:.2f} seconds")
        
        return DataIngestionResponse(
            status="success",
            message=f"Successfully ingested {len(household_df)} records",
            total_records=len(household_df),
            unique_households=request.num_households,
            country=request.country_code.value,
            date_range=date_range,
            statistics=stats,
            ingestion_time_seconds=round(ingestion_time, 2)
        )
        
    except ValidationError as e:
        logger.error(f"Validation error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": e.error_code,
                "message": e.message,
                "details": e.details
            }
        )
    except DataIngestionError as e:
        logger.error(f"Data ingestion error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": e.error_code,
                "message": e.message,
                "details": e.details
            }
        )
    except Exception as e:
        logger.exception(f"Unexpected error during data ingestion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred during data ingestion",
                "details": {"error": str(e)}
            }
        )

@router.get(
    "/summary",
    response_model=DataSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get data summary",
    description="Get summary statistics of currently stored consumption data"
)
async def get_data_summary(
    country: Optional[str] = None,
    db: Session = Depends(get_db)
) -> DataSummaryResponse:
    """
    Get summary of stored consumption data.
    
    Args:
        country: Optional country filter (2-letter code)
        db: Database session (injected)
        
    Returns:
        DataSummaryResponse with summary statistics
        
    Raises:
        HTTPException: If no data found
    """
    try:
        # Build query
        query = db.query(ConsumptionRecord)
        
        if country:
            country = country.upper()
            query = query.filter(ConsumptionRecord.country == country)
        
        # Get total records
        total_records = query.count()
        
        if total_records == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error_code": "NO_DATA",
                    "message": "No consumption data found in database",
                    "details": {"country_filter": country}
                }
            )
        
        # Get unique households
        unique_households = db.query(
            func.count(func.distinct(ConsumptionRecord.household_id))
        ).filter(
            ConsumptionRecord.country == country if country else True
        ).scalar()
        
        # Get countries
        countries_query = db.query(
            func.distinct(ConsumptionRecord.country)
        ).filter(
            ConsumptionRecord.country.isnot(None)
        )
        countries = [c[0] for c in countries_query.all()]
        
        # Get date range
        date_stats = db.query(
            func.min(ConsumptionRecord.timestamp).label('min_date'),
            func.max(ConsumptionRecord.timestamp).label('max_date'),
            func.count(func.distinct(ConsumptionRecord.timestamp)).label('unique_hours')
        ).filter(
            ConsumptionRecord.country == country if country else True
        ).first()
        
        date_range = None
        if date_stats.min_date and date_stats.max_date:
            date_range = DateRange(
                start=date_stats.min_date,
                end=date_stats.max_date,
                total_hours=date_stats.unique_hours
            )
        
        # Get consumption statistics
        consumption_stats = db.query(
            func.avg(ConsumptionRecord.consumption_kwh).label('mean'),
            func.percentile_cont(0.5).within_group(
                ConsumptionRecord.consumption_kwh
            ).label('median'),
            func.stddev(ConsumptionRecord.consumption_kwh).label('std'),
            func.min(ConsumptionRecord.consumption_kwh).label('min'),
            func.max(ConsumptionRecord.consumption_kwh).label('max'),
            func.sum(ConsumptionRecord.consumption_kwh).label('total')
        ).filter(
            ConsumptionRecord.country == country if country else True
        ).first()
        
        statistics = None
        if consumption_stats.mean is not None:
            statistics = ConsumptionStatistics(
                mean_consumption=round(float(consumption_stats.mean), 3),
                median_consumption=round(float(consumption_stats.median), 3),
                std_deviation=round(float(consumption_stats.std or 0), 3),
                min_consumption=round(float(consumption_stats.min), 3),
                max_consumption=round(float(consumption_stats.max), 3),
                total_consumption=round(float(consumption_stats.total), 3)
            )
        
        return DataSummaryResponse(
            total_records=total_records,
            unique_households=unique_households,
            countries=countries,
            date_range=date_range,
            statistics=statistics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting data summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Failed to retrieve data summary",
                "details": {"error": str(e)}
            }
        )

@router.delete(
    "/clear",
    status_code=status.HTTP_200_OK,
    summary="Clear all consumption data",
    description="Delete all consumption records from database (use with caution)"
)
async def clear_data(
    country: Optional[str] = None,
    db: Session = Depends(get_db)
) -> dict:
    """
    Clear consumption data from database.
    
    This is primarily for development/testing purposes.
    Can optionally filter by country.
    
    Args:
        country: Optional country filter (deletes only data for this country)
        db: Database session (injected)
        
    Returns:
        Dictionary with deletion results
        
    Raises:
        HTTPException: If deletion fails
    """
    try:
        query = db.query(ConsumptionRecord)
        
        if country:
            country = country.upper()
            query = query.filter(ConsumptionRecord.country == country)
        
        # Count records before deletion
        records_to_delete = query.count()
        
        if records_to_delete == 0:
            return {
                "status": "success",
                "message": "No records to delete",
                "records_deleted": 0
            }
        
        # Delete records
        query.delete(synchronize_session=False)
        db.commit()
        
        logger.info(f"Deleted {records_to_delete} consumption records")
        
        return {
            "status": "success",
            "message": f"Successfully deleted {records_to_delete} records",
            "records_deleted": records_to_delete,
            "country_filter": country
        }
        
    except Exception as e:
        db.rollback()
        logger.exception(f"Error clearing data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "DELETE_ERROR",
                "message": "Failed to clear consumption data",
                "details": {"error": str(e)}
            }
        )


def _store_consumption_data(db: Session, df: pd.DataFrame) -> None:
    """
    Store consumption data from DataFrame to database.
    
    Args:
        db: Database session
        df: DataFrame with consumption data
        
    Raises:
        DataIngestionError: If storage fails
    """
    try:
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        # Bulk insert using SQLAlchemy core for better performance
        db.bulk_insert_mappings(ConsumptionRecord, records)
        db.commit()
        
        logger.info(f"Successfully stored {len(records)} records")
        
    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to store consumption data: {str(e)}")
        raise DataIngestionError(
            "Failed to store consumption data in database",
            {"error": str(e), "records_count": len(df)}
        )


def _calculate_statistics(df: pd.DataFrame) -> ConsumptionStatistics:
    """
    Calculate statistics from consumption DataFrame.
    
    Args:
        df: DataFrame with consumption data
        
    Returns:
        ConsumptionStatistics object
    """
    return ConsumptionStatistics(
        mean_consumption=round(float(df['consumption_kwh'].mean()), 3),
        median_consumption=round(float(df['consumption_kwh'].median()), 3),
        std_deviation=round(float(df['consumption_kwh'].std()), 3),
        min_consumption=round(float(df['consumption_kwh'].min()), 3),
        max_consumption=round(float(df['consumption_kwh'].max()), 3),
        total_consumption=round(float(df['consumption_kwh'].sum()), 3)
    )