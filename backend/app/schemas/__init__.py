"""
Pydantic schemas package for request/response validation.
"""

from app.schemas.data import (
    DataIngestionRequest,
    DataIngestionResponse,
    DataSummaryResponse,
    ConsumptionStatistics,
    ConsumptionRecordResponse,
)
from app.schemas.common import (
    ErrorResponse,
    HealthCheckResponse,
)
from app.schemas.strategy import (
    StrategyType,
    StrategyInfo,
    TOUParameters,
    DynamicParameters,
    StrategyExecutionRequest,
    StrategyExecutionResponse,
    PricePoint,
    HouseholdCost,
    FairnessMetrics,
)

__all__ = [
    "DataIngestionRequest",
    "DataIngestionResponse",
    "DataSummaryResponse",
    "ConsumptionStatistics",
    "ConsumptionRecordResponse",
    "ErrorResponse",
    "HealthCheckResponse",
    "StrategyType",
    "StrategyInfo",
    "TOUParameters",
    "DynamicParameters",
    "StrategyExecutionRequest",
    "StrategyExecutionResponse",
    "PricePoint",
    "HouseholdCost",
    "FairnessMetrics",
    "OptimizationRequest",
    "OptimizationResponse",
    "OptimizationPreset",
    "OptimizationMode"
]