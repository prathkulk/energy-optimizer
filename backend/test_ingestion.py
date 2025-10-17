"""
Test script for ENTSO-E data ingestion pipeline.

Usage:
    python test_ingestion.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from app.utils.data_ingestion import DataIngestionPipeline


def main():
    """Run the data ingestion pipeline."""
    
    # Initialize pipeline (reads API key from .env file)
    pipeline = DataIngestionPipeline()
    
    # Fetch and process data
    # Parameters:
    # - country_code: 'DE' (Germany), 'FR' (France), etc.
    # - days_back: Number of days of historical data
    # - num_households: Number of synthetic households to create
    household_df = pipeline.fetch_and_process(
        country_code='DE',
        days_back=7,  # Start with 7 days for testing
        num_households=100,
        save_to_csv=True
    )
    
    # Display sample data
    print("\nSample Data (first 10 records):")
    print(household_df.head(10))
    
    print("\nSample Data (random 10 records):")
    print(household_df.sample(10))
    
    return household_df


if __name__ == '__main__':
    df = main()