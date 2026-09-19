"""VaaniStock — Inventory Business Logic Service"""
import logging
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from pymongo.errors import DuplicateKeyError as _DuplicateKeyError  # noqa: F401
from app.database.mongodb import get_collection
from app.utils.units import normalize_unit

logger = logging.getLogger(__name__)


def get_stock_status(quantity: float, threshold: float) -> str:
    if quantity == 0:
        return "OUT_OF_STOCK"
    if quantity <= threshold:
        return "LOW_STOCK"
    return "HEALTHY"


def serialize_product(p: dict) -> dict:
    """Convert MongoDB product doc to JSON-serializable dict."""
    if not p:
        return None
    p = dict(p)
    p["id"] = str(p.pop("_id"))
    p["userId"] = str(p.get("userId", ""))
    p["status"] = get_stock_status(p.get("quantity", 0), p.get("lowStockThreshold", 5))
    # Timestamps
    for field in ("createdAt", "updatedAt"):
        if field in p and isinstance(p[field], datetime):
            p[field] = p[field].isoformat()
    return p


def serialize_transaction(t: dict) -> dict:
    if not t:
        return None
    t = dict(t)
    t["id"] = str(t.pop("_id"))
    t["userId"] = str(t.get("userId", ""))
    t["productId"] = str(t.get("productId", ""))
    if "createdAt" in t and isinstance(t["createdAt"], datetime):
        t["createdAt"] = t["createdAt"].isoformat()
    return t


