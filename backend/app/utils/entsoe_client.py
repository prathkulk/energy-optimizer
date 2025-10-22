import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import xml.etree.ElementTree as ET
from io import StringIO


class ENTSOEClient:
    """
    Client for interacting with ENTSO-E Transparency Platform API.

    Fetches actual load (consumption) data for European countries.
    """

    BASE_URL = "https://web-api.tp.entsoe.eu/api"

    # Area codes for European countries (EIC codes)
    AREA_CODES = {
        'DE': '10Y1001A1001A83F',  # Germany
        'FR': '10YFR-RTE------C',  # France
        'IT': '10YIT-GRTN-----B',  # Italy
        'ES': '10YES-REE------0',  # Spain
        'NL': '10YNL----------L',  # Netherlands
        'BE': '10YBE----------2',  # Belgium
        'AT': '10YAT-APG------L',  # Austria
        'PL': '10YPL-AREA-----S',  # Poland
        'SE': '10YSE-1--------K',  # Sweden
        'NO': '10YNO-0--------C',  # Norway
    }

    def __init__(self, api_key: str):
        """
        Initialize ENTSO-E client.

        Args:
            api_key: Your ENTSO-E API security token
        """
        self.api_key = api_key
        self.session = requests.Session()

    def _format_datetime(self, dt: datetime) -> str:
        """
        Format datetime for ENTSO-E API (YYYYMMDDHHMM format in UTC).

        Args:
            dt: Datetime object

        Returns:
            Formatted string
        """
        return dt.strftime('%Y%m%d%H%M')

    def fetch_actual_load(
        self,
        country_code: str,
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """
        Fetch actual load (consumption) data for a country.
        
        Args:
            country_code: Two-letter country code (e.g., 'DE', 'FR')
            start_date: Start datetime (UTC, can be naive or aware)
            end_date: End datetime (UTC, can be naive or aware)
            
        Returns:
            DataFrame with columns: timestamp, country, load_mw
            
        Raises:
            ValueError: If country code is invalid
            requests.HTTPError: If API request fails
        """
        if country_code not in self.AREA_CODES:
            raise ValueError(
                f"Invalid country code: {country_code}. "
                f"Available: {list(self.AREA_CODES.keys())}"
            )
        
        # Ensure start_date and end_date are timezone-aware (UTC)
        from datetime import timezone as tz
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=tz.utc)
        if end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=tz.utc)
        
        area_code = self.AREA_CODES[country_code]
        
        # API parameters (use naive datetime for API call)
        params = {
            'securityToken': self.api_key,
            'documentType': 'A65',  # System total load (actual)
            'processType': 'A16',   # Realised
            'outBiddingZone_Domain': area_code,
            'periodStart': self._format_datetime(start_date),
            'periodEnd': self._format_datetime(end_date)
        }
        
        print(f"Fetching load data for {country_code} from {start_date} to {end_date}...")
        print(f"Period start: {self._format_datetime(start_date)}")
        print(f"Period end: {self._format_datetime(end_date)}")
        
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
        except requests.HTTPError as e:
            print(f"API Error: {e}")
            print(f"Response: {response.text}")
            raise
        
        # Parse XML response
        df = self._parse_load_response(response.text, country_code)
        
        print(f"API returned {len(df)} records")
        print(f"Date range from API: {df['timestamp'].min()} to {df['timestamp'].max()}")
        
        # CRITICAL: Filter to exact requested date range
        # Make sure timestamps in df are timezone-aware for comparison
        if not pd.api.types.is_datetime64tz_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        
        df = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)].copy()
        
        print(f"After filtering: {len(df)} records")
        if len(df) > 0:
            print(f"Filtered date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        
        if len(df) == 0:
            raise ValueError(
                f"No data available for {country_code} in the requested period "
                f"({start_date} to {end_date})"
            )
        
        return df

    def _parse_load_response(self, xml_content: str, country_code: str) -> pd.DataFrame:
        """
        Parse XML response from ENTSO-E API.

        Args:
            xml_content: Raw XML response
            country_code: Country code for labeling

        Returns:
            Parsed DataFrame
        """
        # Parse XML
        root = ET.fromstring(xml_content)

        # Define namespace
        ns = {'ns': 'urn:iec62325.351:tc57wg16:451-6:generationloaddocument:3:0'}

        records = []

        # Find all TimeSeries elements
        for timeseries in root.findall('.//ns:TimeSeries', ns):
            # Find all Point elements within each TimeSeries
            for period in timeseries.findall('.//ns:Period', ns):
                # Get period start time
                start_str = period.find('ns:timeInterval/ns:start', ns).text
                start_time = pd.to_datetime(start_str)

                # Resolution (e.g., PT15M = 15 minutes, PT60M = 60 minutes)
                resolution = period.find('ns:resolution', ns).text
                resolution_minutes = self._parse_resolution(resolution)

                # Extract all data points
                for point in period.findall('ns:Point', ns):
                    position = int(point.find('ns:position', ns).text)
                    quantity = float(point.find('ns:quantity', ns).text)

                    # Calculate timestamp for this point
                    timestamp = start_time + \
                        timedelta(minutes=(position - 1) * resolution_minutes)

                    records.append({
                        'timestamp': timestamp,
                        'country': country_code,
                        'load_mw': quantity
                    })

        df = pd.DataFrame(records)
        df = df.sort_values('timestamp').reset_index(drop=True)

        return df

    def _parse_resolution(self, resolution: str) -> int:
        """
        Parse ISO 8601 duration to minutes.

        Args:
            resolution: ISO 8601 duration (e.g., 'PT15M', 'PT60M')

        Returns:
            Minutes as integer
        """
        if resolution == 'PT15M':
            return 15
        elif resolution == 'PT60M':
            return 60
        elif resolution.startswith('PT') and resolution.endswith('M'):
            return int(resolution[2:-1])
        else:
            raise ValueError(f"Unknown resolution format: {resolution}")

    def fetch_multiple_countries(
        self,
        country_codes: List[str],
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """
        Fetch load data for multiple countries and combine.

        Args:
            country_codes: List of country codes
            start_date: Start datetime
            end_date: End datetime

        Returns:
            Combined DataFrame
        """
        all_data = []

        for country in country_codes:
            try:
                df = self.fetch_actual_load(country, start_date, end_date)
                all_data.append(df)
            except Exception as e:
                print(f"Failed to fetch data for {country}: {e}")
                continue

        if not all_data:
            raise ValueError("No data fetched for any country")

        combined_df = pd.concat(all_data, ignore_index=True)
        return combined_df


def convert_to_household_consumption(
    load_df: pd.DataFrame,
    num_households: int = 100,
    household_fraction: float = 0.30
) -> pd.DataFrame:
    """
    Convert country-level load (MW) to household-level consumption (kWh).

    This is a simplification: we'll distribute national load across households
    with some randomization to simulate heterogeneity.

    Args:
        load_df: DataFrame with country-level load
        num_households: Number of synthetic households to create
        household_fraction: Fraction of total load attributed to households

    Returns:
        DataFrame with columns: household_id, timestamp, consumption_kwh
    """
    records = []

    for _, row in load_df.iterrows():
        timestamp = row['timestamp']
        # Convert MW to kWh (MW * 1000 = kWh for 1 hour)
        total_load_kwh = row['load_mw'] * 1000 * household_fraction

        # Distribute across households with variation
        # Use Dirichlet distribution for realistic heterogeneity
        import numpy as np
        np.random.seed(int(timestamp.timestamp()) %
                       (2**31))  # Deterministic but varied

        proportions = np.random.dirichlet(np.ones(num_households) * 2)
        household_consumptions = proportions * total_load_kwh

        for household_id, consumption in enumerate(household_consumptions):
            records.append({
                'household_id': household_id,
                'timestamp': timestamp,
                'consumption_kwh': round(consumption, 3)
            })

    return pd.DataFrame(records)
