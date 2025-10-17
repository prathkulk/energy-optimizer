from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import time


class PricingStrategy(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def calculate_prices(
        self, 
        consumption_df: pd.DataFrame,
        cost_recovery_target: float,
        **kwargs
    ) -> pd.DataFrame:

        pass
    
    def validate_cost_recovery(
        self,
        consumption_df: pd.DataFrame,
        pricing_df: pd.DataFrame,
        cost_recovery_target: float
    ) -> Dict[str, float]:
        # Merge and calculate revenue
        merged = consumption_df.merge(pricing_df, on='timestamp')
        merged['revenue'] = merged['consumption_kwh'] * merged['price_per_kwh']
        
        total_revenue = merged['revenue'].sum()
        total_consumption = merged['consumption_kwh'].sum()
        avg_price = total_revenue / total_consumption if total_consumption > 0 else 0
        
        return {
            'total_revenue': round(float(total_revenue), 2),
            'cost_recovery_target': round(float(cost_recovery_target), 2),
            'cost_recovery_percentage': round(float((total_revenue / cost_recovery_target) * 100), 2) if cost_recovery_target > 0 else 0,
            'total_consumption': round(float(total_consumption), 2),
            'avg_price_per_kwh': round(float(avg_price), 4)
        }


class FlatRatePricing(PricingStrategy):
    def __init__(self):
        super().__init__(
            name="Flat Rate",
            description="Constant price for all hours. Simple and predictable for consumers."
        )
    
    def calculate_prices(
        self, 
        consumption_df: pd.DataFrame,
        cost_recovery_target: float,
        **kwargs
    ) -> pd.DataFrame:
        # Get unique timestamps
        timestamps = consumption_df['timestamp'].unique()
        
        # Calculate total consumption
        total_consumption = consumption_df['consumption_kwh'].sum()
        
        # Calculate flat rate
        flat_rate = cost_recovery_target / total_consumption if total_consumption > 0 else 0
        
        # Create pricing dataframe
        pricing_df = pd.DataFrame({
            'timestamp': timestamps,
            'price_per_kwh': flat_rate
        })
        
        return pricing_df


class TimeOfUsePricing(PricingStrategy):
    def __init__(self):
        super().__init__(
            name="Time-of-Use",
            description="Different prices for peak and off-peak hours. Encourages load shifting."
        )
    
    def calculate_prices(
        self, 
        consumption_df: pd.DataFrame,
        cost_recovery_target: float,
        peak_hours: Optional[List[int]] = None,
        peak_multiplier: float = 1.5,
        offpeak_multiplier: float = 0.7,
        **kwargs
    ) -> pd.DataFrame:
        if peak_hours is None:
            # Default peak hours: 7-9 AM and 5-10 PM
            peak_hours = [7, 8, 17, 18, 19, 20, 21]
        
        # Add hour column
        df = consumption_df.copy()
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['is_peak'] = df['hour'].isin(peak_hours)
        
        # Calculate consumption in peak and off-peak
        peak_consumption = df[df['is_peak']]['consumption_kwh'].sum()
        offpeak_consumption = df[~df['is_peak']]['consumption_kwh'].sum()
        
        # Calculate base price to achieve cost recovery
        # Formula: base_price * (peak_mult * peak_cons + offpeak_mult * offpeak_cons) = target
        weighted_consumption = (peak_multiplier * peak_consumption + 
                               offpeak_multiplier * offpeak_consumption)
        
        base_price = cost_recovery_target / weighted_consumption if weighted_consumption > 0 else 0
        
        # Calculate prices for each timestamp
        timestamps = df['timestamp'].unique()
        prices = []
        
        for ts in timestamps:
            hour = pd.to_datetime(ts).hour
            is_peak = hour in peak_hours
            price = base_price * (peak_multiplier if is_peak else offpeak_multiplier)
            prices.append(price)
        
        pricing_df = pd.DataFrame({
            'timestamp': timestamps,
            'price_per_kwh': prices
        })
        
        return pricing_df


class DynamicTariffPricing(PricingStrategy):
    def __init__(self):
        super().__init__(
            name="Dynamic Tariff",
            description="Price varies with system load. High demand = high price, incentivizing load reduction."
        )
    
    def calculate_prices(
        self, 
        consumption_df: pd.DataFrame,
        cost_recovery_target: float,
        min_multiplier: float = 0.5,
        max_multiplier: float = 2.0,
        **kwargs
    ) -> pd.DataFrame:
        # Aggregate total load at each timestamp
        hourly_load = consumption_df.groupby('timestamp')['consumption_kwh'].sum().reset_index()
        hourly_load.columns = ['timestamp', 'total_load']
        
        # Normalize load to [0, 1]
        min_load = hourly_load['total_load'].min()
        max_load = hourly_load['total_load'].max()
        
        if max_load > min_load:
            hourly_load['load_normalized'] = (
                (hourly_load['total_load'] - min_load) / (max_load - min_load)
            )
        else:
            hourly_load['load_normalized'] = 0.5
        
        # Map normalized load to price multiplier
        hourly_load['multiplier'] = (
            min_multiplier + 
            (max_multiplier - min_multiplier) * hourly_load['load_normalized']
        )
        
        # Calculate base price
        total_consumption = consumption_df['consumption_kwh'].sum()
        base_price = cost_recovery_target / total_consumption if total_consumption > 0 else 0
        
        # Apply multipliers
        hourly_load['price_per_kwh'] = base_price * hourly_load['multiplier']
        
        # Adjust to meet exact cost recovery target
        merged = consumption_df.merge(hourly_load[['timestamp', 'price_per_kwh']], on='timestamp')
        actual_revenue = (merged['consumption_kwh'] * merged['price_per_kwh']).sum()
        
        if actual_revenue > 0:
            adjustment_factor = cost_recovery_target / actual_revenue
            hourly_load['price_per_kwh'] *= adjustment_factor
        
        pricing_df = hourly_load[['timestamp', 'price_per_kwh']].copy()
        
        return pricing_df


def get_strategy(strategy_type: str, **kwargs) -> PricingStrategy:
    strategies = {
        'flat': FlatRatePricing,
        'tou': TimeOfUsePricing,
        'dynamic': DynamicTariffPricing
    }
    
    strategy_class = strategies.get(strategy_type.lower())
    if not strategy_class:
        raise ValueError(f"Unknown strategy type: {strategy_type}. Available: {list(strategies.keys())}")
    
    return strategy_class()