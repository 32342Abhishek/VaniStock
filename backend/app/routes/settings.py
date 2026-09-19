"""VaaniStock — Settings Routes"""
from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.auth import get_current_user_id
from app.schemas.schemas import UserSettingsUpdate
from app.database.mongodb import get_collection

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
async def get_settings(user_id: str = Depends(get_current_user_id)):
    col = get_collection("user_settings")
    settings = col.find_one({"userId": ObjectId(user_id)})
    if not settings:
        return {"success": True, "data": {"preferredLanguage": "en", "alertEnabled": True, "theme": "dark"}}
    settings.pop("_id", None)
    settings["userId"] = str(settings.get("userId", ""))
    if "createdAt" in settings and isinstance(settings["createdAt"], datetime):
        settings["createdAt"] = settings["createdAt"].isoformat()
    return {"success": True, "data": settings}


@router.patch("")
async def update_settings(
    body: UserSettingsUpdate,
    user_id: str = Depends(get_current_user_id),
):
    col = get_collection("user_settings")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updatedAt"] = datetime.now(timezone.utc)
    col.update_one(
        {"userId": ObjectId(user_id)},
        {"$set": updates},
        upsert=True
    )
    return {"success": True, "message": "Settings updated"}
