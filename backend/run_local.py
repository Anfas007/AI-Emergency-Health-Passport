# -*- coding: utf-8 -*-
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

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))


def check_env():
	"""Check if .env file exists and has required variables."""
	env_path = PROJECT_ROOT / ".env"

	if not env_path.exists():
		print("\n⚠️  .env file not found!")
		print("   Create one from template: cp .env.example .env")
		print("   Or set MONGO_URL environment variable")
		return False

	from dotenv import load_dotenv

	load_dotenv(env_path)

	mongo_url = os.getenv("MONGO_URL")
	if not mongo_url:
		print("\n⚠️  MONGO_URL not set in .env file!")
		print("   Add your MongoDB connection string to .env")
		return False

	print("✅ .env file found and configured")
	print(f"   Database: {os.getenv('MONGO_DB_NAME', 'ai_emergency_health_passport')}")
	return True


def run_server(host="127.0.0.1", port=8000, reload=False):
	"""Run FastAPI server with uvicorn.

	Args:
		host: Server host (default: 127.0.0.1)
		port: Server port (default: 8000)
		reload: Enable auto-reload on file changes (default: False)
	"""
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
	parser = argparse.ArgumentParser(
		description="Run AI Emergency Health Passport Backend locally"
	)
	parser.add_argument(
		"--reload",
		action="store_true",
		help="Enable auto-reload on file changes (development)",
	)
	parser.add_argument(
		"--host",
		default="127.0.0.1",
		help="Server host (default: 127.0.0.1)",
	)
	parser.add_argument(
		"--port",
		type=int,
		default=8000,
		help="Server port (default: 8000)",
	)

	args = parser.parse_args()

	# Check environment
	if not check_env():
		sys.exit(1)

	# Run server
	try:
		run_server(host=args.host, port=args.port, reload=args.reload)
	except KeyboardInterrupt:
		print("\n\n👋 Server stopped")
		sys.exit(0)
#!/usr/bin/env python3\n\"\"\"Local development runner for AI Emergency Health Passport Backend\n\nUsage:\n    python run_local.py\n    python run_local.py --reload\n    python run_local.py --port 8001\n\"\"\"\n\nimport os\nimport sys\nimport argparse\nfrom pathlib import Path\n\n# Add project root to path\nPROJECT_ROOT = Path(__file__).parent\nsys.path.insert(0, str(PROJECT_ROOT))\n\ndef check_env():\n    \"\"\"Check if .env file exists and has required variables.\"\"\"\n    env_path = PROJECT_ROOT / \".env\"\n    \n    if not env_path.exists():\n        print(\"\\n⚠️  .env file not found!\")\n        print(f\"   Create one from template: cp .env.example .env\")\n        print(f\"   Or set MONGO_URL environment variable\")\n        return False\n    \n    from dotenv import load_dotenv\n    load_dotenv(env_path)\n    \n    mongo_url = os.getenv(\"MONGO_URL\")\n    if not mongo_url:\n        print(\"\\n⚠️  MONGO_URL not set in .env file!\")\n        print(\"   Add your MongoDB connection string to .env\")\n        return False\n    \n    print(f\"✅ .env file found and configured\")\n    print(f\"   Database: {os.getenv('MONGO_DB_NAME', 'ai_emergency_health_passport')}\")\n    return True\n\ndef run_server(host=\"127.0.0.1\", port=8000, reload=False):\n    \"\"\"Run FastAPI server with uvicorn.\n    \n    Args:\n        host: Server host (default: 127.0.0.1)\n        port: Server port (default: 8000)\n        reload: Enable auto-reload on file changes (default: False)\n    \"\"\"\n    import uvicorn\n    \n    print(f\"\\n🚀 Starting FastAPI server...\")\n    print(f\"   Host: {host}\")\n    print(f\"   Port: {port}\")\n    print(f\"   Reload: {reload}\")\n    print(f\"\\n📖 Documentation:\")\n    print(f\"   Swagger UI: http://{host}:{port}/docs\")\n    print(f\"   ReDoc: http://{host}:{port}/redoc\")\n    print(f\"   OpenAPI: http://{host}:{port}/openapi.json\")\n    print(f\"\\n✅ Health Check: http://{host}:{port}/health\")\n    print(f\"\\nPress CTRL+C to stop\\n\")\n    \n    uvicorn.run(\n        \"main:app\",\n        host=host,\n        port=port,\n        reload=reload,\n        log_level=\"info\"\n    )\n\nif __name__ == \"__main__\":\n    parser = argparse.ArgumentParser(\n        description=\"Run AI Emergency Health Passport Backend locally\"\n    )\n    parser.add_argument(\n        \"--reload\",\n        action=\"store_true\",\n        help=\"Enable auto-reload on file changes (development)\"\n    )\n    parser.add_argument(\n        \"--host\",\n        default=\"127.0.0.1\",\n        help=\"Server host (default: 127.0.0.1)\"\n    )\n    parser.add_argument(\n        \"--port\",\n        type=int,\n        default=8000,\n        help=\"Server port (default: 8000)\"\n    )\n    \n    args = parser.parse_args()\n    \n    # Check environment\n    if not check_env():\n        sys.exit(1)\n    \n    # Run server\n    try:\n        run_server(host=args.host, port=args.port, reload=args.reload)\n    except KeyboardInterrupt:\n        print(\"\\n\\n👋 Server stopped\")\n        sys.exit(0)\n