from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

from app.schemas.strategy import (
    PricePoint,
    HouseholdCost,
    FairnessMetrics
)


class OptimizationRequest(BaseModel):
    
    fairness_weight: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Weight for fairness objective (0-1)"
    )
    profit_weight: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Weight for profit objective (0-1)"
    )
    cost_recovery_target: Optional[float] = Field(
        None,
        description="Target revenue (calculated from data if not provided)"
    )
    min_price: float = Field(
        default=0.05,
        ge=0.01,
        le=1.0,
        description="Minimum price per kWh"
    )
    max_price: float = Field(
        default=0.50,
        ge=0.01,
        le=2.0,
        description="Maximum price per kWh"
    )
    solver_timeout: int = Field(
        default=30,
        ge=5,
        le=300,
        description="Maximum solver time in seconds"
    )
    country: Optional[str] = Field(
        None,
        description="Filter data by country code"
    )
    
    @field_validator('profit_weight')
    @classmethod
    def validate_weights_sum(cls, profit_weight: float, info) -> float:
        """Validate that weights sum to at most 1.0."""
        fairness_weight = info.data.get('fairness_weight', 0.5)
        if fairness_weight + profit_weight > 1.0:
            raise ValueError(
                f"Sum of weights ({fairness_weight + profit_weight}) cannot exceed 1.0"
            )
        return profit_weight
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "fairness_weight": 0.6,
                    "profit_weight": 0.4,
                    "cost_recovery_target": 50000.0,
                    "min_price": 0.05,
                    "max_price": 0.50,
                    "solver_timeout": 30
                }
            ]
        }
    }


class OptimizationResponse(BaseModel):
    id: int = Field(..., description="Result ID for later retrieval")
    fairness_weight: float
    profit_weight: float
    solver_status: str = Field(..., description="Solver status (Optimal, Feasible, etc.)")
    solver_runtime_seconds: float
    objective_value: float = Field(..., description="Value of objective function")
    total_revenue: float
    cost_recovery_target: float
    cost_recovery_percentage: float
    total_consumption: float
    avg_price_per_kwh: float
    fairness_metrics: FairnessMetrics
    price_curve: list[PricePoint]
    household_costs: list[HouseholdCost]
    optimization_details: Dict[str, Any] = Field(
        ...,
        description="Additional optimization details (mean price, std, etc.)"
    )
    created_at: datetime
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "fairness_weight": 0.6,
                    "profit_weight": 0.4,
                    "solver_status": "Optimal",
                    "solver_runtime_seconds": 2.34,
                    "objective_value": 0.8523,
                    "total_revenue": 50234.56,
                    "cost_recovery_target": 50000.0,
                    "cost_recovery_percentage": 100.47,
                    "total_consumption": 20916.5,
                    "avg_price_per_kwh": 0.2401,
                    "fairness_metrics": {},
                    "price_curve": [],
                    "household_costs": [],
                    "optimization_details": {},
                    "created_at": "2025-10-17T12:00:00Z"
                }
            ]
        }
    }


class OptimizationPreset(BaseModel):
    """Predefined optimization preset."""
    
    name: str
    description: str
    fairness_weight: float
    profit_weight: float
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Maximum Fairness",
                    "description": "Prioritize equal costs across all households",
                    "fairness_weight": 1.0,
                    "profit_weight": 0.0
                }
            ]
        }
    }