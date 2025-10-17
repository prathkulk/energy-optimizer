"""
Script to initialize the database and create initial migration.
"""

from app.database import init_db
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Initialize database tables."""
    logger.info(f"Initializing database at: {settings.database_url}")
    
    try:
        init_db()
        logger.info("✓ Database initialized successfully!")
        logger.info("✓ All tables created")
        logger.info("\nNext steps:")
        logger.info("1. Run: alembic revision --autogenerate -m 'Initial migration'")
        logger.info("2. Run: alembic upgrade head")
    except Exception as e:
        logger.error(f"✗ Failed to initialize database: {e}")
        raise


if __name__ == "__main__":
    main()