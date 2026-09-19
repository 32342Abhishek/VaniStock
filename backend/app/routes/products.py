"""VaaniStock — Products Routes"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.utils.auth import get_current_user_id
from app.schemas.schemas import ProductCreate, ProductUpdate
from app.services.inventory_service import InventoryService
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(
    search: str = Query(default=None),
    category: str = Query(default=None),
    status: str = Query(default=None),
    sort_by: str = Query(default="name"),
    sort_dir: int = Query(default=1),
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    products = svc.get_all_products(
        search=search, category=category, status=status,
        sort_by=sort_by, sort_dir=sort_dir
    )
    return {"success": True, "data": products, "count": len(products)}


@router.post("", status_code=201)
async def create_product(
    body: ProductCreate,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    try:
        product = svc.create_product(body.model_dump())
        return {"success": True, "message": "Product created", "data": product}
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail={"code": "PRODUCT_EXISTS", "message": f"Product '{body.name}' already exists"}
        )


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Product not found"}
        )
    return {"success": True, "data": product}


@router.patch("/{product_id}")
async def update_product(
    product_id: str,
    body: ProductUpdate,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    product = svc.update_product(product_id, body.model_dump(exclude_none=True))
    if not product:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Product not found"}
        )
    return {"success": True, "message": "Product updated", "data": product}


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Product not found"}
        )
    result = svc.delete_product_voice(product_id=product_id, source="MANUAL")
    return {"success": True, "message": result["message"], "data": {"transaction": result["transaction"]}}


@router.get("/{product_id}/history")
async def get_product_history(
    product_id: str,
    limit: int = Query(default=20),
    user_id: str = Depends(get_current_user_id),
):
    svc = InventoryService(user_id)
    # Verify product belongs to user
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Product not found"})
    txns = svc.get_transactions(limit=limit, product_id=product_id)
    return {"success": True, "data": txns}
