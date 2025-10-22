from sqlalchemy import Column, Integer, Float, DateTime, String, Text
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base


class OptimizationResult(Base):

    __tablename__ = "optimization_results"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Optimization parameters
    fairness_weight = Column(Float, nullable=False)
    profit_weight = Column(Float, nullable=False)
    cost_recovery_target = Column(Float, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    
    # Results
    solver_status = Column(String(50), nullable=False)
    solver_runtime_seconds = Column(Float, nullable=False)
    objective_value = Column(Float, nullable=True)
    total_revenue = Column(Float, nullable=False)
    cost_recovery_percentage = Column(Float, nullable=False)
    
    # Pricing metrics
    avg_price_per_kwh = Column(Float, nullable=False)
    min_price_result = Column(Float, nullable=False)
    max_price_result = Column(Float, nullable=False)
    price_std = Column(Float, nullable=False)
    
    # Fairness metrics
    gini_coefficient = Column(Float, nullable=False)
    coefficient_of_variation = Column(Float, nullable=False)
    
    # Detailed results (JSON stored as text)
    result_data = Column(Text, nullable=True)  # JSON string
    
    # Metadata
    country = Column(String(2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self) -> str:
        return (
            f"<OptimizationResult(id={self.id}, fairness={self.fairness_weight}, "
            f"profit={self.profit_weight}, revenue={self.total_revenue})>"
        )