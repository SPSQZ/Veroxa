from database import SessionLocal, engine, Base
import models
from states import EscrowStatus

def seed_sandbox_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Deterministic System Profiles
    buyer = models.User(id=101, username="alex_buyer", email="alex@example.com", role="BUYER")
    seller = models.User(id=202, username="vintage_vault", email="sales@vault.internal", role="SELLER")
    auditor = models.User(id=303, username="system_ai_agent", email="agent@escrow.ai", role="AUDITOR")
    db.add_all([buyer, seller, auditor])
    
    # 2. Listing with strict semantic match metrics expectations
    listing = models.Listing(
        id=501, title="Mint Condition Rare Holographic Card",
        description="Flawless grading, no edge wear or structural creases present.",
        expected_metadata={"color": "Holo-Prismatic", "wear_tier": "None", "creases": False},
        seller_id=202
    )
    db.add(listing)
    
    # 3. Active Order running inside the Escrow Hold lifecycle state
    order = models.Order(id=9001, listing_id=501, buyer_id=101, amount=350.00, escrow_status=EscrowStatus.FUNDS_HELD.value)
    db.add(order)
    
    db.commit()
    db.close()
    print("✨ Deterministic sample data seeded successfully into escrow_disputes.db!")

if __name__ == "__main__":
    seed_sandbox_data()
