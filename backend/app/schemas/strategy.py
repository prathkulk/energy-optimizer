from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


class StrategyType(str, Enum):
    FLAT = "flat"
    TOU = "tou"
    DYNAMIC = "dynamic"


class StrategyInfo(BaseModel):
    
    strategy_type: StrategyType = Field(..., description="Type of pricing strategy")
    name: str = Field(..., description="Display name of strategy")
    description: str = Field(..., description="Description of how the strategy works")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "strategy_type": "flat",
                    "name": "Flat Rate",
                    "description": "Constant price for all hours"
                }
            ]
        }
    }


class TOUParameters(BaseModel):
    
    peak_hours: List[int] = Field(
        default=[7, 8, 17, 18, 19, 20, 21],
        description="List of peak hours (0-23)"
    )
    peak_multiplier: float = Field(
        default=1.5,
        ge=1.0,
        le=3.0,
        description="Price multiplier for peak hours"
    )
    offpeak_multiplier: float = Field(
        default=0.7,
        ge=0.3,
        le=1.0,
        description="Price multiplier for off-peak hours"
    )


class DynamicParameters(BaseModel):
    
    min_multiplier: float = Field(
        default=0.5,
        ge=0.1,
        le=1.0,
        description="Minimum price multiplier (at lowest load)"
    )
    max_multiplier: float = Field(
        default=2.0,
        ge=1.0,
        le=5.0,
        description="Maximum price multiplier (at highest load)"
    )


class StrategyExecutionRequest(BaseModel):
    
    strategy_type: StrategyType = Field(..., description="Type of strategy to execute")
    cost_recovery_target: Optional[float] = Field(
        None,
        description="Target revenue (calculated from data if not provided)"
    )
    country: Optional[str] = Field(
        None,
        description="Filter data by country code"
    )
    tou_params: Optional[TOUParameters] = Field(
        None,
        description="Parameters for Time-of-Use strategy"
    )
    dynamic_params: Optional[DynamicParameters] = Field(
        None,
        description="Parameters for Dynamic Tariff strategy"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "strategy_type": "tou",
                    "cost_recovery_target": 50000.0,
                    "tou_params": {
                        "peak_hours": [7, 8, 17, 18, 19, 20],
                        "peak_multiplier": 1.6,
                        "offpeak_multiplier": 0.8
                    }
                }
            ]
        }
    }


class PricePoint(BaseModel):
    
    timestamp: datetime = Field(..., description="Timestamp")
    price_per_kwh: float = Field(..., description="Price in EUR/kWh")


class HouseholdCost(BaseModel):
    
    household_id: int
    total_cost: float
    total_consumption: float
    avg_cost_per_kwh: float


class FairnessMetrics(BaseModel):
    gini_coefficient: float = Field(..., description="Gini coefficient (0-1, lower is fairer)")
    coefficient_of_variation: float = Field(..., description="Coefficient of variation")
    min_cost_per_kwh: float
    max_cost_per_kwh: float
    mean_cost_per_kwh: float
    median_cost_per_kwh: float
    std_cost_per_kwh: float


class StrategyExecutionResponse(BaseModel):
    strategy_type: StrategyType
    strategy_name: str
    total_revenue: float = Field(..., description="Total revenue generated")
    cost_recovery_target: float = Field(..., description="Target revenue")
    cost_recovery_percentage: float = Field(..., description="Percentage of target achieved")
    total_consumption: float = Field(..., description="Total consumption in kWh")
    avg_price_per_kwh: float = Field(..., description="Average price per kWh")
    fairness_metrics: FairnessMetrics
    price_curve: List[PricePoint] = Field(..., description="Price at each timestamp")
    household_costs: List[HouseholdCost] = Field(..., description="Cost breakdown per household")
    execution_time_seconds: float
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "strategy_type": "flat",
                    "strategy_name": "Flat Rate",
                    "total_revenue": 50123.45,
                    "cost_recovery_target": 50000.00,
                    "cost_recovery_percentage": 100.25,
                    "total_consumption": 20916.5,
                    "avg_price_per_kwh": 0.2397,
                    "fairness_metrics": {
                        "gini_coefficient": 0.0012,
                        "coefficient_of_variation": 0.0034,
                        "min_cost_per_kwh": 0.2395,
                        "max_cost_per_kwh": 0.2398,
                        "mean_cost_per_kwh": 0.2397,
                        "median_cost_per_kwh": 0.2397,
                        "std_cost_per_kwh": 0.0001
                    },
                    "price_curve": [],
                    "household_costs": [],
                    "execution_time_seconds": 0.52
                }
            ]
        }
    }