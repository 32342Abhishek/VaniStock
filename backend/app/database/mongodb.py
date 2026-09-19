"""VaaniStock — MongoDB Connection"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: MongoClient = None
db = None


def connect_db():
    global client, db
    try:
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client[settings.DATABASE_NAME]
        _create_indexes()
        logger.info(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
        return True
    except Exception as e:
        client = None
        db = None
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False


def disconnect_db():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def _create_indexes():
    """Create optimized indexes for all collections."""
    # Products
    db.products.create_index([("userId", ASCENDING), ("normalizedName", ASCENDING)], unique=True)
    db.products.create_index([("userId", ASCENDING), ("category", ASCENDING)])
    db.products.create_index([("userId", ASCENDING), ("quantity", ASCENDING)])

    # Transactions
    db.transactions.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
    db.transactions.create_index([("userId", ASCENDING), ("productId", ASCENDING)])
    db.transactions.create_index([("requestId", ASCENDING)], unique=True, sparse=True)

    # Voice commands
    db.voice_commands.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])

    # Users
    db.users.create_index([("email", ASCENDING)], unique=True)

    logger.info("Database indexes created")


def get_db():
    return db


def get_collection(name: str) -> Collection:
    if db is None:
        raise RuntimeError("MongoDB is not connected. Start MongoDB or check MONGODB_URI.")
    return db[name]
