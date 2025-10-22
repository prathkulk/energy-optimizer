"""
Optimization API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import numpy as np
import time
import logging
import json

from app.database import get_db
from app.models.consumption import ConsumptionRecord
from app.models.optimization import OptimizationResult
from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
    OptimizationPreset,
)
from app.schemas.strategy import PricePoint, HouseholdCost, FairnessMetrics
from app.services.optimizer import EnergyPriceOptimizer
from app.services.fairness import calculate_fairness_metrics, calculate_household_costs
from app.utils.exceptions import ValidationError, ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/optimization", tags=["Optimization"])


def convert_numpy_types(value):
    """Convert numpy types to native Python types for database storage."""
    if isinstance(value, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(value)
    elif isinstance(value, (np.floating, np.float64, np.float32, np.float16)):
        return float(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    elif isinstance(value, (list, tuple)):
        return [convert_numpy_types(v) for v in value]
    elif isinstance(value, dict):
        return {k: convert_numpy_types(v) for k, v in value.items()}
    return value


@router.get(
    "/presets",
    response_model=List[OptimizationPreset],
    status_code=status.HTTP_200_OK,
    summary="Get optimization presets",
    description="Get predefined optimization configurations"
)
async def get_optimization_presets() -> List[OptimizationPreset]:
    """
    Get predefined optimization presets.

    Returns:
        List of optimization presets
    """
    presets = [
        OptimizationPreset(
            name="Maximum Fairness",
            description="Prioritize equal costs across all households (Gini ≈ 0)",
            fairness_weight=1.0,
            profit_weight=0.0
        ),
        OptimizationPreset(
            name="Balanced",
            description="Equal balance between fairness and profitability",
            fairness_weight=0.5,
            profit_weight=0.5
        ),
        OptimizationPreset(
            name="Maximum Revenue",
            description="Prioritize revenue generation with minimal fairness constraint",
            fairness_weight=0.2,
            profit_weight=0.8
        ),
        OptimizationPreset(
            name="Fair with Revenue Focus",
            description="Good fairness while optimizing revenue",
            fairness_weight=0.6,
            profit_weight=0.4
        ),
        OptimizationPreset(
            name="Revenue with Fair Constraint",
            description="Revenue focus with fairness as constraint",
            fairness_weight=0.4,
            profit_weight=0.6
        ),
    ]

    return presets


@router.post(
    "/run",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Run MILP optimization",
    description="Run mixed-integer linear programming optimization to find optimal pricing"
)
async def run_optimization(
    request: OptimizationRequest,
    db: Session = Depends(get_db)
) -> OptimizationResponse:
    """
    Run MILP optimization.

    This endpoint:
    1. Loads consumption data from database
    2. Runs MILP optimization with PuLP
    3. Calculates fairness metrics
    4. Stores results in database
    5. Returns comprehensive results

    Args:
        request: Optimization parameters
        db: Database session (injected)

    Returns:
        OptimizationResponse with results and metrics

    Raises:
        HTTPException: If optimization fails or no data available
    """
    start_time = time.time()

    try:
        logger.info(
            f"Starting optimization: fairness={request.fairness_weight}, profit={request.profit_weight}")

        # Load consumption data from database
        query = db.query(ConsumptionRecord)

        if request.country:
            query = query.filter(
                ConsumptionRecord.country == request.country.upper())

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
            # Calculate a more reasonable target
            total_consumption = consumption_df['consumption_kwh'].sum()
            
            # Use a baseline price that's in the middle of the range
            baseline_price = (request.min_price + request.max_price) / 2
            cost_recovery_target = total_consumption * baseline_price
            
            logger.info(f"Calculated cost recovery target: €{cost_recovery_target:.2f}")
            logger.info(f"Total consumption: {total_consumption:.2f} kWh")
            logger.info(f"Baseline price: €{baseline_price:.4f}/kWh")

        # Run optimization
        logger.info("Running MILP optimization...")
        optimizer = EnergyPriceOptimizer(
            consumption_df=consumption_df,
            cost_recovery_target=cost_recovery_target,
            fairness_weight=request.fairness_weight,
            profit_weight=request.profit_weight,
            min_price=request.min_price,
            max_price=request.max_price,
            solver_timeout=request.solver_timeout
        )

        pricing_df, optimization_metrics = optimizer.optimize()

        # Calculate fairness metrics
        logger.info("Calculating fairness metrics...")
        fairness = calculate_fairness_metrics(consumption_df, pricing_df)

        # Calculate household costs
        household_costs_df = calculate_household_costs(
            consumption_df, pricing_df)

        # Calculate total consumption and revenue
        total_consumption = consumption_df['consumption_kwh'].sum()
        total_revenue = optimization_metrics['total_revenue']
        cost_recovery_percentage = (total_revenue / cost_recovery_target) * 100

        # Prepare price curve (limit to 1000 points) - ensure native Python types
        price_curve = [
            PricePoint(
                timestamp=row['timestamp'],
                price_per_kwh=round(float(row['price_per_kwh']), 4)
            )
            for _, row in pricing_df.head(1000).iterrows()
        ]

        # Prepare household costs (limit to 100) - ensure native Python types
        household_costs = [
            HouseholdCost(
                household_id=int(row['household_id']),
                total_cost=round(float(row['total_cost']), 2),
                total_consumption=round(float(row['total_consumption']), 2),
                avg_cost_per_kwh=round(float(row['avg_cost_per_kwh']), 4)
            )
            for _, row in household_costs_df.head(100).iterrows()
        ]

        # Store result in database - convert all numpy types to Python types
        optimization_result = OptimizationResult(
            fairness_weight=float(request.fairness_weight),
            profit_weight=float(request.profit_weight),
            cost_recovery_target=float(cost_recovery_target),
            min_price=float(request.min_price),
            max_price=float(request.max_price),
            solver_status=str(optimization_metrics['solver_status']),
            solver_runtime_seconds=float(
                optimization_metrics['solver_runtime_seconds']),
            objective_value=float(
                optimization_metrics.get('objective_value', 0.0)),
            total_revenue=float(total_revenue),
            cost_recovery_percentage=float(cost_recovery_percentage),
            avg_price_per_kwh=float(optimization_metrics['mean_price']),
            min_price_result=float(optimization_metrics['price_min']),
            max_price_result=float(optimization_metrics['price_max']),
            price_std=float(optimization_metrics['price_std']),
            gini_coefficient=float(fairness['gini_coefficient']),
            coefficient_of_variation=float(
                fairness['coefficient_of_variation']),
            country=request.country,
            result_data=json.dumps({
                'price_curve_sample': [
                    {
                        'timestamp': str(p.timestamp),
                        'price': float(p.price_per_kwh)
                    }
                    for p in price_curve[:100]
                ],
                'household_costs_sample': [
                    {
                        'household_id': int(h.household_id),
                        'total_cost': float(h.total_cost),
                        'avg_cost_per_kwh': float(h.avg_cost_per_kwh)
                    }
                    for h in household_costs[:20]
                ]
            })
        )

        db.add(optimization_result)
        db.commit()
        db.refresh(optimization_result)

        execution_time = time.time() - start_time
        logger.info(
            f"Optimization completed in {execution_time:.2f} seconds, result ID: {optimization_result.id}")

        return OptimizationResponse(
            id=optimization_result.id,
            fairness_weight=float(request.fairness_weight),
            profit_weight=float(request.profit_weight),
            solver_status=optimization_metrics['solver_status'],
            solver_runtime_seconds=float(
                optimization_metrics['solver_runtime_seconds']),
            objective_value=float(
                optimization_metrics.get('objective_value', 0.0)),
            total_revenue=float(total_revenue),
            cost_recovery_target=float(cost_recovery_target),
            cost_recovery_percentage=float(cost_recovery_percentage),
            total_consumption=float(total_consumption),
            avg_price_per_kwh=float(optimization_metrics['mean_price']),
            fairness_metrics=FairnessMetrics(**fairness),
            price_curve=price_curve,
            household_costs=household_costs,
            optimization_details={
                'mean_price': float(optimization_metrics['mean_price']),
                'price_std': float(optimization_metrics['price_std']),
                'price_min': float(optimization_metrics['price_min']),
                'price_max': float(optimization_metrics['price_max']),
                'fairness_weight_used': float(optimization_metrics['fairness_weight_used']),
                'profit_weight_used': float(optimization_metrics['profit_weight_used']),
            },
            created_at=optimization_result.created_at
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
    except ValueError as e:
        logger.error(f"Optimization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "OPTIMIZATION_ERROR",
                "message": str(e),
                "details": {}
            }
        )
    except Exception as e:
        logger.exception(f"Unexpected error during optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Failed to run optimization",
                "details": {"error": str(e)}
            }
        )


@router.get(
    "/results/{result_id}",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get optimization result",
    description="Retrieve a previously saved optimization result by ID"
)
async def get_optimization_result(
    result_id: int,
    db: Session = Depends(get_db)
) -> OptimizationResponse:
    """
    Get optimization result by ID.

    Args:
        result_id: ID of the optimization result
        db: Database session (injected)

    Returns:
        OptimizationResponse

    Raises:
        HTTPException: If result not found
    """
    result = db.query(OptimizationResult).filter(
        OptimizationResult.id == result_id).first()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "RESULT_NOT_FOUND",
                "message": f"Optimization result with ID {result_id} not found",
                "details": {"result_id": result_id}
            }
        )

    # Parse stored JSON data
    result_data = json.loads(result.result_data) if result.result_data else {}

    # Reconstruct price curve from stored sample
    price_curve = [
        PricePoint(
            timestamp=p['timestamp'],
            price_per_kwh=p['price']
        )
        for p in result_data.get('price_curve_sample', [])
    ]

    # Reconstruct household costs from stored sample
    household_costs = [
        HouseholdCost(
            household_id=h['household_id'],
            total_cost=h['total_cost'],
            total_consumption=0.0,  # Not stored in sample
            avg_cost_per_kwh=h['avg_cost_per_kwh']
        )
        for h in result_data.get('household_costs_sample', [])
    ]

    return OptimizationResponse(
        id=result.id,
        fairness_weight=result.fairness_weight,
        profit_weight=result.profit_weight,
        solver_status=result.solver_status,
        solver_runtime_seconds=result.solver_runtime_seconds,
        objective_value=result.objective_value or 0.0,
        total_revenue=result.total_revenue,
        cost_recovery_target=result.cost_recovery_target,
        cost_recovery_percentage=result.cost_recovery_percentage,
        total_consumption=0.0,  # Not stored separately
        avg_price_per_kwh=result.avg_price_per_kwh,
        fairness_metrics=FairnessMetrics(
            gini_coefficient=result.gini_coefficient,
            coefficient_of_variation=result.coefficient_of_variation,
            min_cost_per_kwh=result.min_price_result,
            max_cost_per_kwh=result.max_price_result,
            mean_cost_per_kwh=result.avg_price_per_kwh,
            median_cost_per_kwh=result.avg_price_per_kwh,  # Approximation
            std_cost_per_kwh=result.price_std
        ),
        price_curve=price_curve,
        household_costs=household_costs,
        optimization_details={
            'mean_price': result.avg_price_per_kwh,
            'price_std': result.price_std,
            'price_min': result.min_price_result,
            'price_max': result.max_price_result,
            'fairness_weight_used': result.fairness_weight,
            'profit_weight_used': result.profit_weight,
        },
        created_at=result.created_at
    )
