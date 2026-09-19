"""VaaniStock — Unit normalization utilities"""

UNIT_ALIASES = {
    # Pieces
    "piece": "pieces", "pc": "pieces", "pcs": "pieces", "pice": "pieces",
    "no": "pieces", "nos": "pieces", "number": "pieces", "item": "pieces", "items": "pieces",
    # Kilograms
    "kg": "kg", "kgs": "kg", "kilogram": "kg", "kilograms": "kg", "kilo": "kg",
    # Grams
    "g": "g", "gm": "g", "gms": "g", "gram": "g", "grams": "g",
    # Bags
    "bag": "bags", "bags": "bags", "bori": "bags", "boree": "bags", "bori": "bags",
    "theli": "bags", "basta": "bags", "boriya": "bags",
    # Cartons
    "carton": "cartons", "cartons": "cartons", "ctn": "cartons", "ctns": "cartons",
    "cartoon": "cartons",
    # Boxes
    "box": "boxes", "boxes": "boxes", "dabba": "boxes",
    # Dozens
    "dozen": "dozens", "dozens": "dozens", "doz": "dozens", "darjan": "dozens",
    # Litres
    "litre": "litres", "litres": "litres", "liter": "litres", "liters": "litres",
    "l": "litres", "ltr": "litres", "ltrs": "litres",
    # Millilitres
    "ml": "ml", "millilitre": "ml", "milliliter": "ml",
    # Quintals
    "quintal": "quintals", "quintals": "quintals", "qtl": "quintals",
    # Tonnes
    "tonne": "tonnes", "tonnes": "tonnes", "ton": "tonnes", "tons": "tonnes", "mt": "tonnes",
    # Packets
    "packet": "packets", "packets": "packets", "pack": "packets", "packs": "packets",
    "pkt": "packets", "pkts": "packets",
    # Bottles
    "bottle": "bottles", "bottles": "bottles", "btl": "bottles", "btls": "bottles",
    # Bundles
    "bundle": "bundles", "bundles": "bundles",
    # Rolls
    "roll": "rolls", "rolls": "rolls",
    # Sheets
    "sheet": "sheets", "sheets": "sheets",
    # Trays
    "tray": "trays", "trays": "trays",
}

VALID_UNITS = set(UNIT_ALIASES.values())


def normalize_unit(unit: str) -> str:
    """Normalize a unit string to a canonical form."""
    if not unit:
        return "pieces"
    cleaned = unit.lower().strip()
    return UNIT_ALIASES.get(cleaned, cleaned)


def is_valid_unit(unit: str) -> bool:
    """Check if a unit is valid after normalization."""
    normalized = normalize_unit(unit)
    return normalized in VALID_UNITS or unit.lower().strip() in UNIT_ALIASES


def get_unit_suggestions(partial: str) -> list:
    """Get unit suggestions for autocomplete."""
    partial_lower = partial.lower()
    return [u for u in sorted(VALID_UNITS) if partial_lower in u]


def normalize_product_name(name: str) -> str:
    """Create a normalized (searchable) product name."""
    return name.lower().strip()
