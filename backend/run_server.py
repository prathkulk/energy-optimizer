from pathlib import Path
import sys
import uvicorn
from app.config import settings
import os

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Run the FastAPI server."""
    # Get configuration from environment variables (for production)
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() == "true"

    # Determine if we're in production
    is_production = os.getenv("ENV", "development") == "production"

    if is_production:
        print(f"🚀 Starting server in PRODUCTION mode on {host}:{port}")
        reload = False  # Never reload in production
    else:
        print(f"🔧 Starting server in DEVELOPMENT mode on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()
