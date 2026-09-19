"""VaaniStock — Demo Data Seeder"""
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from app.database.mongodb import get_collection
from app.utils.units import normalize_unit
from app.utils.auth import hash_password
import logging
import random

logger = logging.getLogger(__name__)

DEMO_PRODUCTS = [
    {"name": "Basmati Rice", "category": "Grains", "unit": "bags", "quantity": 25,
     "purchasePrice": 1500, "sellingPrice": 1750, "lowStockThreshold": 5, "reorderQuantity": 20},
    {"name": "Wheat Flour (Atta)", "category": "Grains", "unit": "bags", "quantity": 3,
     "purchasePrice": 280, "sellingPrice": 320, "lowStockThreshold": 5, "reorderQuantity": 15},
    {"name": "Sugar", "category": "Essentials", "unit": "kg", "quantity": 50,
     "purchasePrice": 42, "sellingPrice": 48, "lowStockThreshold": 10, "reorderQuantity": 25},
    {"name": "Cooking Oil", "category": "Essentials", "unit": "litres", "quantity": 0,
     "purchasePrice": 120, "sellingPrice": 140, "lowStockThreshold": 10, "reorderQuantity": 20},
    {"name": "Tea Leaves", "category": "Beverages", "unit": "kg", "quantity": 8,
     "purchasePrice": 350, "sellingPrice": 420, "lowStockThreshold": 5, "reorderQuantity": 10},
    {"name": "Parle-G Biscuits", "category": "Snacks", "unit": "cartons", "quantity": 12,
     "purchasePrice": 480, "sellingPrice": 560, "lowStockThreshold": 3, "reorderQuantity": 10},
    {"name": "Maggi Noodles", "category": "Snacks", "unit": "cartons", "quantity": 2,
     "purchasePrice": 650, "sellingPrice": 720, "lowStockThreshold": 3, "reorderQuantity": 8},
    {"name": "Surf Excel (Detergent)", "category": "Household", "unit": "packets", "quantity": 30,
     "purchasePrice": 85, "sellingPrice": 100, "lowStockThreshold": 10, "reorderQuantity": 20},
    {"name": "Amul Milk (Pouch)", "category": "Dairy", "unit": "packets", "quantity": 40,
     "purchasePrice": 28, "sellingPrice": 32, "lowStockThreshold": 15, "reorderQuantity": 50},
    {"name": "Lifebuoy Soap", "category": "Household", "unit": "pieces", "quantity": 60,
     "purchasePrice": 38, "sellingPrice": 45, "lowStockThreshold": 20, "reorderQuantity": 50},
    {"name": "Salt (Tata)", "category": "Essentials", "unit": "kg", "quantity": 4,
     "purchasePrice": 18, "sellingPrice": 22, "lowStockThreshold": 5, "reorderQuantity": 20},
    {"name": "Turmeric Powder", "category": "Spices", "unit": "kg", "quantity": 6,
     "purchasePrice": 120, "sellingPrice": 150, "lowStockThreshold": 2, "reorderQuantity": 5},
    {"name": "Red Chilli Powder", "category": "Spices", "unit": "kg", "quantity": 4,
     "purchasePrice": 150, "sellingPrice": 180, "lowStockThreshold": 2, "reorderQuantity": 5},
    {"name": "Lentils (Dal)", "category": "Grains", "unit": "kg", "quantity": 35,
     "purchasePrice": 95, "sellingPrice": 115, "lowStockThreshold": 10, "reorderQuantity": 25},
    {"name": "Cold Drink (Pepsi) 2L", "category": "Beverages", "unit": "bottles", "quantity": 24,
     "purchasePrice": 65, "sellingPrice": 80, "lowStockThreshold": 10, "reorderQuantity": 24},
]


def seed_demo_data(user_id: ObjectId) -> None:
    """Seed realistic demo products and transactions for a user."""
    products_col = get_collection("products")
    transactions_col = get_collection("transactions")

    # Check if already seeded
    existing = products_col.find_one({"userId": user_id, "isDemo": True})
    if existing:
        logger.info(f"Demo data already exists for user {user_id}")
        return

    now = datetime.now(timezone.utc)
    inserted_products = []

    for prod in DEMO_PRODUCTS:
        doc = {
            "userId": user_id,
            "name": prod["name"],
            "normalizedName": prod["name"].lower().strip(),
            "category": prod["category"],
            "unit": prod["unit"],
            "quantity": float(prod["quantity"]),
            "purchasePrice": prod.get("purchasePrice"),
            "sellingPrice": prod.get("sellingPrice"),
            "lowStockThreshold": float(prod.get("lowStockThreshold", 5)),
            "reorderQuantity": float(prod.get("reorderQuantity", 10)),
            "supplier": None,
            "isDemo": True,
            "createdAt": now - timedelta(days=30),
            "updatedAt": now - timedelta(days=random.randint(0, 7)),
        }
        result = products_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        inserted_products.append(doc)

    # Seed some recent transactions
    actions = ["ADD", "ADD", "REMOVE", "ADD", "REMOVE", "ADD"]
    for i, (prod, action) in enumerate(zip(inserted_products[:6], actions)):
        qty = random.uniform(2, 15)
        prev = prod["quantity"] + (qty if action == "REMOVE" else -qty)
        transactions_col.insert_one({
            "userId": user_id,
            "productId": prod["_id"],
            "productName": prod["name"],
            "action": action,
            "quantity": round(qty, 1),
            "unit": prod["unit"],
            "source": "MANUAL",
            "transcript": None,
            "previousQuantity": max(0, prev),
            "newQuantity": prod["quantity"],
            "createdAt": now - timedelta(hours=random.randint(1, 72)),
        })

    logger.info(f"✅ Seeded {len(inserted_products)} demo products for user {user_id}")
