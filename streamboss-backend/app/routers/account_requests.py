from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone
from app.core.dependencies import get_db, get_current_user, require_admin
from app.models.account_request import AccountRequest
from app.models.user import User
from app.schemas.account_request import AccountRequestCreate, AccountRequestResponse, AccountRequestUpdate

router = APIRouter(prefix="/account-requests", tags=["Solicitudes de Cuenta"])


def _enrich(req: AccountRequest) -> dict:
    return {
        **{c.key: getattr(req, c.key) for c in req.__table__.columns},
        "distributor_name": req.distributor.name if req.distributor else None,
        "platform": req.platform,
    }


@router.get("/", response_model=List[AccountRequestResponse])
def list_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = (
        db.query(AccountRequest)
        .options(joinedload(AccountRequest.distributor), joinedload(AccountRequest.platform))
    )
    if current_user.role == "distributor":
        q = q.filter(AccountRequest.distributor_id == current_user.id)
    return [_enrich(r) for r in q.order_by(AccountRequest.created_at.desc()).all()]


@router.post("/", response_model=AccountRequestResponse, status_code=201)
def create_request(data: AccountRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = AccountRequest(
        distributor_id=current_user.id,
        platform_id=data.platform_id,
        notes=data.notes,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    # Reload with joins
    req = db.query(AccountRequest).options(
        joinedload(AccountRequest.distributor), joinedload(AccountRequest.platform)
    ).filter(AccountRequest.id == req.id).first()
    return _enrich(req)


@router.patch("/{req_id}", response_model=AccountRequestResponse)
def resolve_request(req_id: int, data: AccountRequestUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    req = db.query(AccountRequest).options(
        joinedload(AccountRequest.distributor), joinedload(AccountRequest.platform)
    ).filter(AccountRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")
    req.status = data.status
    if data.notes:
        req.notes = data.notes
    req.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(req)
    return _enrich(req)
