from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def get_database():
    """Get database connection"""
    return db.database

async def connect_to_mongo():
    """Create database connection"""
    try:
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://127.0.0.1:27017/ehr_nlp_system")
        db.client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=8000)
        
        # Test connection
        await db.client.admin.command('ping')
        
        # Get database name from URL or use default
        database_name = mongodb_url.split('/')[-1] if '/' in mongodb_url else "ehr_nlp_system"
        db.database = db.client[database_name]
        
        # Create indexes for better performance
        await create_indexes()
        
        print(f"✅ Connected to MongoDB database: {database_name}")
        
    except ConnectionFailure as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("🔌 MongoDB connection closed")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("username", unique=True)
        
        # Notes collection indexes
        await db.database.notes.create_index("user_id")
        await db.database.notes.create_index("created_at")
        await db.database.notes.create_index([("user_id", 1), ("created_at", -1)])
        
        # Entities collection indexes
        await db.database.entities.create_index("note_id")
        await db.database.entities.create_index("entity_type")
        await db.database.entities.create_index([("note_id", 1), ("entity_type", 1)])
        
        print("✅ Database indexes created successfully")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}")

# Database collections
def get_users_collection():
    return db.database.users

def get_notes_collection():
    return db.database.notes

def get_entities_collection():
    return db.database.entities
