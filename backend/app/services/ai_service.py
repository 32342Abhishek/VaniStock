"""VaaniStock — AI Provider Abstraction Layer"""
import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings
from app.schemas.schemas import ParsedVoiceCommand, VoiceIntent
from app.utils.units import normalize_unit

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Base Provider
# ─────────────────────────────────────────────
class AIProvider(ABC):
    @abstractmethod
    async def parse_inventory_command(
        self,
        text: str,
        language: Optional[str] = None
    ) -> ParsedVoiceCommand:
        pass

    @property
    def provider_name(self) -> str:
        return "unknown"

    @property
    def is_demo_mode(self) -> bool:
        return False


# ─────────────────────────────────────────────
# Rule-Based Provider (always available)
# ─────────────────────────────────────────────
class RuleBasedProvider(AIProvider):
    """
    Deterministic parser for common inventory commands.
    Supports: English, Hinglish, basic Hindi & Telugu patterns.
    Always available — no API key required.
    """

    INTENT_PATTERNS = {
        VoiceIntent.ADD_STOCK: [
            r'\b(add|added|adding|added to|add to stock)\b',
            r'\b(add karo|add kar|add kar do|jodo|jod do|daalo|daal do|daal|jama karo)\b',
            r'\b(stock mein daalo|stock me daalo|stock add|stock me jodo|stock mein jodo)\b',
            r'\b(stock in|stockin|restock|restocking|received|receive|bought|buy|purchase)\b',
            r'\b(cheyyi|add cheyyi|lo add cheyyi|add chesuko|weseyyi)\b',
            r'\b(left side|left mein|left side karo|left pe|left side daalo)\b',
            r'\b(andar karo|andar daalo|andar le aao|lao|le aao|mangvao)\b',
            r'\b(mil gaya|aaya|aa gaya|pahuncha|pahunch gaya)\b',
        ],
        VoiceIntent.REMOVE_STOCK: [
            r'\b(remove|removed|removing|sold|sell|selling|take out|deduct|reduce)\b',
            r'\b(hata do|hatao|hata|nikalo|nikaalo|ghataao|ghata do|kam karo|kam kar do)\b',
            r'\b(stock se hatao|bech do|becha|bech|gaya|de do|de diya)\b',
            r'\b(stock out|stockout|issue karo|issue kar|dispatch karo)\b',
            r'\b(tiveyyi|tisiveyyi|remove cheyyi|pampinchu|pampincheyyi)\b',
            r'\b(right side|right mein|right side karo|right pe|bahar karo|bahar nikalo)\b',
            r'\b(gaya|le gaya|le liya|nikla|nikal gaya|khatam|use kiya|use hua)\b',
        ],
        VoiceIntent.CREATE_PRODUCT: [
            r'\b(create|create a|create new|add new product|new product|create product)\b',
            r'\b(naya product|naya item|nayi cheez|register karo|register kar)\b',
            r'\b(kottaga add|kottaga create|new item add)\b',
        ],
        VoiceIntent.DELETE_PRODUCT: [
            r'\b(delete product|remove product|delete item|permanently delete)\b',
            r'\b(permanently remove|completely remove|delete from inventory)\b',
            r'\b(hatao permanently|hamesha ke liye hatao|delete kar do)\b',
            r'\b(delete cheyyi|permanent ga delete)\b',
        ],
        VoiceIntent.STOCK_QUERY: [
            r'\b(how much|how many|kitna|kitne|available|check stock|stock check|kuch hai)\b',
            r'\b(enta|entha|stock lo enta|undi|undhi|stock mein kitna)\b',
            r'\b(remaining|left|balance|bachi|bacha|bache|kya baki hai)\b',
            r'\b(show me|dikhao|dekho|batao|bata do|kya hai|kya stock hai)\b',
        ],
        VoiceIntent.LOW_STOCK_QUERY: [
            r'\b(low stock|running low|less stock|kam stock|kya kam hai|alert)\b',
            r'\b(konsa|kaunsa|which products|low mein|warning|low hai)\b',
            r'\b(khatam ho raha|khatam hone wala|khatam near|warning products)\b',
        ],
        VoiceIntent.REORDER_QUERY: [
            r'\b(reorder|re-order|order karna|mangvana|purchase|order chahiye)\b',
            r'\b(should i order|kya order karu|restock karna|order karo)\b',
        ],
        VoiceIntent.INVENTORY_SUMMARY: [
            r'\b(summary|all products|show stock|stock dikhao|all stock|pura stock)\b',
            r'\b(inventory|stock list|list karo|sabka stock|total stock)\b',
        ],
        VoiceIntent.PRODUCT_SEARCH: [
            r'\b(find|search|dhundo|dhundho|locate|where is|kahan hai|kahan rakha)\b',
        ],
        VoiceIntent.NAVIGATE: [
            r'\b(go to|open|show me|take me to|navigate to|switch to)\b',
            r'\b(le chalo|kholo|dikhao|page par jao)\b',
            r'\b(vellu|chupeenchu|teeyandi)\b',
        ],
        VoiceIntent.HELP: [
            r'\b(help|madad|sahayata|assist|commands|kya karna hai|kaise)\b',
        ],
    }

    # Number words in Hindi/Telugu
    NUMBER_WORDS = {
        "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5, "chhe": 6, "saat": 7,
        "aath": 8, "nau": 9, "das": 10, "bees": 20, "tees": 30, "chaalees": 40,
        "pachaas": 50, "saath": 70, "assi": 80, "nabbe": 90, "sau": 100,
        "oka": 1, "rendu": 2, "moodu": 3, "naalugu": 4, "aaidu": 5,
        "aaru": 6, "edu": 7, "enimidi": 8, "tommidi": 9, "padi": 10,
    }

    def _extract_number(self, text: str) -> Optional[float]:
        """Extract numeric quantity from text."""
        # Direct number
        match = re.search(r'\b(\d+(?:\.\d+)?)\b', text)
        if match:
            return float(match.group(1))
        # Number words
        text_lower = text.lower()
        for word, val in self.NUMBER_WORDS.items():
            if re.search(r'\b' + word + r'\b', text_lower):
                return float(val)
        return None

    def _extract_unit(self, text: str) -> Optional[str]:
        """Extract unit from text."""
        units = [
            "bags", "bag", "bori", "cartons", "carton", "boxes", "box",
            "packets", "packet", "bottles", "bottle", "dozens", "dozen",
            "kg", "kgs", "grams", "gram", "litres", "liters", "litre", "liter",
            "ml", "pieces", "piece", "pcs", "pc", "quintals", "quintal",
            "tonnes", "tonne", "bundles", "bundle", "rolls", "roll",
        ]
        text_lower = text.lower()
        for unit in units:
            if re.search(r'\b' + unit + r'\b', text_lower):
                return normalize_unit(unit)
        return None

    def _extract_product(self, text: str, intent: VoiceIntent) -> Optional[str]:
        """Heuristic product name (or destination) extraction."""
        text_clean = re.sub(r'\d+(?:\.\d+)?', '', text)

        # For navigation, extract the destination page
        if intent == VoiceIntent.NAVIGATE:
            text_lower = text.lower()
            destinations = [
                "dashboard", "inventory", "add product", "transactions",
                "alerts", "reports", "voice", "settings", "home"
            ]
            for dest in destinations:
                if dest in text_lower:
                    return dest
            if "home" in text_lower or "main" in text_lower:
                return "dashboard"
            return None

        # Common filler words to remove
        fillers = [
            'add', 'remove', 'create', 'delete', 'permanently', 'karo', 'kar', 'do', 'hata',
            'hatao', 'nikalo', 'stock', 'mein', 'me', 'se', 'ka', 'ke', 'ki', 'cheyyi', 'lo',
            'add karo', 'hata do', 'kitna', 'kitne', 'how much', 'how many',
            'new', 'naya', 'nayi', 'product', 'item', 'completely',
            # units
            'bags', 'bag', 'carton', 'cartons', 'packet', 'packets', 'bottle',
            'bottles', 'box', 'boxes', 'kg', 'grams', 'gram', 'litres', 'liters',
            'pieces', 'piece', 'pcs', 'pc', 'dozen', 'quintal', 'tonne', 'bundle',
            'bori', 'boree',
            # directional/action terms
            'right', 'left', 'side', 'right side', 'left side', 'andar', 'bahar',
            'pe', 'par', 'ko', 'ne', 'wala', 'wali', 'wale',
            'daal', 'daalo', 'jod', 'jodo', 'nikal', 'issue',
            'called', 'with', 'a',
        ]
        for filler in fillers:
            text_clean = re.sub(r'\b' + re.escape(filler) + r'\b', '', text_clean, flags=re.IGNORECASE)

        # Remove trailing/leading punctuation and whitespace
        product = re.sub(r'\s+', ' ', text_clean).strip().strip('.,!?').strip()
        # Capitalize words
        if product and len(product) > 1:
            return ' '.join(w.capitalize() for w in product.split())
        return None

    def _detect_language(self, text: str) -> str:
        hindi_markers = ['karo', 'kitna', 'kitne', 'hai', 'mein', 'ke', 'ka', 'ki',
                         'hata', 'nikalo', 'daalo', 'chahiye', 'bacha']
        telugu_markers = ['cheyyi', 'lo', 'enta', 'entha', 'undhi', 'tiveyyi',
                          'rendu', 'moodu', 'padi']
        devanagari = re.search(r'[\u0900-\u097F]', text)
        telugu_script = re.search(r'[\u0C00-\u0C7F]', text)

        if devanagari:
            return "hi"
        if telugu_script:
            return "te"

        text_lower = text.lower()
        hindi_score = sum(1 for w in hindi_markers if re.search(r'\b' + w + r'\b', text_lower))
        telugu_score = sum(1 for w in telugu_markers if re.search(r'\b' + w + r'\b', text_lower))

        if hindi_score > 0 and telugu_score > 0:
            return "hinglish"
        if hindi_score > 0:
            return "hinglish"
        if telugu_score > 0:
            return "telugu-english"
        return "en"

    def _detect_intent(self, text: str) -> VoiceIntent:
        text_lower = text.lower()

        # DELETE_PRODUCT: "delete X" without a quantity = delete product (not remove stock)
        if re.search(
            r'\b(permanently delete|permanently remove|delete product'
            r'|delete item|hamesha ke liye|delete cheyyi)\b',
            text_lower, re.IGNORECASE
        ):
            return VoiceIntent.DELETE_PRODUCT

        # "delete X" alone (no quantity number) → DELETE_PRODUCT
        if re.search(r'\bdelete\b', text_lower, re.IGNORECASE) and not re.search(r'\b\d+\b', text_lower):
            return VoiceIntent.DELETE_PRODUCT

        # CREATE_PRODUCT
        if re.search(r'\b(create|new product|create product|create a|add new)\b', text_lower, re.IGNORECASE):
            return VoiceIntent.CREATE_PRODUCT

        # Explicit stock-check patterns should take precedence over generic add/remove actions
        if (
            re.search(
                r'\b(kitna|kitne|how much|how many|kya|baki|remaining|left|available|hai)\b',
                text_lower, re.IGNORECASE
            )
            and re.search(
                r'\b(stock|inventory|available|bache|bachi|hai)\b',
                text_lower, re.IGNORECASE
            )
        ):
            return VoiceIntent.STOCK_QUERY

        scores = {}
        for intent, patterns in self.INTENT_PATTERNS.items():
            score = sum(1 for p in patterns if re.search(p, text_lower, re.IGNORECASE))
            if score > 0:
                scores[intent] = score

        if not scores:
            # Check for question words without other matches
            if re.search(r'\b(how|what|which|kitna|kya|kaun)\b', text_lower, re.IGNORECASE):
                return VoiceIntent.STOCK_QUERY
            return VoiceIntent.UNKNOWN

        return max(scores, key=scores.get)

    async def parse_inventory_command(
        self,
        text: str,
        language: Optional[str] = None
    ) -> ParsedVoiceCommand:
        intent = self._detect_intent(text)
        quantity = self._extract_number(text)
        unit = self._extract_unit(text)
        product = self._extract_product(text, intent)
        lang = language or self._detect_language(text)

        requires_clarification = False
        clarification_msg = None
        confidence = 0.75

        if intent in (VoiceIntent.ADD_STOCK, VoiceIntent.REMOVE_STOCK):
            if not quantity:
                requires_clarification = True
                clarification_msg = "How much quantity would you like to update?"
                confidence = 0.50
            elif not product:
                requires_clarification = True
                clarification_msg = "Which product are you referring to?"
                confidence = 0.50
            else:
                confidence = 0.80
        elif intent == VoiceIntent.CREATE_PRODUCT:
            if not product:
                requires_clarification = True
                clarification_msg = "What is the name of the product you want to create?"
                confidence = 0.50
            else:
                confidence = 0.75
        elif intent == VoiceIntent.DELETE_PRODUCT:
            if not product:
                requires_clarification = True
                clarification_msg = "Which product do you want to delete?"
                confidence = 0.50
            else:
                confidence = 0.80
        elif intent == VoiceIntent.STOCK_QUERY:
            confidence = 0.85 if product else 0.70
        elif intent == VoiceIntent.UNKNOWN:
            confidence = 0.20

        return ParsedVoiceCommand(
            intent=intent,
            productName=product,
            quantity=quantity,
            unit=unit,
            language=lang,
            confidence=confidence,
            requiresClarification=requires_clarification,
            clarificationMessage=clarification_msg,
        )

    @property
    def provider_name(self) -> str:
        return "rule_based"

    @property
    def is_demo_mode(self) -> bool:
        return True


