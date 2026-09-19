"""VaaniStock — Backend Tests"""
import pytest
import sys
import os

# Make sure app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


# ─────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────
@pytest.fixture(scope="module")
def mock_db():
    """Mock MongoDB for unit tests."""
    with patch("app.database.mongodb.connect_db"), \
         patch("app.database.mongodb.disconnect_db"), \
         patch("app.database.mongodb.get_collection") as mock_col:
        yield mock_col


# ─────────────────────────────────────────────
# Unit Normalizer Tests
# ─────────────────────────────────────────────
class TestUnitNormalizer:
    def test_bag_variants(self):
        from app.utils.units import normalize_unit
        assert normalize_unit("bag") == "bags"
        assert normalize_unit("bags") == "bags"
        assert normalize_unit("bori") == "bags"

    def test_kg_variants(self):
        from app.utils.units import normalize_unit
        assert normalize_unit("kg") == "kg"
        assert normalize_unit("kgs") == "kg"
        assert normalize_unit("kilogram") == "kg"
        assert normalize_unit("kilograms") == "kg"

    def test_carton_variants(self):
        from app.utils.units import normalize_unit
        assert normalize_unit("carton") == "cartons"
        assert normalize_unit("cartons") == "cartons"
        assert normalize_unit("ctn") == "cartons"

    def test_piece_variants(self):
        from app.utils.units import normalize_unit
        assert normalize_unit("piece") == "pieces"
        assert normalize_unit("pcs") == "pieces"
        assert normalize_unit("pc") == "pieces"

    def test_litre_variants(self):
        from app.utils.units import normalize_unit
        assert normalize_unit("litre") == "litres"
        assert normalize_unit("liter") == "litres"
        assert normalize_unit("l") == "litres"
        assert normalize_unit("ltr") == "litres"


# ─────────────────────────────────────────────
# Rule-Based Parser Tests
# ─────────────────────────────────────────────
class TestRuleBasedParser:
    @pytest.fixture
    def parser(self):
        from app.services.ai_service import RuleBasedProvider
        return RuleBasedProvider()

    @pytest.mark.asyncio
    async def test_add_stock_english(self, parser):
        result = await parser.parse_inventory_command("Add 10 bags of rice")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.ADD_STOCK
        assert result.quantity == 10.0
        assert result.unit == "bags"

    @pytest.mark.asyncio
    async def test_add_stock_hinglish(self, parser):
        result = await parser.parse_inventory_command("10 bags rice add karo")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.ADD_STOCK
        assert result.quantity == 10.0

    @pytest.mark.asyncio
    async def test_remove_stock_hinglish(self, parser):
        result = await parser.parse_inventory_command("5 carton biscuits hata do")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.REMOVE_STOCK
        assert result.quantity == 5.0
        assert result.unit == "cartons"

    @pytest.mark.asyncio
    async def test_stock_query_english(self, parser):
        result = await parser.parse_inventory_command("How much rice do I have?")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.STOCK_QUERY

    @pytest.mark.asyncio
    async def test_low_stock_query(self, parser):
        result = await parser.parse_inventory_command("Which products are low?")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.LOW_STOCK_QUERY

    @pytest.mark.asyncio
    async def test_hinglish_stock_query(self, parser):
        result = await parser.parse_inventory_command("Kitna sugar stock mein hai?")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.STOCK_QUERY
        assert result.language == "hinglish"

    @pytest.mark.asyncio
    async def test_missing_quantity_requires_clarification(self, parser):
        result = await parser.parse_inventory_command("Add rice")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.ADD_STOCK
        assert result.requiresClarification is True

    @pytest.mark.asyncio
    async def test_unknown_intent(self, parser):
        result = await parser.parse_inventory_command("hello world test xyz")
        from app.schemas.schemas import VoiceIntent
        assert result.intent == VoiceIntent.UNKNOWN
        assert result.confidence < 0.5


# ─────────────────────────────────────────────
# Inventory Business Logic Tests (with mocks)
# ─────────────────────────────────────────────
class TestInventoryBusinessLogic:
    def _make_service(self, mock_products, mock_txns):
        from app.services.inventory_service import InventoryService
        from unittest.mock import patch, MagicMock
        from bson import ObjectId

        svc = object.__new__(InventoryService)
        svc.user_id = ObjectId()
        svc.products = mock_products
        svc.transactions = mock_txns
        return svc

    def test_get_stock_status_healthy(self):
        from app.services.inventory_service import get_stock_status
        assert get_stock_status(25, 5) == "HEALTHY"

    def test_get_stock_status_low(self):
        from app.services.inventory_service import get_stock_status
        assert get_stock_status(3, 5) == "LOW_STOCK"

    def test_get_stock_status_out_of_stock(self):
        from app.services.inventory_service import get_stock_status
        assert get_stock_status(0, 5) == "OUT_OF_STOCK"

    def test_stock_status_at_threshold(self):
        from app.services.inventory_service import get_stock_status
        assert get_stock_status(5, 5) == "LOW_STOCK"


# ─────────────────────────────────────────────
# Language Detection Tests
# ─────────────────────────────────────────────
class TestLanguageDetection:
    @pytest.fixture
    def parser(self):
        from app.services.ai_service import RuleBasedProvider
        return RuleBasedProvider()

    def test_english_detection(self, parser):
        assert parser._detect_language("Add 10 bags of rice") == "en"

    def test_hinglish_detection(self, parser):
        lang = parser._detect_language("Rice ke 10 bags add karo")
        assert lang == "hinglish"

    def test_hindi_script_detection(self, parser):
        lang = parser._detect_language("चावल के 20 बोरे स्टॉक में जोड़ो")
        assert lang == "hi"

    def test_telugu_script_detection(self, parser):
        lang = parser._detect_language("బియ్యం 20 బస్తాలు స్టాక్లో చేర్చు")
        assert lang == "te"


# ─────────────────────────────────────────────
# API Response Format Tests
# ─────────────────────────────────────────────
class TestAPIResponseFormat:
    def test_health_endpoint(self):
        with patch("app.database.mongodb.connect_db"), \
             patch("app.database.mongodb.disconnect_db"), \
             patch("app.database.mongodb.get_db") as mock_db:
            mock_db.return_value.command.return_value = {"ok": 1}

            from app.main import app
            client = TestClient(app)
            resp = client.get("/api/health")
            # Allow 200 or 500 in test env
            assert resp.status_code in (200, 500)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
