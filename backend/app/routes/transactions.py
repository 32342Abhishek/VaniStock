"""VaaniStock — Transactions Routes"""
from fastapi import APIRouter, Depends, Query
import csv
import io
from fastapi.responses import StreamingResponse
from app.utils.auth import get_current_user_id
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    limit: int = Query(default=50, le=200),
    skip: int = Query(default=0),
    action: str = Query(default=None),
    product_id: str = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    txns = svc.get_transactions(limit=limit, skip=skip, action=action, product_id=product_id)
    return {"success": True, "data": txns, "count": len(txns)}


@router.get("/export/csv")
async def export_csv(
    user_id: str = Depends(get_current_user_id),
):
    """Export all transactions as CSV."""
    svc = InventoryService(user_id)
    txns = svc.get_transactions(limit=1000)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "productName", "action", "quantity", "unit",
        "previousQuantity", "newQuantity", "source", "createdAt"
    ])
    writer.writeheader()
    for t in txns:
        writer.writerow({
            "id": t.get("id"),
            "productName": t.get("productName"),
            "action": t.get("action"),
            "quantity": t.get("quantity"),
            "unit": t.get("unit"),
            "previousQuantity": t.get("previousQuantity"),
            "newQuantity": t.get("newQuantity"),
            "source": t.get("source"),
            "createdAt": t.get("createdAt"),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vaanistock_transactions.csv"}
    )
