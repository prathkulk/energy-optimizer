"""
Database models package.
"""

from app.models.consumption import ConsumptionRecord
from app.models.optimization import OptimizationResult

__all__ = ["ConsumptionRecord", "OptimizationResult"]