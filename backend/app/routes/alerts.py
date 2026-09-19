"""VaaniStock — Alerts Routes"""
from fastapi import APIRouter, Depends
from app.utils.auth import get_current_user_id
from app.services.inventory_service import InventoryService, get_stock_status

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def get_alerts(user_id: str = Depends(get_current_user_id)):
    svc = InventoryService(user_id)
    low_products = svc.get_low_stock_products()

    alerts = []
    for p in low_products:
        alert_type = "OUT_OF_STOCK" if p["quantity"] == 0 else "LOW_STOCK"
        alerts.append({
            "type": alert_type,
            "severity": "critical" if alert_type == "OUT_OF_STOCK" else "warning",
            "productId": p["id"],
            "productName": p["name"],
            "quantity": p["quantity"],
            "unit": p["unit"],
            "threshold": p.get("lowStockThreshold"),
            "reorderQuantity": p.get("reorderQuantity"),
            "status": p["status"],
        })

    return {
        "success": True,
        "data": alerts,
        "count": len(alerts),
        "summary": {
            "outOfStock": sum(1 for a in alerts if a["type"] == "OUT_OF_STOCK"),
            "lowStock": sum(1 for a in alerts if a["type"] == "LOW_STOCK"),
        }
    }
