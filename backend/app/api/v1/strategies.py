"""
Pricing strategies API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import time
import logging

from app.database import get_db
from app.models.consumption import ConsumptionRecord
from app.schemas.strategy import (
    StrategyInfo,
    StrategyType,
    StrategyExecutionRequest,
    StrategyExecutionResponse,
    PricePoint,
    HouseholdCost,
    FairnessMetrics,
)
from app.services.pricing_strategies import get_strategy
from app.services.fairness import calculate_fairness_metrics, calculate_household_costs
from app.utils.exceptions import ValidationError, ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/strategies", tags=["Pricing Strategies"])


@router.get(
    "",
    response_model=List[StrategyInfo],
    status_code=status.HTTP_200_OK,
    summary="List all pricing strategies",
    description="Get information about all available pricing strategies"
)
async def list_strategies() -> List[StrategyInfo]:
    strategies = [
        StrategyInfo(
            strategy_type=StrategyType.FLAT,
            name="Flat Rate",
            description="Constant price for all hours. Simplest approach, easy for consumers to understand."
        ),
        StrategyInfo(
            strategy_type=StrategyType.TOU,
            name="Time-of-Use",
            description="Different prices for peak and off-peak hours. Encourages consumers to shift load to off-peak times."
        ),
        StrategyInfo(
            strategy_type=StrategyType.DYNAMIC,
            name="Dynamic Tariff",
            description="Price varies with system load in real-time. High demand = high price, incentivizing load reduction during peak periods."
        ),
    ]
    
    return strategies


@router.post(
    "/execute",
    response_model=StrategyExecutionResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute a pricing strategy",
    description="Run a pricing strategy on stored consumption data and return results with fairness metrics"
)
async def execute_strategy(
    request: StrategyExecutionRequest,
    db: Session = Depends(get_db)
) -> StrategyExecutionResponse:
    start_time = time.time()
    
    try:
        logger.info(f"Executing {request.strategy_type} pricing strategy")
        
        # Load consumption data from database
        query = db.query(ConsumptionRecord)
        
        if request.country:
            query = query.filter(ConsumptionRecord.country == request.country.upper())
        
        records = query.all()
        
        if not records:
            raise ResourceNotFoundError(
                "No consumption data found in database",
                {"country_filter": request.country}
            )
        
        # Convert to DataFrame
        consumption_df = pd.DataFrame([
            {
                'household_id': r.household_id,
                'timestamp': r.timestamp,
                'consumption_kwh': r.consumption_kwh
            }
            for r in records
        ])
        
        logger.info(f"Loaded {len(consumption_df)} consumption records")
        
        # Calculate cost recovery target if not provided
        cost_recovery_target = request.cost_recovery_target
        if cost_recovery_target is None:
            # Default: assume €0.25/kWh as baseline
            cost_recovery_target = consumption_df['consumption_kwh'].sum() * 0.25
            logger.info(f"Calculated cost recovery target: €{cost_recovery_target:.2f}")
        
        # Get strategy instance
        strategy = get_strategy(request.strategy_type.value)
        
        # Prepare strategy parameters
        strategy_params = {}
        if request.strategy_type == StrategyType.TOU and request.tou_params:
            strategy_params = {
                'peak_hours': request.tou_params.peak_hours,
                'peak_multiplier': request.tou_params.peak_multiplier,
                'offpeak_multiplier': request.tou_params.offpeak_multiplier,
            }
        elif request.strategy_type == StrategyType.DYNAMIC and request.dynamic_params:
            strategy_params = {
                'min_multiplier': request.dynamic_params.min_multiplier,
                'max_multiplier': request.dynamic_params.max_multiplier,
            }
        
        # Calculate prices
        logger.info("Calculating prices...")
        pricing_df = strategy.calculate_prices(
            consumption_df,
            cost_recovery_target,
            **strategy_params
        )
        
        # Validate cost recovery
        cost_recovery = strategy.validate_cost_recovery(
            consumption_df,
            pricing_df,
            cost_recovery_target
        )
        
        # Calculate fairness metrics
        logger.info("Calculating fairness metrics...")
        fairness = calculate_fairness_metrics(consumption_df, pricing_df)
        
        # Calculate household costs
        household_costs_df = calculate_household_costs(consumption_df, pricing_df)
        
        # Prepare price curve (limit to avoid huge responses)
        price_curve = [
            PricePoint(
                timestamp=row['timestamp'],
                price_per_kwh=round(row['price_per_kwh'], 4)
            )
            for _, row in pricing_df.head(1000).iterrows()  # Limit to 1000 points
        ]
        
        # Prepare household costs (limit to avoid huge responses)
        household_costs = [
            HouseholdCost(
                household_id=int(row['household_id']),
                total_cost=round(row['total_cost'], 2),
                total_consumption=round(row['total_consumption'], 2),
                avg_cost_per_kwh=round(row['avg_cost_per_kwh'], 4)
            )
            for _, row in household_costs_df.head(100).iterrows()  # Limit to 100 households
        ]
        
        execution_time = time.time() - start_time
        logger.info(f"Strategy execution completed in {execution_time:.2f} seconds")
        
        return StrategyExecutionResponse(
            strategy_type=request.strategy_type,
            strategy_name=strategy.name,
            total_revenue=cost_recovery['total_revenue'],
            cost_recovery_target=cost_recovery['cost_recovery_target'],
            cost_recovery_percentage=cost_recovery['cost_recovery_percentage'],
            total_consumption=cost_recovery['total_consumption'],
            avg_price_per_kwh=cost_recovery['avg_price_per_kwh'],
            fairness_metrics=FairnessMetrics(**fairness),
            price_curve=price_curve,
            household_costs=household_costs,
            execution_time_seconds=round(execution_time, 2)
        )
        
    except ResourceNotFoundError as e:
        logger.error(f"Resource not found: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": e.error_code,
                "message": e.message,
                "details": e.details
            }
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
    except Exception as e:
        logger.exception(f"Error executing strategy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "STRATEGY_EXECUTION_ERROR",
                "message": "Failed to execute pricing strategy",
                "details": {"error": str(e)}
            }
        )