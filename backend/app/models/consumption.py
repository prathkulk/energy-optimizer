"""
Database model for energy consumption records.
"""

from sqlalchemy import Column, Integer, Float, DateTime, String, Index
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class ConsumptionRecord(Base):
    """
    Stores household-level energy consumption data.
    
    Each record represents the energy consumption of a specific household
    at a specific timestamp.
    """
    
    __tablename__ = "consumption_records"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign key to household (not enforced, just a logical reference)
    household_id = Column(Integer, nullable=False, index=True)
    
    # Timestamp of the consumption measurement
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Consumption in kilowatt-hours
    consumption_kwh = Column(Float, nullable=False)
    
    # Country code (2-letter ISO code)
    country = Column(String(2), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('ix_consumption_household_timestamp', 'household_id', 'timestamp'),
        Index('ix_consumption_timestamp_country', 'timestamp', 'country'),
    )
    
    def __repr__(self) -> str:
        return (
            f"<ConsumptionRecord(id={self.id}, household={self.household_id}, "
            f"timestamp={self.timestamp}, consumption={self.consumption_kwh} kWh)>"
        )