from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from app.core.dependencies import get_db, require_admin, get_current_user
from app.models.user import User
from app.models.master_account import MasterAccount
from app.models.profile import Profile
from app.schemas.master_account import (
    MasterAccountCreate, MasterAccountResponse, MasterAccountUpdate, ProfileSlot
)

router = APIRouter(prefix="/master-accounts", tags=["Cuentas Maestras"])


def _enrich(acc: MasterAccount) -> dict:
    days = (acc.expiry_date - date.today()).days
    occupied = sum(1 for p in acc.profiles if p.status == "occupied")
    return {
        **{c.key: getattr(acc, c.key) for c in acc.__table__.columns},
        "platform": acc.platform,
        "profiles": acc.profiles,
        "days_until_expiry": days,
        "occupied_count": occupied,
        "available_count": len(acc.profiles) - occupied,
    }


@router.get("/", response_model=List[MasterAccountResponse])
def list_master_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "operator"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acceso denegado")
    q = db.query(MasterAccount).options(joinedload(MasterAccount.platform), joinedload(MasterAccount.profiles))
    if current_user.role == "operator":
        q = q.filter(MasterAccount.created_by == current_user.id)
    accounts = q.all()
    return [_enrich(a) for a in accounts]


@router.post("/", response_model=MasterAccountResponse, status_code=201)
def create_master_account(data: MasterAccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "operator"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acceso denegado")
    acc = MasterAccount(**data.model_dump(), created_by=current_user.id)
    db.add(acc)
    db.flush()
    for i in range(1, data.total_profiles + 1):
        db.add(Profile(master_account_id=acc.id, profile_number=i, status="available"))
    db.commit()
    db.refresh(acc)
    return _enrich(acc)


@router.get("/{account_id}", response_model=MasterAccountResponse)
def get_master_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "operator"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acceso denegado")
    acc = (
        db.query(MasterAccount)
        .options(joinedload(MasterAccount.platform), joinedload(MasterAccount.profiles))
        .filter(MasterAccount.id == account_id)
        .first()
    )
    if not acc:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    if current_user.role == "operator" and acc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return _enrich(acc)


@router.patch("/{account_id}", response_model=MasterAccountResponse)
def update_master_account(account_id: int, data: MasterAccountUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    acc = db.query(MasterAccount).filter(MasterAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(acc, field, value)
    db.commit()
    db.refresh(acc)
    return _enrich(acc)


@router.delete("/{account_id}", status_code=204)
def delete_master_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "operator"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    acc = db.query(MasterAccount).filter(MasterAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    if current_user.role == "operator" and acc.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    db.delete(acc)
    db.commit()
