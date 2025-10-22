import pulp
import pandas as pd
import numpy as np
from typing import Dict, Tuple
import logging
import time

logger = logging.getLogger(__name__)


class EnergyPriceOptimizer:
    """
    MILP optimizer for energy pricing.
    
    Optimizes pricing to balance multiple objectives:
    - Profit maximization (higher revenue)
    - Fairness maximization (lower price variance)
    
    Uses weighted objective function where weights can be adjusted.
    """
    
    def __init__(
        self,
        consumption_df: pd.DataFrame,
        cost_recovery_target: float,
        fairness_weight: float = 0.5,
        profit_weight: float = 0.5,
        min_price: float = 0.05,
        max_price: float = 0.50,
        solver_timeout: int = 30,
        mode: str = "regulated",  # NEW
        min_cost_recovery_pct: float = 100.0,  # NEW
        max_cost_recovery_pct: float = 150.0   # NEW
    ):
        """
        Initialize optimizer.
        
        Args:
            consumption_df: DataFrame with consumption data
            cost_recovery_target: Target revenue (100% benchmark)
            fairness_weight: Weight for fairness objective (0-1)
            profit_weight: Weight for profit objective (0-1)
            min_price: Minimum allowed price per kWh
            max_price: Maximum allowed price per kWh
            solver_timeout: Maximum solver time in seconds
            mode: 'regulated' (hard constraint) or 'market' (flexible)
            min_cost_recovery_pct: Minimum allowed recovery (e.g., 85%)
            max_cost_recovery_pct: Maximum allowed recovery (e.g., 120%)
        """
        self.consumption_df = consumption_df
        self.cost_recovery_target = cost_recovery_target
        self.fairness_weight = fairness_weight
        self.profit_weight = profit_weight
        self.min_price = min_price
        self.max_price = max_price
        self.solver_timeout = solver_timeout
        self.mode = mode
        self.min_cost_recovery_pct = min_cost_recovery_pct
        self.max_cost_recovery_pct = max_cost_recovery_pct
        
        # Calculate actual min/max revenue bounds
        self.min_revenue = cost_recovery_target * (min_cost_recovery_pct / 100.0)
        self.max_revenue = cost_recovery_target * (max_cost_recovery_pct / 100.0)
        
        # Validate weights
        if fairness_weight + profit_weight > 1.0:
            logger.warning(
                f"Weights sum to {fairness_weight + profit_weight} > 1.0. "
                "Normalizing weights."
            )
            total = fairness_weight + profit_weight
            self.fairness_weight = fairness_weight / total
            self.profit_weight = profit_weight / total
    
    def optimize(self) -> Tuple[pd.DataFrame, Dict]:
        """
        Run optimization and return optimal pricing.
        
        Returns:
            Tuple of (pricing_df, metrics_dict)
            - pricing_df: DataFrame with columns [timestamp, price_per_kwh]
            - metrics_dict: Dictionary with optimization metrics
        """
        start_time = time.time()
        
        logger.info("Starting MILP optimization...")
        logger.info(f"Mode: {self.mode}")
        logger.info(f"Fairness weight: {self.fairness_weight}, Profit weight: {self.profit_weight}")
        logger.info(f"Cost recovery range: {self.min_cost_recovery_pct}% - {self.max_cost_recovery_pct}%")
        
        # Get unique timestamps and aggregate consumption
        timestamps = sorted(self.consumption_df['timestamp'].unique())
        hourly_consumption = self.consumption_df.groupby('timestamp')['consumption_kwh'].sum()
        
        T = len(timestamps)
        logger.info(f"Optimizing prices for {T} time periods")
        
        # Create optimization problem
        prob = pulp.LpProblem("Energy_Price_Optimization", pulp.LpMaximize)
        
        # Decision variables: price at each timestamp
        prices = {
            t: pulp.LpVariable(
                f"price_{i}",
                lowBound=self.min_price,
                upBound=self.max_price,
                cat='Continuous'
            )
            for i, t in enumerate(timestamps)
        }
        
        # Calculate total consumption for each timestamp
        consumption = {t: hourly_consumption[t] for t in timestamps}
        
        # Auxiliary variable: mean price (for fairness calculation)
        mean_price = pulp.LpVariable("mean_price", cat='Continuous')
        
        # Constraint: mean_price = sum(prices) / T
        prob += (
            mean_price * T == pulp.lpSum([prices[t] for t in timestamps]),
            "Mean_Price_Definition"
        )
        
        # Calculate total revenue
        total_revenue = pulp.lpSum([prices[t] * consumption[t] for t in timestamps])
        
        # For fairness: minimize sum of absolute deviations from mean
        abs_deviations = {}
        for t in timestamps:
            pos_dev = pulp.LpVariable(f"pos_dev_{t}", lowBound=0, cat='Continuous')
            neg_dev = pulp.LpVariable(f"neg_dev_{t}", lowBound=0, cat='Continuous')
            
            # price[t] - mean_price = pos_dev - neg_dev
            prob += (
                prices[t] - mean_price == pos_dev - neg_dev,
                f"Deviation_Definition_{t}"
            )
            
            abs_deviations[t] = pos_dev + neg_dev
        
        # Total deviation (proxy for variance)
        total_deviation = pulp.lpSum([abs_deviations[t] for t in timestamps])
        
        # NEW: Cost recovery penalty/reward variables
        # These measure deviation from target in both directions
        revenue_shortfall = pulp.LpVariable("revenue_shortfall", lowBound=0, cat='Continuous')
        revenue_excess = pulp.LpVariable("revenue_excess", lowBound=0, cat='Continuous')
        
        # total_revenue - target = excess - shortfall
        prob += (
            total_revenue - self.cost_recovery_target == revenue_excess - revenue_shortfall,
            "Revenue_Deviation_Definition"
        )
        
        # Objective Function Components
        if self.fairness_weight == 1.0 and self.profit_weight == 0.0:
            # Pure fairness: minimize deviation
            prob += -total_deviation, "Pure_Fairness_Objective"
            logger.info("Using pure fairness objective")
        elif self.profit_weight == 1.0 and self.fairness_weight == 0.0:
            # Pure profit: maximize revenue (but penalize being too far from target)
            if self.mode == "market":
                # In market mode, also penalize being too far below or above target
                prob += total_revenue - 0.1 * revenue_shortfall - 0.01 * revenue_excess, "Pure_Profit_Objective"
            else:
                prob += total_revenue, "Pure_Profit_Objective"
            logger.info("Using pure profit objective")
        else:
            # Balanced: normalize and combine
            max_possible_revenue = self.max_price * sum(consumption.values())
            revenue_normalized = total_revenue / max_possible_revenue
            
            # Normalize deviation to [0, 1] scale (inverted - lower is better)
            max_possible_deviation = T * (self.max_price - self.min_price)
            fairness_normalized = 1.0 - (total_deviation / max_possible_deviation)
            
            # NEW: In market mode, penalize deviation from target
            if self.mode == "market":
                # Penalize both shortfall and excess (but shortfall more heavily)
                cost_recovery_penalty = 0.5 * revenue_shortfall / self.cost_recovery_target + \
                                       0.1 * revenue_excess / self.cost_recovery_target
                
                prob += (
                    self.profit_weight * revenue_normalized + 
                    self.fairness_weight * fairness_normalized -
                    cost_recovery_penalty,
                    "Weighted_Objective_With_Penalty"
                )
                logger.info("Using weighted objective with cost recovery penalty (market mode)")
            else:
                prob += (
                    self.profit_weight * revenue_normalized + 
                    self.fairness_weight * fairness_normalized,
                    "Weighted_Objective"
                )
                logger.info("Using weighted objective (regulated mode)")
        
        # Constraints: Cost recovery bounds
        if self.mode == "regulated":
            # Regulated mode: MUST meet minimum cost recovery (hard constraint)
            prob += (
                total_revenue >= self.min_revenue,
                "Cost_Recovery_Minimum"
            )
            logger.info(f"Hard constraint: Revenue >= €{self.min_revenue:.2f}")
        else:
            # Market mode: SOFT constraint via penalty (already in objective)
            # But still enforce absolute bounds
            prob += (
                total_revenue >= self.min_revenue,
                "Revenue_Lower_Bound"
            )
            prob += (
                total_revenue <= self.max_revenue,
                "Revenue_Upper_Bound"
            )
            logger.info(f"Soft bounds: €{self.min_revenue:.2f} <= Revenue <= €{self.max_revenue:.2f}")
        
        # Additional constraint: encourage price variation when fairness weight is low
        if self.fairness_weight < 0.5 and self.mode == "regulated":
            prob += (
                pulp.lpSum([prices[t] for t in timestamps]) <= 0.95 * self.max_price * T,
                "Encourage_Variation_Constraint"
            )
            logger.info("Added price variation constraint")
        
        # Solve the optimization problem
        logger.info("Solving optimization problem...")
        
        # Use CBC solver with timeout
        solver = pulp.PULP_CBC_CMD(
            msg=1,
            timeLimit=self.solver_timeout,
            gapRel=0.01
        )
        
        status = prob.solve(solver)
        
        solve_time = time.time() - start_time
        logger.info(f"Solver finished in {solve_time:.2f} seconds")
        logger.info(f"Solver status: {pulp.LpStatus[status]}")
        
        # Check if solution is optimal or feasible
        if status not in [pulp.LpStatusOptimal, pulp.LpStatusNotSolved]:
            if status == pulp.LpStatusInfeasible:
                raise ValueError(
                    "Optimization problem is infeasible. "
                    "Try relaxing constraints (adjust cost recovery range or price bounds)."
                )
            elif status == pulp.LpStatusUnbounded:
                raise ValueError("Optimization problem is unbounded.")
            else:
                logger.warning(f"Solver returned status: {pulp.LpStatus[status]}")
        
        # Extract optimal prices
        optimal_prices = {}
        for t in timestamps:
            price_value = prices[t].varValue
            if price_value is None:
                logger.warning(f"No solution found for timestamp {t}, using fallback")
                price_value = self.cost_recovery_target / sum(consumption.values())
            optimal_prices[t] = max(self.min_price, min(self.max_price, price_value))
        
        # DEBUG: Check price distribution
        optimal_prices_list = [optimal_prices[t] for t in timestamps]
        logger.info(f"Price stats: min={min(optimal_prices_list):.4f}, max={max(optimal_prices_list):.4f}, mean={np.mean(optimal_prices_list):.4f}, std={np.std(optimal_prices_list):.4f}")
        logger.info(f"Unique prices: {len(set([round(p, 6) for p in optimal_prices_list]))}")
        
        # Create pricing dataframe
        pricing_df = pd.DataFrame({
            'timestamp': timestamps,
            'price_per_kwh': [optimal_prices[t] for t in timestamps]
        })
        
        # Calculate actual metrics
        actual_revenue = sum(optimal_prices[t] * consumption[t] for t in timestamps)
        mean_price_value = pricing_df['price_per_kwh'].mean()
        price_std = pricing_df['price_per_kwh'].std()
        
        # Calculate shortfall/excess
        actual_shortfall = max(0, self.cost_recovery_target - actual_revenue)
        actual_excess = max(0, actual_revenue - self.cost_recovery_target)
        
        metrics = {
            'solver_status': pulp.LpStatus[status],
            'solver_runtime_seconds': round(solve_time, 2),
            'objective_value': round(float(pulp.value(prob.objective)), 4) if prob.objective else 0,
            'total_revenue': round(float(actual_revenue), 2),
            'mean_price': round(float(mean_price_value), 4),
            'price_std': round(float(price_std), 4),
            'price_min': round(float(pricing_df['price_per_kwh'].min()), 4),
            'price_max': round(float(pricing_df['price_per_kwh'].max()), 4),
            'fairness_weight_used': self.fairness_weight,
            'profit_weight_used': self.profit_weight,
            'mode': self.mode,
            'min_cost_recovery_pct': self.min_cost_recovery_pct,
            'max_cost_recovery_pct': self.max_cost_recovery_pct,
            'revenue_shortfall': round(float(actual_shortfall), 2),
            'revenue_excess': round(float(actual_excess), 2),
        }
        
        logger.info(f"Optimization completed: Revenue = €{actual_revenue:.2f}, Std = {price_std:.4f}")
        if actual_shortfall > 0:
            logger.warning(f"Revenue shortfall: €{actual_shortfall:.2f}")
        if actual_excess > 0:
            logger.info(f"Revenue excess: €{actual_excess:.2f}")
        
        return pricing_df, metrics


def run_simple_optimization(
    consumption_df: pd.DataFrame,
    cost_recovery_target: float,
    fairness_weight: float = 0.5,
    profit_weight: float = 0.5,
    **kwargs
) -> Tuple[pd.DataFrame, Dict]:
    """
    Convenience function to run optimization with default settings.
    
    Args:
        consumption_df: Consumption data
        cost_recovery_target: Target revenue
        fairness_weight: Weight for fairness (0-1)
        profit_weight: Weight for profit (0-1)
        **kwargs: Additional optimizer parameters
        
    Returns:
        Tuple of (pricing_df, metrics)
    """
    optimizer = EnergyPriceOptimizer(
        consumption_df=consumption_df,
        cost_recovery_target=cost_recovery_target,
        fairness_weight=fairness_weight,
        profit_weight=profit_weight,
        **kwargs
    )
    
    return optimizer.optimize()