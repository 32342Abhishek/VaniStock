"""VaaniStock — Authentication Routes"""
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timezone
from app.database.mongodb import get_collection
from app.schemas.schemas import RegisterRequest, LoginRequest
from app.utils.auth import hash_password, verify_password, create_token, get_current_user
from app.services.seeder import seed_demo_data

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    users = get_collection("users")
    settings_col = get_collection("user_settings")

    # Check duplicate email
    if users.find_one({"email": body.email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists"}
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": body.name,
        "email": body.email,
        "passwordHash": hash_password(body.password),
        "businessName": body.businessName,
        "preferredLanguage": body.preferredLanguage,
        "createdAt": now,
        "updatedAt": now,
    }

    result = users.insert_one(user_doc)
    user_id = result.inserted_id

    # Create default settings
    settings_col.insert_one({
        "userId": user_id,
        "preferredLanguage": body.preferredLanguage,
        "alertEnabled": True,
        "theme": "dark",
        "createdAt": now,
    })

    # Seed demo data
    seed_demo_data(user_id)

    token = create_token(str(user_id), body.email)

    return {
        "success": True,
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": str(user_id),
            "name": body.name,
            "email": body.email,
            "businessName": body.businessName,
            "preferredLanguage": body.preferredLanguage,
        }
    }


@router.post("/login")
async def login(body: LoginRequest):
    users = get_collection("users")
    user = users.find_one({"email": body.email})

    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        )

    token = create_token(str(user["_id"]), user["email"])

    return {
        "success": True,
        "message": "Logged in successfully",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "businessName": user.get("businessName"),
            "preferredLanguage": user.get("preferredLanguage", "en"),
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    users = get_collection("users")
    user = users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "data": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "businessName": user.get("businessName"),
            "preferredLanguage": user.get("preferredLanguage", "en"),
        }
    }
