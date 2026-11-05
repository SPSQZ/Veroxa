import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base
from states import EscrowStatus

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String)  # 'BUYER', 'SELLER', or 'AUDITOR'

class Listing(Base):
    __tablename__ = "listings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    expected_metadata = Column(JSON)  # Expected properties (e.g., {"color": "Blue", "condition": "New"})
    seller_id = Column(Integer, ForeignKey("users.id"))

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"))
    buyer_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    escrow_status = Column(String, default=EscrowStatus.FUNDS_HELD.value)
    
    dispute = relationship("Dispute", uselist=False, back_populates="order")

class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    order = relationship("Order", back_populates="dispute")
    evidence = relationship("Evidence", back_populates="dispute")
    recommendations = relationship("AIRecommendation", back_populates="dispute")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id"))
    file_url = Column(String)  # Path/URL to the uploaded unboxing video
    file_type = Column(String)  # e.g., 'video/mp4'
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    dispute = relationship("Dispute", back_populates="evidence")

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id"))
    confidence_score = Column(Float)  # 0.0 to 1.0 match score from Vision AI
    analysis_summary = Column(String)  # Text reasoning detailing why it passed/failed
    suggested_action = Column(String)  # 'RELEASE' or 'REFUND' or 'ESCALATE'
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    dispute = relationship("Dispute", back_populates="recommendations")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer)
    previous_state = Column(String)
    new_state = Column(String)
    triggered_by_user_id = Column(Integer)
    action_details = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
