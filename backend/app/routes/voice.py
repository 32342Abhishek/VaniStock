"""VaaniStock — Voice Routes"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.auth import get_current_user_id
from app.schemas.schemas import (
    VoiceParseRequest, VoiceConfirmRequest, VoiceQueryRequest, VoiceIntent
)
from app.services.ai_service import ai_provider
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.get("/provider")
async def get_voice_provider(user_id: str = Depends(get_current_user_id)):
    """Returns the current AI provider info."""
    provider = ai_provider()
    return {
        "success": True,
        "data": {
            "provider": provider.provider_name,
            "isDemoMode": provider.is_demo_mode,
        }
    }


@router.post("/parse")
async def parse_voice_command(
    body: VoiceParseRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Parse a voice transcript into a structured inventory command.
    This does NOT modify the database — only interprets the intent.
    """
    provider = ai_provider()
    parsed = await provider.parse_inventory_command(body.transcript, body.language)

    # Log to voice_commands
    from app.database.mongodb import get_collection
    vc_col = get_collection("voice_commands")
    doc = {
        "userId": ObjectId(user_id),
        "transcript": body.transcript,
        "language": parsed.language,
        "intent": parsed.intent,
        "parsedData": parsed.model_dump(),
        "confidence": parsed.confidence,
        "status": "PARSED",
        "createdAt": datetime.now(timezone.utc),
    }
    result = vc_col.insert_one(doc)
    command_id = str(result.inserted_id)

    # If mutation intent: try to resolve the product
    product_info = None
    if parsed.intent in (VoiceIntent.ADD_STOCK, VoiceIntent.REMOVE_STOCK):
        if parsed.productName:
            svc = InventoryService(user_id)
            product_info = svc.find_product_by_name(parsed.productName)

    return {
        "success": True,
        "data": {
            "commandId": command_id,
            "parsed": parsed.model_dump(),
            "product": product_info,
            "provider": provider.provider_name,
            "isDemoMode": provider.is_demo_mode,
        }
    }


