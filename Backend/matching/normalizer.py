"""
Text and attribute normalization for consistent product comparison.

Why this matters:
  "Colour: Black" vs "color: BLACK" should compare as equal.
  "model_number: XM5" vs "model: WH-1000XM5" should compare the same field.
  "quantity: 1" vs "qty: 1" should compare as equal.

All comparisons in attribute_matcher.py run on normalized values.
"""

import re
import unicodedata
from typing import Any


# ── Attribute key aliases ─────────────────────────────────────────────────────
# Maps variant field names to canonical keys used for comparison.
# If a buyer submits "colour" and listing has "color", they'll still match.
ALIASES: dict[str, str] = {
    # Color
    "colour": "color",
    "colour_name": "color",
    "product_color": "color",
    "item_color": "color",
    # Model / SKU
    "model_number": "model",
    "model_no": "model",
    "mpn": "model",
    "part_number": "model",
    "item_model": "model",
    # SKU
    "product_sku": "sku",
    "item_sku": "sku",
    "stock_keeping_unit": "sku",
    # Quantity
    "qty": "quantity",
    "count": "quantity",
    "unit_count": "quantity",
    "pack_quantity": "quantity",
    # Storage / Memory
    "storage_capacity": "storage",
    "memory": "storage",
    "internal_storage": "storage",
    "flash_memory": "storage",
    # Size
    "shoe_size": "size",
    "clothing_size": "size",
    "screen_size": "display_size",
    "display": "display_size",
    # Accessories
    "included_accessories": "accessories",
    "box_contents": "accessories",
    "in_the_box": "accessories",
    "whats_in_the_box": "accessories",
    # Condition
    "item_condition": "condition",
    "product_condition": "condition",
    # Category
    "product_type": "category",
    "product_category": "category",
}


def normalize_text(value: Any) -> str:
    """
    Normalize any value to a clean, comparable lowercase string.

    Steps:
      1. Unicode NFKC normalization (handles full-width chars, ligatures)
      2. Lowercase
      3. Typographic substitutions (×→x, em-dash→hyphen)
      4. Collapse multiple whitespace to single space
      5. Strip leading/trailing whitespace
    """
    if value is None:
        return ""
    text = unicodedata.normalize("NFKC", str(value)).lower().strip()
    text = text.replace("×", "x").replace("–", "-").replace("—", "-").replace("\u2011", "-")
    text = text.replace("'", "'").replace(""", '"').replace(""", '"')
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_key(key: str) -> str:
    """
    Normalize an attribute key name and apply alias mapping.

    Example: "Colour_Name" → "color"
    """
    normalized = normalize_text(key).replace(" ", "_").replace("-", "_")
    return ALIASES.get(normalized, normalized)


def normalize_value(value: Any) -> Any:
    """
    Normalize an attribute value based on its type.

    - bool/None: returned as-is (no string conversion)
    - int/float: returned as-is (numeric comparison)
    - list: each element normalized; sorted for order-independent set comparison
    - str: normalize_text applied
    """
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, list):
        # Sort normalized strings for order-independent comparison
        # ["USB-C cable", "Carrying case"] == ["Carrying case", "USB-C cable"]
        return sorted({normalize_text(v) for v in value if v is not None})
    return normalize_text(value)


def normalize_attributes(attrs: dict[str, Any]) -> dict[str, Any]:
    """
    Apply key normalization + alias mapping + value normalization to a full
    attribute dict. Keys with None values are dropped.
    """
    result: dict[str, Any] = {}
    for key, value in attrs.items():
        if value is None:
            continue
        canonical_key = normalize_key(key)
        normalized_val = normalize_value(value)
        result[canonical_key] = normalized_val
    return result
