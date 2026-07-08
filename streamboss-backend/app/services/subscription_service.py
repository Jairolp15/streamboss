from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.subscription import Subscription
from app.models.profile import Profile
from app.schemas.subscription import SubscriptionCreate


def get_days_remaining(end_date: date) -> int:
    return (end_date - date.today()).days


def enrich_subscription(sub: Subscription) -> dict:
    days = get_days_remaining(sub.end_date)
    profile = sub.profile
    master = profile.master_account
    platform = master.platform
    client = sub.client
    return {
        "id": sub.id,
        "client_id": sub.client_id,
        "profile_id": sub.profile_id,
        "distributor_id": sub.distributor_id,
        "start_date": sub.start_date,
        "end_date": sub.end_date,
        "status": sub.status,
        "renewal_notified": sub.renewal_notified,
        "created_at": sub.created_at,
        "days_remaining": days,
        "client_name": client.full_name,
        "client_phone": client.phone_whatsapp,
        "device_type": client.device_type,
        "platform_name": platform.name,
        "platform_color": platform.color_hex,
        "profile_number": profile.profile_number,
        "profile_pin": profile.pin,
        # Usa credenciales personalizadas del perfil si existen, si no las de la cuenta maestra
        "master_email": profile.custom_email or master.email,
        "master_password": profile.custom_password or master.password_encrypted,
    }


def create_subscription(
    db: Session, data: SubscriptionCreate, distributor_id: int
) -> Subscription:
    profile = db.query(Profile).filter(Profile.id == data.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    if profile.status == "occupied":
        raise HTTPException(status_code=400, detail="El perfil ya está ocupado")

    sub = Subscription(
        client_id=data.client_id,
        profile_id=data.profile_id,
        distributor_id=distributor_id,
        start_date=data.start_date,
        end_date=data.end_date,
        status="active",
    )
    profile.status = "occupied"
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def cancel_subscription(db: Session, sub_id: int) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    sub.status = "cancelled"
    profile = db.query(Profile).filter(Profile.id == sub.profile_id).first()
    if profile:
        profile.status = "available"
    db.commit()
    db.refresh(sub)
    return sub
