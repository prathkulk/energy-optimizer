"""
Data ingestion pipeline for ENTSO-E data.

This module coordinates fetching, processing, and storing energy consumption data.
"""

import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import os
from dotenv import load_dotenv

from .entsoe_client import ENTSOEClient, convert_to_household_consumption


class DataIngestionPipeline:
    """
    Orchestrates the data ingestion process from ENTSO-E to structured DataFrame.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the pipeline.
        
        Args:
            api_key: ENTSO-E API key (if None, reads from environment)
        """
        if api_key is None:
            load_dotenv()
            api_key = os.getenv('ENTSOE_API_KEY')
            
            if not api_key:
                raise ValueError(
                    "ENTSO-E API key not found. "
                    "Set ENTSOE_API_KEY environment variable or pass api_key parameter."
                )
        
        self.client = ENTSOEClient(api_key)
        self.data_dir = Path(__file__).parent.parent.parent.parent / 'data' / 'raw'
        self.data_dir.mkdir(parents=True, exist_ok=True)
    
    def fetch_and_process(
        self,
        country_code: str = 'DE',
        days_back: int = 30,
        num_households: int = 100,
        save_to_csv: bool = True
    ) -> pd.DataFrame:
        """
        Complete pipeline: fetch, transform, and return household consumption data.
        
        Args:
            country_code: Country to fetch data for
            days_back: Number of days of historical data
            num_households: Number of synthetic households
            save_to_csv: Whether to save raw and processed data to CSV
            
        Returns:
            DataFrame with household-level consumption
        """
        # Calculate date range
        end_date = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        start_date = end_date - timedelta(days=days_back)
        
        print(f"\n{'='*60}")
        print(f"Starting Data Ingestion Pipeline")
        print(f"{'='*60}")
        print(f"Country: {country_code}")
        print(f"Period: {start_date} to {end_date}")
        print(f"Households: {num_households}")
        print(f"{'='*60}\n")
        
        # Step 1: Fetch country-level load data
        print("Step 1: Fetching data from ENTSO-E API...")
        load_df = self.client.fetch_actual_load(country_code, start_date, end_date)
        
        if save_to_csv:
            raw_file = self.data_dir / f'entsoe_load_{country_code}_{start_date.date()}_to_{end_date.date()}.csv'
            load_df.to_csv(raw_file, index=False)
            print(f"✓ Raw data saved to: {raw_file}")
        
        # Step 2: Convert to household-level consumption
        print("\nStep 2: Converting to household-level consumption...")
        household_df = convert_to_household_consumption(load_df, num_households)
        
        if save_to_csv:
            processed_file = self.data_dir / f'household_consumption_{country_code}_{num_households}hh.csv'
            household_df.to_csv(processed_file, index=False)
            print(f"✓ Processed data saved to: {processed_file}")
        
        # Step 3: Data quality checks
        print("\nStep 3: Running data quality checks...")
        self._validate_data(household_df)
        
        # Step 4: Summary statistics
        print("\nStep 4: Data Summary")
        print(f"{'='*60}")
        self._print_summary(household_df)
        print(f"{'='*60}\n")
        
        print("✓ Pipeline completed successfully!\n")
        
        return household_df
    
    def _validate_data(self, df: pd.DataFrame):
        """
        Validate the processed data.
        
        Args:
            df: DataFrame to validate
            
        Raises:
            ValueError: If validation fails
        """
        # Check for missing values
        if df.isnull().any().any():
            raise ValueError("Data contains missing values")
        
        # Check for negative consumption
        if (df['consumption_kwh'] < 0).any():
            raise ValueError("Data contains negative consumption values")
        
        # Check timestamp continuity
        timestamps = sorted(df['timestamp'].unique())
        time_diffs = pd.Series(timestamps).diff().dropna()
        expected_diff = timedelta(hours=1)
        
        if not all(time_diffs == expected_diff):
            print("⚠ Warning: Timestamps are not perfectly continuous (may have gaps)")
        
        print("✓ Data validation passed")
    
    def _print_summary(self, df: pd.DataFrame):
        """Print summary statistics."""
        print(f"Total records: {len(df):,}")
        print(f"Unique households: {df['household_id'].nunique()}")
        print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"Total hours: {df['timestamp'].nunique()}")
        print(f"\nConsumption Statistics (kWh per hour):")
        print(f"  Mean: {df['consumption_kwh'].mean():.3f}")
        print(f"  Median: {df['consumption_kwh'].median():.3f}")
        print(f"  Std Dev: {df['consumption_kwh'].std():.3f}")
        print(f"  Min: {df['consumption_kwh'].min():.3f}")
        print(f"  Max: {df['consumption_kwh'].max():.3f}")
        
        # Per household statistics
        household_totals = df.groupby('household_id')['consumption_kwh'].sum()
        print(f"\nPer-Household Total Consumption:")
        print(f"  Mean: {household_totals.mean():.1f} kWh")
        print(f"  Min: {household_totals.min():.1f} kWh")
        print(f"  Max: {household_totals.max():.1f} kWh")


def load_from_csv(filepath: str) -> pd.DataFrame:
    """
    Load previously saved household consumption data from CSV.
    
    Args:
        filepath: Path to CSV file
        
    Returns:
        DataFrame with parsed timestamps
    """
    df = pd.DataFrame(filepath)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df