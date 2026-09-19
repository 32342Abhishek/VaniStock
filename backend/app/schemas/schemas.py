"""VaaniStock — Pydantic Schemas"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any
from enum import Enum


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────
class VoiceIntent(str, Enum):
    ADD_STOCK = "ADD_STOCK"
    REMOVE_STOCK = "REMOVE_STOCK"
    CREATE_PRODUCT = "CREATE_PRODUCT"
    DELETE_PRODUCT = "DELETE_PRODUCT"
    STOCK_QUERY = "STOCK_QUERY"
    LOW_STOCK_QUERY = "LOW_STOCK_QUERY"
    REORDER_QUERY = "REORDER_QUERY"
    INVENTORY_SUMMARY = "INVENTORY_SUMMARY"
    PRODUCT_SEARCH = "PRODUCT_SEARCH"
    NAVIGATE = "NAVIGATE"
    HELP = "HELP"
    UNKNOWN = "UNKNOWN"


class TransactionAction(str, Enum):
    ADD = "ADD"
    REMOVE = "REMOVE"


class TransactionSource(str, Enum):
    VOICE = "VOICE"
    MANUAL = "MANUAL"


class StockStatus(str, Enum):
    HEALTHY = "HEALTHY"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


# ─────────────────────────────────────────────
# Auth Schemas
# ─────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    businessName: str = Field(..., min_length=2, max_length=200)
    preferredLanguage: str = Field(default="en", pattern="^(en|hi|te)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    success: bool = True
    token: str
    user: dict


# ─────────────────────────────────────────────
# Product Schemas
# ─────────────────────────────────────────────
class SupplierInfo(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = "General"
    description: Optional[str] = None
    sku: Optional[str] = None
    unit: str = Field(..., min_length=1, max_length=50)
    quantity: float = Field(default=0, ge=0)
    purchasePrice: Optional[float] = Field(default=None, ge=0)
    sellingPrice: Optional[float] = Field(default=None, ge=0)
    lowStockThreshold: float = Field(default=5, ge=0)
    reorderQuantity: float = Field(default=10, ge=0)
    supplier: Optional[SupplierInfo] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    unit: Optional[str] = None
    purchasePrice: Optional[float] = Field(default=None, ge=0)
    sellingPrice: Optional[float] = Field(default=None, ge=0)
    lowStockThreshold: Optional[float] = Field(default=None, ge=0)
    reorderQuantity: Optional[float] = Field(default=None, ge=0)
    supplier: Optional[SupplierInfo] = None


# ─────────────────────────────────────────────
# Inventory Schemas
# ─────────────────────────────────────────────
class StockMutateRequest(BaseModel):
    productId: str
    action: TransactionAction
    quantity: float = Field(..., gt=0)
    unit: Optional[str] = None
    source: TransactionSource = TransactionSource.MANUAL
    transcript: Optional[str] = None
    requestId: Optional[str] = None  # For idempotency


class StockInRequest(BaseModel):
    productId: str
    quantity: float = Field(..., gt=0)
    unit: Optional[str] = None
    requestId: Optional[str] = None


class StockOutRequest(BaseModel):
    productId: str
    quantity: float = Field(..., gt=0)
    unit: Optional[str] = None
    requestId: Optional[str] = None


# ─────────────────────────────────────────────
# Voice Schemas
# ─────────────────────────────────────────────
class VoiceParseRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=2000)
    language: Optional[str] = None


class ParsedVoiceCommand(BaseModel):
    intent: VoiceIntent
    productName: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    language: str = "en"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    requiresClarification: bool = False
    clarificationMessage: Optional[str] = None


class VoiceConfirmRequest(BaseModel):
    commandId: Optional[str] = None
    transcript: str
    intent: VoiceIntent
    productId: Optional[str] = None          # Optional for DELETE_PRODUCT (resolved on backend)
    productName: Optional[str] = None        # Optional for DELETE_PRODUCT voice flow
    quantity: Optional[float] = Field(default=None, gt=0)  # Optional for DELETE_PRODUCT
    unit: Optional[str] = None               # Optional for DELETE_PRODUCT
    requestId: Optional[str] = None
    confirmed: bool = False                  # For delete confirmation: False = ask, True = execute
    source: TransactionSource = TransactionSource.VOICE


class VoiceQueryRequest(BaseModel):
    transcript: str
    intent: VoiceIntent
    productName: Optional[str] = None
    language: Optional[str] = "en"


# ─────────────────────────────────────────────
# Settings Schemas
# ─────────────────────────────────────────────
class UserSettingsUpdate(BaseModel):
    preferredLanguage: Optional[str] = Field(default=None, pattern="^(en|hi|te)$")
    alertEnabled: Optional[bool] = None
    theme: Optional[str] = Field(default=None, pattern="^(light|dark)$")


# ─────────────────────────────────────────────
# Standard API Response
# ─────────────────────────────────────────────
class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None


class APIError(BaseModel):
    success: bool = False
    error: dict