@router.post("/confirm")
async def confirm_voice_command(
    body: VoiceConfirmRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Execute a confirmed voice inventory command.
    The AI only identified the intent — FastAPI validates and executes it.
    """
    from app.database.mongodb import get_collection

    svc = InventoryService(user_id)

    # Validate intent is a mutation intent
    if body.intent not in (
        VoiceIntent.ADD_STOCK, VoiceIntent.REMOVE_STOCK,
        VoiceIntent.CREATE_PRODUCT, VoiceIntent.DELETE_PRODUCT
    ):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_INTENT", "message": "Only ADD, REMOVE, CREATE, and DELETE can be confirmed"}
        )

    # Resolve deletes by either the selected product id or the parsed product name.
    # The frontend may not have an id when Gemini/rule-based parsing only returned a name.
    product = svc.get_product(body.productId) if body.productId else None
    if body.intent == VoiceIntent.DELETE_PRODUCT and not product and body.productName:
        product = svc.find_product_by_name(body.productName)
        if product:
            body.productId = product["id"]

    if not product and body.intent != VoiceIntent.CREATE_PRODUCT:
        raise HTTPException(
            status_code=404,
            detail={"code": "PRODUCT_NOT_FOUND", "message": f"{body.productName or 'That product'} is not available in your inventory."}
        )

    try:
        if body.intent == VoiceIntent.DELETE_PRODUCT:
            if not body.confirmed:
                # Just return a success saying it needs confirmation (handled by frontend)
                return {
                    "success": True,
                    "message": f"Are you sure you want to permanently delete {body.productName}?",
                    "data": {"needsConfirmation": True}
                }
            else:
                # Actually delete
                result = svc.delete_product_voice(
                    product_id=body.productId,
                    source="VOICE",
                    transcript=body.transcript,
                    request_id=body.requestId,
                )
        elif body.intent == VoiceIntent.CREATE_PRODUCT:
            result = svc.create_product_voice(
                name=body.productName,
                quantity=body.quantity,
                unit=body.unit,
                source="VOICE",
                transcript=body.transcript,
                request_id=body.requestId,
            )
        elif body.intent == VoiceIntent.ADD_STOCK:
            result = svc.stock_in(
                product_id=body.productId,
                quantity=body.quantity,
                unit=body.unit,
                source="VOICE",
                transcript=body.transcript,
                request_id=body.requestId,
            )
        else:
            result = svc.stock_out(
                product_id=body.productId,
                quantity=body.quantity,
                unit=body.unit,
                source="VOICE",
                transcript=body.transcript,
                request_id=body.requestId,
            )
    except ValueError as e:
        code = "INSUFFICIENT_STOCK" if "Insufficient" in str(e) else "VALIDATION_ERROR"
        raise HTTPException(
            status_code=400,
            detail={"code": code, "message": str(e)}
        )

    # Update voice command status
    if body.commandId:
        vc_col = get_collection("voice_commands")
        vc_col.update_one(
            {"_id": ObjectId(body.commandId)},
            {"$set": {
                "status": "CONFIRMED",
                "result": result["message"],
                "completedAt": datetime.now(timezone.utc),
            }}
        )

    return {
        "success": True,
        "message": result["message"],
        "data": {
            "transaction": result["transaction"],
            "product": result["product"],
            "alert": result.get("alert"),
        }
    }


@router.post("/query")
async def voice_query(
    body: VoiceQueryRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Handle read-only voice queries (STOCK_QUERY, LOW_STOCK_QUERY, etc.)
    Returns actual database data — never invents values.
    """
    svc = InventoryService(user_id)
    intent = body.intent

    if intent == VoiceIntent.LOW_STOCK_QUERY:
        products = svc.get_low_stock_products()
        if not products:
            msg = "All products are well-stocked! 🎉"
        else:
            names = ", ".join(p["name"] for p in products[:3])
            msg = f"{len(products)} products are low or out of stock: {names}"
        return {"success": True, "queryType": "LOW_STOCK_QUERY", "data": products, "message": msg}

    elif intent == VoiceIntent.REORDER_QUERY:
        products = svc.get_low_stock_products()
        if not products:
            msg = "No reordering needed right now."
        else:
            msg = f"You should reorder {len(products)} products."
        return {"success": True, "queryType": "REORDER_QUERY", "data": products, "message": msg}

    elif intent == VoiceIntent.INVENTORY_SUMMARY:
        summary = svc.get_inventory_summary()
        msg = f"You have {summary['totalProducts']} products in inventory."
        return {"success": True, "queryType": "INVENTORY_SUMMARY", "data": summary, "message": msg}

    elif intent == VoiceIntent.STOCK_QUERY:
        if body.productName:
            product = svc.find_product_by_name(body.productName)
            if product:
                msg = f"{product['name']}: {product['quantity']} {product['unit']} — {product['status']}"
                return {"success": True, "queryType": "STOCK_QUERY", "data": product, "message": msg}
            else:
                return {
                    "success": True, "queryType": "STOCK_QUERY", "data": None,
                    "message": f"'{body.productName}' not found in your inventory."
                }
        # General stock query
        products = svc.get_all_products()
        return {
            "success": True, "queryType": "STOCK_QUERY",
            "data": products, "message": f"Showing {len(products)} products"
        }

    elif intent == VoiceIntent.PRODUCT_SEARCH:
        if body.productName:
            product = svc.find_product_by_name(body.productName)
            msg = f"Found {product['name']}" if product else f"'{body.productName}' not found"
            return {"success": True, "queryType": "PRODUCT_SEARCH", "data": product, "message": msg}

    return {
        "success": True,
        "queryType": "HELP",
        "data": None,
        "message": (
            "You can say: 'Add 10 bags of Rice', 'Remove 5 cartons of Biscuits', "
            "'How much Rice do I have?', 'Which products are low?'"
        )
    }
