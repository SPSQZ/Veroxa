"""
Veroxa Semantic Product Matching Engine — Member 1
===================================================
Evidence-grounded hybrid matching for marketplace dispute resolution.

Public API
----------
from matching import Product, DisputeInput, MatchingResult, MatchingService

The engine never makes financial decisions autonomously.
Every result requires human reviewer confirmation.
"""

from .schemas import (
    Product,
    EvidenceItem,
    DisputeInput,
    AttributeComparison,
    CandidateMatch,
    MatchingResult,
)
from .matching_service import MatchingService
from .config import MatchingConfig

__all__ = [
    "Product",
    "EvidenceItem",
    "DisputeInput",
    "AttributeComparison",
    "CandidateMatch",
    "MatchingResult",
    "MatchingService",
    "MatchingConfig",
]

__version__ = "2.0.0"