# ─────────────────────────────────────────────
# Gemini AI Provider (new google-genai SDK)
# ─────────────────────────────────────────────
class GeminiProvider(AIProvider):
    """Google Gemini AI for multilingual NLP intent parsing.
    Uses the official google-genai SDK (google.genai).
    Falls back to old google.generativeai SDK if new one not available.
    """

    SYSTEM_PROMPT = """You are a multilingual inventory management AI assistant for Indian small businesses.
Parse the user's voice command and return ONLY valid JSON.

The user may speak in English, Hindi, Telugu, Hinglish (Hindi+English mix), or Telugu-English mix.

Return JSON with this exact structure:
{
  "intent": "ADD_STOCK|REMOVE_STOCK|CREATE_PRODUCT|DELETE_PRODUCT"
           "|STOCK_QUERY|LOW_STOCK_QUERY|REORDER_QUERY|INVENTORY_SUMMARY"
           "|PRODUCT_SEARCH|HELP|UNKNOWN",
  "productName": "string or null",
  "quantity": number or null,
  "unit": "string or null",
  "price": number or null,
  "language": "en|hi|te|hinglish|telugu-english",
  "confidence": 0.0-1.0,
  "requiresClarification": boolean,
  "clarificationMessage": "string or null"
}

Intent rules:
- ADD_STOCK: add/increase stock quantity of existing product (e.g. "add 20 bags of rice", "chawal ke 20 bag daalo")
- REMOVE_STOCK: reduce stock quantity of existing product (e.g. "remove 5 bags", "chawal ke 5 bag hatao")
- CREATE_PRODUCT: create a brand new product (e.g. "create new product rice", "naya product banao")
- DELETE_PRODUCT: permanently delete a product entirely (e.g. "delete rice", "rice ko hamesha ke liye hatao")
- STOCK_QUERY: check current stock of a product (e.g. "how much rice?", "chawal ka stock kitna hai?")
- LOW_STOCK_QUERY: show products with low/out of stock (e.g. "which products are low?", "kam stock wale")
- REORDER_QUERY: what needs to be reordered
- INVENTORY_SUMMARY: show all inventory summary

Multilingual product examples:
- rice = chawal (Hindi) = biyyam/biyyamu (Telugu) = chawal (Hinglish)
- Always return productName in English canonical form, properly capitalized

Rules:
- productName: Capitalize properly (e.g., "Rice", "Cooking Oil", "Atta")
- unit: Use English canonical forms (bags, kg, cartons, packets, litres, pieces, etc.)
- confidence: Be honest. Low if ambiguous.
- requiresClarification: true if quantity or product name is missing for mutation/delete intents
- Return ONLY the JSON object, no markdown, no explanation"""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self._client = None
        self._legacy_model = None
        self._model_name = model

        # Try new google-genai SDK first
        try:
            import google.genai as genai
            self._client = genai.Client(api_key=api_key)
            logger.info(f"Gemini provider initialized: google-genai SDK, model={model}")
        except (ImportError, Exception) as e:
            logger.warning(f"google.genai SDK unavailable ({e}), trying legacy google.generativeai")
            try:
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=api_key)
                self._legacy_model = genai_legacy.GenerativeModel(model)
                logger.info(f"Gemini provider initialized: legacy SDK, model={model}")
            except Exception as e2:
                raise RuntimeError(f"Could not initialize any Gemini SDK: {e2}") from e2

    async def parse_inventory_command(
        self,
        text: str,
        language: Optional[str] = None
    ) -> ParsedVoiceCommand:
        try:
            prompt = f"{self.SYSTEM_PROMPT}\n\nUser command: {text}"

            if self._client is not None:
                # New google-genai SDK — use async interface to avoid blocking event loop
                try:
                    response = await self._client.aio.models.generate_content(
                        model=self._model_name,
                        contents=prompt,
                    )
                except AttributeError:
                    # Older google-genai version without .aio — run in thread
                    import asyncio
                    response = await asyncio.to_thread(
                        self._client.models.generate_content,
                        model=self._model_name,
                        contents=prompt,
                    )
                raw = response.text.strip()
            elif self._legacy_model is not None:
                # Legacy google.generativeai SDK — use async method
                try:
                    response = await self._legacy_model.generate_content_async(prompt)
                except AttributeError:
                    # Very old version without async support — run in thread
                    import asyncio
                    response = await asyncio.to_thread(
                        self._legacy_model.generate_content, prompt
                    )
                raw = response.text.strip()
            else:
                raise RuntimeError("No Gemini client available")

            # Strip markdown fences if present
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)
            data = json.loads(raw)

            # Validate intent
            try:
                intent = VoiceIntent(data.get("intent", "UNKNOWN"))
            except ValueError:
                intent = VoiceIntent.UNKNOWN

            # Normalize unit if present
            unit = data.get("unit")
            if unit:
                unit = normalize_unit(unit)

            return ParsedVoiceCommand(
                intent=intent,
                productName=data.get("productName"),
                quantity=data.get("quantity"),
                unit=unit,
                price=data.get("price"),
                language=data.get("language", language or "en"),
                confidence=float(data.get("confidence", 0.8)),
                requiresClarification=bool(data.get("requiresClarification", False)),
                clarificationMessage=data.get("clarificationMessage"),
            )
        except Exception as e:
            logger.error("Gemini parsing failed; using rule-based fallback (%s)", type(e).__name__)
            # Fall back to rule-based — never crash the app
            fallback = RuleBasedProvider()
            return await fallback.parse_inventory_command(text, language)

    @property
    def provider_name(self) -> str:
        return f"gemini:{self._model_name}"

    @property
    def is_demo_mode(self) -> bool:
        return False


# ─────────────────────────────────────────────
# Provider Factory
# ─────────────────────────────────────────────
def get_ai_provider() -> AIProvider:
    """Return the configured AI provider, falling back to rule-based."""
    provider = settings.AI_PROVIDER.lower()
    api_key = settings.AI_API_KEY

    if provider in ("google", "gemini"):
        if api_key and api_key.strip():
            try:
                model = settings.AI_MODEL or "gemini-1.5-flash"
                return GeminiProvider(api_key=api_key, model=model)
            except Exception as e:
                logger.warning(
                    f"Failed to initialize Gemini ({type(e).__name__}). "
                    "Using rule-based fallback."
                )
        else:
            logger.warning("AI_PROVIDER=%s but AI_API_KEY is not configured; using rule-based fallback.", provider)

    return RuleBasedProvider()


# Singleton cache
_ai_provider: Optional[AIProvider] = None


def ai_provider() -> AIProvider:
    """Return the configured AI provider (cached singleton)."""
    global _ai_provider
    if _ai_provider is None:
        _ai_provider = get_ai_provider()
    return _ai_provider


def reset_ai_provider():
    """Force re-initialization (call after env changes in dev)."""
    global _ai_provider
    _ai_provider = None
