import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

def calculate_gini_coefficient(values: np.ndarray) -> float:
    if len(values) == 0:
        return 0.0
    
    # Remove any NaN or infinite values
    values = values[np.isfinite(values)]
    
    if len(values) == 0:
        return 0.0
    
    # Check if all values are the same (perfect equality)
    if np.std(values) == 0:
        return 0.0  # Perfect equality
    
    # Sort values
    sorted_values = np.sort(values)
    n = len(values)
    
    # Calculate cumulative sum
    cumsum = np.cumsum(sorted_values)
    
    # Gini formula: (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
    if cumsum[-1] == 0:  # All values are zero
        return 0.0
    
    gini = (2 * np.sum((np.arange(1, n + 1)) * sorted_values)) / (n * cumsum[-1]) - (n + 1) / n
    
    return max(0.0, min(1.0, gini))  # Clamp to [0, 1]

def calculate_coefficient_of_variation(values: np.ndarray) -> float:
    if len(values) == 0:
        return 0.0
    
    # Remove any NaN or infinite values
    values = values[np.isfinite(values)]
    
    if len(values) == 0:
        return 0.0
    
    mean = np.mean(values)
    if mean == 0:
        return 0.0
    
    std = np.std(values)
    return std / mean


def calculate_household_costs(
    consumption_df: pd.DataFrame,
    pricing_df: pd.DataFrame
) -> pd.DataFrame:
    # Merge consumption with pricing on timestamp
    merged = consumption_df.merge(pricing_df, on='timestamp', how='inner')
    
    # Calculate cost for each record
    merged['cost'] = merged['consumption_kwh'] * merged['price_per_kwh']
    
    # Aggregate by household
    household_costs = merged.groupby('household_id').agg({
        'cost': 'sum',
        'consumption_kwh': 'sum'
    }).reset_index()
    
    household_costs.columns = ['household_id', 'total_cost', 'total_consumption']
    
    # Calculate average cost per kWh for each household
    household_costs['avg_cost_per_kwh'] = (
        household_costs['total_cost'] / household_costs['total_consumption']
    )
    
    return household_costs


def calculate_fairness_metrics(
    consumption_df: pd.DataFrame,
    pricing_df: pd.DataFrame
) -> Dict[str, float]:
    household_costs = calculate_household_costs(consumption_df, pricing_df)
    
    # Cost per kWh for each household
    cost_per_kwh = household_costs['avg_cost_per_kwh'].values
    
    # Calculate metrics
    gini = calculate_gini_coefficient(cost_per_kwh)
    cv = calculate_coefficient_of_variation(cost_per_kwh)
    
    return {
        'gini_coefficient': round(float(gini), 4),
        'coefficient_of_variation': round(float(cv), 4),
        'min_cost_per_kwh': round(float(cost_per_kwh.min()), 4),
        'max_cost_per_kwh': round(float(cost_per_kwh.max()), 4),
        'mean_cost_per_kwh': round(float(cost_per_kwh.mean()), 4),
        'median_cost_per_kwh': round(float(np.median(cost_per_kwh)), 4),
        'std_cost_per_kwh': round(float(cost_per_kwh.std()), 4),
    }


def identify_outlier_households(
    household_costs_df: pd.DataFrame,
    top_n: int = 5
) -> Dict[str, List[Dict]]:
    # Sort by average cost per kWh
    sorted_df = household_costs_df.sort_values('avg_cost_per_kwh')
    
    # Get top and bottom
    lowest = sorted_df.head(top_n).to_dict('records')
    highest = sorted_df.tail(top_n).sort_values('avg_cost_per_kwh', ascending=False).to_dict('records')
    
    return {
        'highest_cost': highest,
        'lowest_cost': lowest
    }
