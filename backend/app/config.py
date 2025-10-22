from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application Settings
    app_name: str = "Energy Price Optimization API"
    app_version: str = "1.0.0"
    api_v1_prefix: str = "/api/v1"
    debug: bool = False
    
    # CORS Settings
    cors_origins: List[str] = ["https://energy-optimizer.vercel.app/", "http://localhost:3000", "http://localhost:3001"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    # Database Settings
    database_url: str = os.getenv("DATABASE_URL")
    db_echo: bool = False  # Set to True to see SQL queries in logs
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # ENTSO-E API Settings
    entsoe_api_key: str
    entsoe_rate_limit: int = 100  # requests per hour
    entsoe_timeout: int = 30  # seconds
    
    # Data Ingestion Settings
    max_days_back: int = 90
    min_households: int = 1
    max_households: int = 1000
    default_num_households: int = 100
    
    # Optimization Settings
    default_fairness_weight: float = 0.5
    default_profit_weight: float = 0.5
    min_price_per_kwh: float = 0.05
    max_price_per_kwh: float = 0.50
    solver_timeout_seconds: int = 30
    
    # Pagination Settings
    default_page_size: int = 50
    max_page_size: int = 100

settings = Settings()