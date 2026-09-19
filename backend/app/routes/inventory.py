"""VaaniStock — Inventory Routes"""
from fastapi import APIRouter, HTTPException, Depends, Query
from app.utils.auth import get_current_user_id
from app.schemas.schemas import StockMutateRequest, StockInRequest, StockOutRequest
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/stock-in")
async def stock_in(
    body: StockInRequest,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    try:
        result = svc.stock_in(
            product_id=body.productId,
            quantity=body.quantity,
            unit=body.unit,
            source="MANUAL",
            request_id=body.requestId,
        )
        return {"success": True, "message": result["message"], "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"code": "VALIDATION_ERROR", "message": str(e)})


@router.post("/stock-out")
async def stock_out(
    body: StockOutRequest,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    try:
        result = svc.stock_out(
            product_id=body.productId,
            quantity=body.quantity,
            unit=body.unit,
            source="MANUAL",
            request_id=body.requestId,
        )
        return {"success": True, "message": result["message"], "data": result}
    except ValueError as e:
        code = "INSUFFICIENT_STOCK" if "Insufficient" in str(e) else "VALIDATION_ERROR"
        raise HTTPException(status_code=400, detail={"code": code, "message": str(e)})


@router.post("/mutate")
async def mutate(
    body: StockMutateRequest,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    try:
        if body.action.value == "ADD":
            result = svc.stock_in(
                product_id=body.productId,
                quantity=body.quantity,
                unit=body.unit,
                source=body.source.value,
                transcript=body.transcript,
                request_id=body.requestId,
            )
        else:
            result = svc.stock_out(
                product_id=body.productId,
                quantity=body.quantity,
                unit=body.unit,
                source=body.source.value,
                transcript=body.transcript,
                request_id=body.requestId,
            )
        return {"success": True, "message": result["message"], "data": result}
    except ValueError as e:
        code = "INSUFFICIENT_STOCK" if "Insufficient" in str(e) else "VALIDATION_ERROR"
        raise HTTPException(status_code=400, detail={"code": code, "message": str(e)})


@router.get("/summary")
async def get_summary(user_id: str = Depends(get_current_user_id)):
    svc = InventoryService(user_id)
    return {"success": True, "data": svc.get_inventory_summary()}


@router.get("/low-stock")
async def get_low_stock(user_id: str = Depends(get_current_user_id)):
    svc = InventoryService(user_id)
    products = svc.get_low_stock_products()
    return {"success": True, "data": products, "count": len(products)}


@router.get("/dashboard")
async def get_dashboard(user_id: str = Depends(get_current_user_id)):
    svc = InventoryService(user_id)
    return {"success": True, "data": svc.get_dashboard_stats()}


@router.get("/query")
async def inventory_query(
    q: str = Query(..., description="Natural language query"),
    user_id: str = Depends(get_current_user_id),
):
    """Simple keyword-based inventory query endpoint."""
    svc = InventoryService(user_id)
    q_lower = q.lower()

    # Low stock query
    if any(kw in q_lower for kw in ["low", "kam", "alert", "threshold", "less"]):
        products = svc.get_low_stock_products()
        return {
            "success": True,
            "queryType": "LOW_STOCK",
            "data": products,
            "message": f"Found {len(products)} products with low/out-of-stock status"
        }

    # Summary
    if any(kw in q_lower for kw in ["all", "summary", "total", "list", "pura", "sab"]):
        summary = svc.get_inventory_summary()
        return {
            "success": True,
            "queryType": "SUMMARY",
            "data": summary,
            "message": f"You have {summary['totalProducts']} products"
        }

    # Reorder
    if any(kw in q_lower for kw in ["reorder", "order", "purchase", "buy"]):
        products = svc.get_low_stock_products()
        reorder = [p for p in products if p.get("reorderQuantity")]
        return {
            "success": True,
            "queryType": "REORDER",
            "data": reorder,
            "message": f"{len(reorder)} products need reordering"
        }

    # Product-specific query
    products_list = svc.get_all_products()
    matches = []
    words = q_lower.split()
    for p in products_list:
        name_lower = p["name"].lower()
        if any(word in name_lower for word in words if len(word) > 2):
            matches.append(p)

    if matches:
        return {
            "success": True,
            "queryType": "PRODUCT_QUERY",
            "data": matches,
            "message": f"Found {len(matches)} matching product(s)"
        }

    return {
        "success": True,
        "queryType": "NO_MATCH",
        "data": [],
        "message": "No matching products found"
    }
