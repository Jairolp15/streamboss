from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.dependencies import get_db, get_current_user, require_admin
from app.models.subscription import Subscription
from app.models.profile import Profile
from app.models.master_account import MasterAccount
from app.models.platform import Platform
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, SubscriptionEdit, WhatsAppMessage
from app.services.subscription_service import create_subscription, enrich_subscription, cancel_subscription
from app.services.whatsapp_service import generate_whatsapp_link

router = APIRouter(prefix="/subscriptions", tags=["Suscripciones"])

_EAGER = [
    joinedload(Subscription.client),
    joinedload(Subscription.profile).joinedload(Profile.master_account).joinedload(MasterAccount.platform),
]


def _load(db: Session, sub_id: int) -> Subscription:
    sub = db.query(Subscription).options(*_EAGER).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    return sub


@router.get("/", response_model=List[SubscriptionResponse])
def list_subscriptions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Subscription).options(*_EAGER)
    if current_user.role == "distributor":
        q = q.filter(Subscription.distributor_id == current_user.id)
    return [enrich_subscription(s) for s in q.all()]


@router.get("/expiring", response_model=List[SubscriptionResponse])
def list_expiring(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Subscription).options(*_EAGER).filter(Subscription.status.in_(["expiring", "active"]))
    if current_user.role == "distributor":
        q = q.filter(Subscription.distributor_id == current_user.id)
    subs = [enrich_subscription(s) for s in q.all()]
    return [s for s in subs if s["days_remaining"] is not None and s["days_remaining"] <= 3]


@router.post("/", response_model=SubscriptionResponse, status_code=201)
def create_sub(data: SubscriptionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = create_subscription(db, data, current_user.id)
    return enrich_subscription(_load(db, sub.id))


@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_sub(sub_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = _load(db, sub_id)
    if current_user.role == "distributor" and sub.distributor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return enrich_subscription(sub)


@router.get("/{sub_id}/whatsapp", response_model=WhatsAppMessage)
def get_whatsapp_link(sub_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sub = _load(db, sub_id)
    enriched = enrich_subscription(sub)
    if not enriched.get("client_phone"):
        raise HTTPException(status_code=400, detail="El cliente no tiene número de WhatsApp")
    return generate_whatsapp_link(
        client_name=enriched["client_name"],
        platform_name=enriched["platform_name"],
        days_remaining=enriched["days_remaining"],
        client_phone=enriched["client_phone"],
        master_email=enriched.get("master_email"),
        master_password=enriched.get("master_password"),
        profile_number=str(enriched.get("profile_number")),
        profile_pin=enriched.get("profile_pin"),
        is_new_assignment=True,
        device_type=enriched.get("device_type"),
    )


@router.patch("/{sub_id}/cancel", response_model=SubscriptionResponse)
def cancel_sub(sub_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    sub = cancel_subscription(db, sub_id)
    return enrich_subscription(_load(db, sub.id))


@router.patch("/{sub_id}", response_model=SubscriptionResponse)
def edit_sub(sub_id: int, data: SubscriptionEdit, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Edit end_date, profile PIN, master account credentials (solo para este cliente) y/o cambio de perfil."""
    from app.models.master_account import MasterAccount
    sub = _load(db, sub_id)

    # Permission check: only admin or the subscription owner
    if current_user.role == "distributor" and sub.distributor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    # Update end_date on the subscription
    if data.end_date is not None:
        sub.end_date = data.end_date
        sub.renewal_notified = False  # reset notification flag

    # ── Fix 4: Cambio de perfil ──────────────────────────────────
    # Si se envía un nuevo profile_id distinto al actual, liberar el anterior y ocupar el nuevo
    if data.profile_id is not None and data.profile_id != sub.profile_id:
        old_profile = db.query(Profile).filter(Profile.id == sub.profile_id).first()
        new_profile = db.query(Profile).filter(Profile.id == data.profile_id).first()

        if not new_profile:
            raise HTTPException(status_code=404, detail="El nuevo perfil no existe")
        if new_profile.status == "occupied":
            raise HTTPException(status_code=400, detail="El perfil seleccionado ya está ocupado")

        # Liberar perfil anterior y limpiar sus credenciales override
        if old_profile:
            old_profile.status = "available"
            old_profile.custom_email = None
            old_profile.custom_password = None
            old_profile.pin = None

        # Ocupar nuevo perfil
        new_profile.status = "occupied"
        sub.profile_id = data.profile_id

    # ── Fix 2: Update profile PIN — solo para este perfil/cliente ─
    if data.profile_pin is not None:
        profile = db.query(Profile).filter(Profile.id == sub.profile_id).first()
        if profile:
            profile.pin = data.profile_pin if data.profile_pin.strip() else None

    # ── Fix 2: Credenciales — se guardan en el perfil individual ──
    # NO se modifica la MasterAccount para no afectar a otros clientes
    if data.master_email is not None or data.master_password is not None:
        profile = db.query(Profile).filter(Profile.id == sub.profile_id).first()
        if profile:
            if data.master_email is not None:
                # Guardar override de email en el perfil (vacío = usar el de la cuenta maestra)
                profile.custom_email = data.master_email if data.master_email.strip() else None
            if data.master_password is not None:
                # Guardar override de password en el perfil (vacío = usar el de la cuenta maestra)
                profile.custom_password = data.master_password if data.master_password.strip() else None

    db.commit()
    return enrich_subscription(_load(db, sub.id))


@router.delete("/{sub_id}", status_code=204)
def delete_sub(sub_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    if sub.status != "cancelled":
        profile = db.query(Profile).filter(Profile.id == sub.profile_id).first()
        if profile:
            profile.status = "available"
            
    db.delete(sub)
    db.commit()
