from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import models, states, database

app = FastAPI(title="PayPal Hackathon AI Escrow Protocol API", version="1.0.0")

# Database initialization wrapper
@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=database.engine)

# Helper function to mock role-based authorization checks
def verify_role(user_id: int, expected_roles: list, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role not in expected_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: User role must be one of {expected_roles}"
        )
    return user

# Log changes securely to our audit trail
def log_audit_event(db: Session, order_id: int, prev: str, new: str, user_id: int, details: str):
    log = models.AuditEvent(
        order_id=order_id, previous_state=prev, new_state=new,
        triggered_by_user_id=user_id, action_details=details
    )
    db.add(log)
    db.commit()

@app.post("/cases/create", status_code=status.HTTP_201_CREATED)
def open_dispute_case(order_id: int = Form(...), reason: str = Form(...), user_id: int = Form(...), db: Session = Depends(database.get_db)):
    # 1. Access Check: Must be the buyer of the order
    verify_role(user_id, ["BUYER"], db)
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.buyer_id == user_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tracking data not found or unauthorized.")
    
    # 2. Assert Valid State Machine Rules
    old_status = order.escrow_status
    new_status = states.EscrowStateMachine.transition(old_status, states.EscrowStatus.DISPUTE_OPENED)
    
    # 3. Create Case
    existing_dispute = db.query(models.Dispute).filter(models.Dispute.order_id == order_id).first()
    if existing_dispute:
        raise HTTPException(status_code=400, detail="A dispute case is already running for this transaction.")
        
    dispute = models.Dispute(order_id=order_id, reason=reason)
    db.add(dispute)
    order.escrow_status = new_status.value
    db.commit()
    
    log_audit_event(db, order_id, old_status, new_status.value, user_id, f"Dispute initialized: {reason}")
    return {"message": "Dispute case opened successfully", "dispute_id": dispute.id, "escrow_status": order.escrow_status}

@app.post("/cases/{dispute_id}/evidence")
async def upload_evidence(dispute_id: int, user_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    verify_role(user_id, ["BUYER"], db)
    dispute = db.query(models.Dispute).filter(models.Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute context not found.")
        
    # Basic upload type validation rule check
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid extension file format. System strictly accepts video proofs.")
    
    # Simulated Cloud Storage Link Generation
    simulated_cloud_url = f"https://sandbox.internal{dispute_id}_{file.filename}"
    
    evidence = models.Evidence(dispute_id=dispute_id, file_url=simulated_cloud_url, file_type=file.content_type)
    db.add(evidence)
    db.commit()
    return {"message": "Video evidence linked successfully.", "stored_url": simulated_cloud_url}

@app.post("/cases/{dispute_id}/match-ai")
def trigger_ai_matching(dispute_id: int, user_id: int = Form(...), db: Session = Depends(database.get_db)):
    # Simulates the Channel3 / Multimodal parsing trigger endpoint
    verify_role(user_id, ["AUDITOR"], db)
    dispute = db.query(models.Dispute).filter(models.Dispute.id == dispute_id).first()
    order = dispute.order
    
    old_status = order.escrow_status
    next_status = states.EscrowStateMachine.transition(old_status, states.EscrowStatus.AI_EVALUATING)
    order.escrow_status = next_status.value
    db.commit()
    
    # Mock Processing Logic (In production, your teammate hooks up the vision agent model here)
    mock_rec = models.AIRecommendation(
        dispute_id=dispute_id,
        confidence_score=0.92,
        analysis_summary="High confidence match anomaly detected: Box item shows a structural crack not present in listing specs.",
        suggested_action="REFUND"
    )
    db.add(mock_rec)
    db.commit()
    
    log_audit_event(db, order.id, old_status, next_status.value, user_id, "AI Multimodal Semantic Comparison Worker Started.")
    return {"status": "AI processing complete", "recommendation": mock_rec.suggested_action, "confidence": mock_rec.confidence_score}

@app.post("/cases/{dispute_id}/action")
def reviewer_resolution_override(dispute_id: int, action: str = Form(...), user_id: int = Form(...), db: Session = Depends(database.get_db)):
    """Applies terminal resolution choices: 'RELEASE' (to seller) or 'REFUND' (to buyer)"""
    verify_role(user_id, ["AUDITOR"], db)
    dispute = db.query(models.Dispute).filter(models.Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute record not found.")
        
    order = dispute.order
    old_status = order.escrow_status
    
    if action == "RELEASE":
        target = states.EscrowStatus.FUNDS_RELEASED
    elif action == "REFUND":
        target = states.EscrowStatus.FUNDS_REFUNDED
    else:
        raise HTTPException(status_code=400, detail="Invalid ultimate action decision keyword.")
        
    # Commit state alteration safely using the validations engine
    order.escrow_status = states.EscrowStateMachine.transition(old_status, target).value
    db.commit()
    
    log_audit_event(db, order.id, old_status, order.escrow_status, user_id, f"Manual human auditor action applied override: {action}")
    return {"message": "Escrow finalized", "final_state": order.escrow_status}

@app.get("/cases/{order_id}/history")
def get_case_audit_logs(order_id: int, db: Session = Depends(database.get_db)):
    logs = db.query(models.AuditEvent).filter(models.AuditEvent.order_id == order_id).order_by(models.AuditEvent.timestamp.asc()).all()
    return logs
