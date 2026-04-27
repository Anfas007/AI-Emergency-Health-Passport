#!/usr/bin/env python3
"""Local development runner for AI Emergency Health Passport Backend.

Usage:
    python run_local.py
    python run_local.py --reload
    python run_local.py --port 8001
"""

import argparse
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))


def _load_local_env() -> bool:
    """Load .env.local first, then .env for local development."""
    from dotenv import load_dotenv

    for candidate in (PROJECT_ROOT / ".env.local", PROJECT_ROOT / ".env"):
        if candidate.exists():
            load_dotenv(candidate)
            print(f"✅ Loaded local environment from {candidate.name}")
            return True

    load_dotenv()
    return False


def check_env():
    """Check if a local env file exists and has required variables."""
    if not _load_local_env():
        print("\n⚠️  No local env file found!")
        print("   Create one from template: copy backend/.env.example to backend/.env.local")
        print("   Or set MONGO_URL environment variable")
        return False

    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("\n⚠️  MONGO_URL not set in local env file!")
        print("   Add your MongoDB connection string to backend/.env.local")
        return False

    print("✅ Local environment configured")
    print(f"   Database: {os.getenv('MONGO_DB_NAME', 'ai_emergency_health_passport')}")
    return True


def run_server(host="127.0.0.1", port=8000, reload=False):
    """Run FastAPI server with uvicorn."""
    import uvicorn

    print("\n🚀 Starting FastAPI server...")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Reload: {reload}")
    print("\n📖 Documentation:")
    print(f"   Swagger UI: http://{host}:{port}/docs")
    print(f"   ReDoc: http://{host}:{port}/redoc")
    print(f"   OpenAPI: http://{host}:{port}/openapi.json")
    print(f"\n✅ Health Check: http://{host}:{port}/health")
    print("\nPress CTRL+C to stop\n")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run AI Emergency Health Passport Backend locally")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on file changes")
    parser.add_argument("--host", default="127.0.0.1", help="Server host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Server port (default: 8000)")

    args = parser.parse_args()

    if not check_env():
        sys.exit(1)

    try:
        run_server(host=args.host, port=args.port, reload=args.reload)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        sys.exit(0)
