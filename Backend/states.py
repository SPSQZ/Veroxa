from enum import Enum
from fastapi import HTTPException, status

class EscrowStatus(str, Enum):
    FUNDS_HELD = "FUNDS_HELD"                  # Order paid, funds in escrow
    DISPUTE_OPENED = "DISPUTE_OPENED"          # Buyer submitted video evidence
    AI_EVALUATING = "AI_EVALUATING"            # Multimodal matching in progress
    REVIEWER_ASSIGNED = "REVIEWER_ASSIGNED"    # Escalated to manual human auditor
    FUNDS_RELEASED = "FUNDS_RELEASED"          # Approved, money sent to seller (Terminal)
    FUNDS_REFUNDED = "FUNDS_REFUNDED"          # Dispatched back to buyer (Terminal)

# Definitive valid transitions matrix
VALID_TRANSITIONS = {
    EscrowStatus.FUNDS_HELD: [EscrowStatus.DISPUTE_OPENED, EscrowStatus.FUNDS_RELEASED],
    EscrowStatus.DISPUTE_OPENED: [EscrowStatus.AI_EVALUATING, EscrowStatus.REVIEWER_ASSIGNED],
    EscrowStatus.AI_EVALUATING: [EscrowStatus.FUNDS_RELEASED, EscrowStatus.FUNDS_REFUNDED, EscrowStatus.REVIEWER_ASSIGNED],
    EscrowStatus.REVIEWER_ASSIGNED: [EscrowStatus.FUNDS_RELEASED, EscrowStatus.FUNDS_REFUNDED],
    EscrowStatus.FUNDS_RELEASED: [], # Terminal
    EscrowStatus.FUNDS_REFUNDED: []  # Terminal
}

class EscrowStateMachine:
    @staticmethod
    def transition(current_status: EscrowStatus, target_status: EscrowStatus) -> EscrowStatus:
        if target_status not in VALID_TRANSITIONS.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid state transition: Cannot move escrow from {current_status} to {target_status}."
            )
        return target_status
