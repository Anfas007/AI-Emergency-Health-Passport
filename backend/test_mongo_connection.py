#!/usr/bin/env python3
"""Test MongoDB connection with credentials from .env"""

from dotenv import load_dotenv
import os
import sys

# Load environment variables from .env
load_dotenv()

MONGO_URL = os.getenv('MONGO_URL')
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'ai_emergency_health_passport')

if not MONGO_URL:
    print("❌ MONGO_URL not found in .env file")
    sys.exit(1)

print(f"Testing MongoDB connection...")
print(f"Database: {MONGO_DB_NAME}")
print()

try:
    from pymongo import MongoClient
    
    # Connect with timeout
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000, connectTimeoutMS=10000)
    
    # Test connection
    client.admin.command('ping')
    
    # Get database
    db = client[MONGO_DB_NAME]
    
    print("✅ MongoDB connection successful!")
    print(f"   Connected to: {db.name}")
    print(f"   Collections: {db.list_collection_names()}")
    
except Exception as e:
    print(f"❌ MongoDB connection failed!")
    print(f"   Error: {e}")
    sys.exit(1)