class InventoryService:
    def __init__(self, user_id: str):
        self.user_id = ObjectId(user_id)
        self.products = get_collection("products")
        self.transactions = get_collection("transactions")

    def _get_product(self, product_id: str) -> Optional[dict]:
        """Get product, ensuring it belongs to the authenticated user."""
        try:
            pid = ObjectId(product_id)
        except Exception:
            return None
        return self.products.find_one({"_id": pid, "userId": self.user_id})

    def _get_product_by_name(self, name: str) -> Optional[dict]:
        normalized = name.lower().strip()
        return self.products.find_one({
            "userId": self.user_id,
            "normalizedName": normalized
        })

    def get_all_products(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "name",
        sort_dir: int = 1
    ) -> list:
        query = {"userId": self.user_id}
        if search:
            query["normalizedName"] = {"$regex": search.lower(), "$options": "i"}
        if category:
            query["category"] = category

        products = list(self.products.find(query).sort(sort_by, sort_dir))
        result = [serialize_product(p) for p in products]

        if status:
            result = [p for p in result if p["status"] == status]
        return result

    def get_product(self, product_id: str) -> Optional[dict]:
        p = self._get_product(product_id)
        return serialize_product(p) if p else None

    def create_product(self, data: dict) -> dict:
        from app.utils.units import normalize_product_name
        now = datetime.now(timezone.utc)
        doc = {
            "userId": self.user_id,
            "name": data["name"].strip(),
            "normalizedName": normalize_product_name(data["name"]),
            "category": data.get("category", "General"),
            "description": data.get("description"),
            "sku": data.get("sku"),
            "unit": normalize_unit(data.get("unit", "pieces")),
            "quantity": float(data.get("quantity", 0)),
            "purchasePrice": data.get("purchasePrice"),
            "sellingPrice": data.get("sellingPrice"),
            "lowStockThreshold": float(data.get("lowStockThreshold", 5)),
            "reorderQuantity": float(data.get("reorderQuantity", 10)),
            "supplier": data.get("supplier"),
            "isDemo": data.get("isDemo", False),
            "createdAt": now,
            "updatedAt": now,
        }
        result = self.products.insert_one(doc)
        doc["_id"] = result.inserted_id
        return serialize_product(doc)

    def update_product(self, product_id: str, data: dict) -> Optional[dict]:
        from app.utils.units import normalize_product_name
        product = self._get_product(product_id)
        if not product:
            return None

        updates = {k: v for k, v in data.items() if v is not None}
        if "name" in updates:
            updates["normalizedName"] = normalize_product_name(updates["name"])
        if "unit" in updates:
            updates["unit"] = normalize_unit(updates["unit"])
        updates["updatedAt"] = datetime.now(timezone.utc)

        self.products.update_one(
            {"_id": ObjectId(product_id), "userId": self.user_id},
            {"$set": updates}
        )
        return self.get_product(product_id)

    def delete_product(self, product_id: str) -> bool:
        result = self.products.delete_one(
            {"_id": ObjectId(product_id), "userId": self.user_id}
        )
        return result.deleted_count > 0

    def delete_product_voice(
        self,
        product_id: str,
        source: str = "VOICE",
        transcript: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> dict:
        if request_id:
            existing = self.transactions.find_one({"requestId": request_id})
            if existing:
                return {
                    "message": "Already processed",
                    "transaction": serialize_transaction(existing),
                    "product": None,
                    "duplicate": True,
                }

        product = self._get_product(product_id)
        if not product:
            raise ValueError("Product not found or access denied")

        qty = product.get("quantity", 0)

        # Create transaction before deleting
        txn = self._create_transaction(
            product_id=product_id,
            product_name=product["name"],
            action="REMOVE",  # We record delete as a removal of all stock
            quantity=qty,
            unit=product.get("unit"),
            source=source,
            transcript=transcript,
            prev_qty=qty,
            new_qty=0,
            request_id=request_id,
            operation="DELETE_PRODUCT",
        )

        self.products.delete_one({"_id": ObjectId(product_id), "userId": self.user_id})

        return {
            "message": f"Successfully deleted {product['name']}.",
            "transaction": serialize_transaction(txn),
            "product": None
        }

    def create_product_voice(
        self,
        name: str,
        quantity: float,
        unit: Optional[str] = None,
        source: str = "VOICE",
        transcript: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> dict:
        if request_id:
            existing = self.transactions.find_one({"requestId": request_id})
            if existing:
                return {
                    "message": "Already processed",
                    "transaction": serialize_transaction(existing),
                    "product": None,
                    "duplicate": True,
                }

        existing_product = self.find_product_by_name(name)
        if existing_product:
            raise ValueError(f"{name} already exists in your inventory. You can add stock to it.")

        from app.utils.units import normalize_unit
        norm_unit = normalize_unit(unit or "pieces")

        new_prod = self.create_product({
            "name": name,
            "quantity": quantity,
            "unit": norm_unit
        })

        txn = self._create_transaction(
            product_id=new_prod["id"],
            product_name=new_prod["name"],
            action="ADD",
            quantity=quantity,
            unit=norm_unit,
            source=source,
            transcript=transcript,
            prev_qty=0,
            new_qty=quantity,
            request_id=request_id,
            operation="CREATE_PRODUCT",
        )

        return {
            "message": f"Successfully created {new_prod['name']} with {quantity} {norm_unit}.",
            "transaction": serialize_transaction(txn),
            "product": new_prod
        }

    def stock_in(
        self,
        product_id: str,
        quantity: float,
        unit: Optional[str] = None,
        source: str = "MANUAL",
        transcript: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> dict:
        """Atomically add stock. Creates a transaction record."""
        # Idempotency check
        if request_id:
            existing = self.transactions.find_one({"requestId": request_id})
            if existing:
                logger.info(f"Duplicate request {request_id} — returning existing transaction")
                return {
                    "success": True,
                    "message": "Already processed",
                    "transaction": serialize_transaction(existing),
                    "duplicate": True,
                }

        product = self._get_product(product_id)
        if not product:
            raise ValueError("Product not found or access denied")

        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero")

        prev_qty = product["quantity"]
        new_qty = prev_qty + quantity

        # Atomic update
        result = self.products.find_one_and_update(
            {"_id": ObjectId(product_id), "userId": self.user_id},
            {
                "$inc": {"quantity": quantity},
                "$set": {"updatedAt": datetime.now(timezone.utc)},
            },
            return_document=True
        )

        # Create transaction
        txn = self._create_transaction(
            product_id=product_id,
            product_name=product["name"],
            action="ADD",
            quantity=quantity,
            unit=unit or product.get("unit"),
            source=source,
            transcript=transcript,
            prev_qty=prev_qty,
            new_qty=new_qty,
            request_id=request_id,
        )

        updated_product = serialize_product(result)
        alert = self._check_alerts(result)

        return {
            "success": True,
            "message": f"Added {quantity} {unit or product.get('unit', '')} of {product['name']}",
            "transaction": serialize_transaction(txn),
            "product": updated_product,
            "alert": alert,
        }

    def stock_out(
        self,
        product_id: str,
        quantity: float,
        unit: Optional[str] = None,
        source: str = "MANUAL",
        transcript: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> dict:
        """Atomically remove stock. Prevents negative inventory."""
        # Idempotency check
        if request_id:
            existing = self.transactions.find_one({"requestId": request_id})
            if existing:
                return {
                    "success": True,
                    "message": "Already processed",
                    "transaction": serialize_transaction(existing),
                    "duplicate": True,
                }

        product = self._get_product(product_id)
        if not product:
            raise ValueError("Product not found or access denied")

        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero")

        current_qty = product["quantity"]
        if current_qty < quantity:
            raise ValueError(
                f"Insufficient stock. Only {current_qty} {product.get('unit', 'units')} available"
            )

        prev_qty = current_qty
        new_qty = current_qty - quantity

        # Atomic conditional update — only if still enough stock
        result = self.products.find_one_and_update(
            {
                "_id": ObjectId(product_id),
                "userId": self.user_id,
                "quantity": {"$gte": quantity}  # Atomic check
            },
            {
                "$inc": {"quantity": -quantity},
                "$set": {"updatedAt": datetime.now(timezone.utc)},
            },
            return_document=True
        )

        if not result:
            raise ValueError("Insufficient stock (concurrent update detected)")

        txn = self._create_transaction(
            product_id=product_id,
            product_name=product["name"],
            action="REMOVE",
            quantity=quantity,
            unit=unit or product.get("unit"),
            source=source,
            transcript=transcript,
            prev_qty=prev_qty,
            new_qty=new_qty,
            request_id=request_id,
        )

        updated_product = serialize_product(result)
        alert = self._check_alerts(result)

        return {
            "success": True,
            "message": f"Removed {quantity} {unit or product.get('unit', '')} of {product['name']}",
            "transaction": serialize_transaction(txn),
            "product": updated_product,
            "alert": alert,
        }

    def _create_transaction(
        self, product_id, product_name, action, quantity, unit,
        source, transcript, prev_qty, new_qty, request_id=None, operation=None
    ) -> dict:
        now = datetime.now(timezone.utc)
        txn = {
            "userId": self.user_id,
            "productId": ObjectId(product_id),
            "productName": product_name,
            "action": action,
            "operation": operation or action,
            "quantity": quantity,
            "unit": unit,
            "source": source,
            "transcript": transcript,
            "previousQuantity": prev_qty,
            "newQuantity": new_qty,
            "createdAt": now,
        }
        if request_id:
            txn["requestId"] = request_id

        result = self.transactions.insert_one(txn)
        txn["_id"] = result.inserted_id
        return txn

    def _check_alerts(self, product: dict) -> Optional[dict]:
        qty = product.get("quantity", 0)
        threshold = product.get("lowStockThreshold", 5)
        status = get_stock_status(qty, threshold)
        if status != "HEALTHY":
            return {
                "type": status,
                "productName": product.get("name"),
                "quantity": qty,
                "unit": product.get("unit"),
                "threshold": threshold,
                "reorderQuantity": product.get("reorderQuantity"),
            }
        return None

    def get_dashboard_stats(self) -> dict:
        from datetime import timedelta  # noqa: F401 – used below via timedelta(days=…)
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        products = list(self.products.find({"userId": self.user_id}))
        total = len(products)
        low_stock = sum(
            1 for p in products
            if get_stock_status(p.get("quantity", 0), p.get("lowStockThreshold", 5)) == "LOW_STOCK"
        )
        out_of_stock = sum(1 for p in products if p.get("quantity", 0) == 0)

        # Today's transactions
        today_txns = list(self.transactions.find({
            "userId": self.user_id,
            "createdAt": {"$gte": today_start}
        }))
        today_in = sum(t.get("quantity", 0) for t in today_txns if t.get("action") == "ADD")
        today_out = sum(t.get("quantity", 0) for t in today_txns if t.get("action") == "REMOVE")

        # Recent transactions
        recent_txns = list(self.transactions.find(
            {"userId": self.user_id}
        ).sort("createdAt", -1).limit(10))

        # Low stock products
        low_products = [
            serialize_product(p) for p in products
            if get_stock_status(p.get("quantity", 0), p.get("lowStockThreshold", 5)) != "HEALTHY"
        ]

        # Total inventory value
        total_value = sum(
            p.get("quantity", 0) * (p.get("purchasePrice") or 0)
            for p in products
        )

        return {
            "totalProducts": total,
            "lowStockCount": low_stock,
            "outOfStockCount": out_of_stock,
            "todayStockIn": today_in,
            "todayStockOut": today_out,
            "totalInventoryValue": total_value,
            "recentTransactions": [serialize_transaction(t) for t in recent_txns],
            "lowStockProducts": low_products[:5],
        }

    def get_transactions(
        self,
        limit: int = 50,
        skip: int = 0,
        action: Optional[str] = None,
        product_id: Optional[str] = None,
    ) -> list:
        query = {"userId": self.user_id}
        if action:
            query["action"] = action.upper()
        if product_id:
            try:
                query["productId"] = ObjectId(product_id)
            except Exception:
                pass

        txns = list(
            self.transactions.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        )
        return [serialize_transaction(t) for t in txns]

    def get_low_stock_products(self) -> list:
        products = list(self.products.find({"userId": self.user_id}))
        result = []
        for p in products:
            status = get_stock_status(p.get("quantity", 0), p.get("lowStockThreshold", 5))
            if status != "HEALTHY":
                sp = serialize_product(p)
                result.append(sp)
        return result

    def get_inventory_summary(self) -> dict:
        products = list(self.products.find({"userId": self.user_id}))
        categories = {}
        for p in products:
            cat = p.get("category", "General")
            if cat not in categories:
                categories[cat] = {"count": 0, "products": []}
            categories[cat]["count"] += 1
            categories[cat]["products"].append(p.get("name"))
        return {
            "totalProducts": len(products),
            "categories": categories,
            "products": [serialize_product(p) for p in products],
        }

    def find_product_by_name(self, name: str) -> Optional[dict]:
        from app.utils.units import normalize_product_name
        normalized = normalize_product_name(name)
        # Exact match first
        p = self.products.find_one({"userId": self.user_id, "normalizedName": normalized})
        if p:
            return serialize_product(p)
        # Fuzzy match
        p = self.products.find_one({
            "userId": self.user_id,
            "normalizedName": {"$regex": normalized, "$options": "i"}
        })
        return serialize_product(p) if p else None
