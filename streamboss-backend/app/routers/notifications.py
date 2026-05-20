from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.dependencies import get_db, get_current_user
from app.models.notification import Notification
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])


@router.get("/")
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = (
        db.query(Notification)
        .options(joinedload(Notification.subscription))
        .order_by(Notification.created_at.desc())
    )
    if current_user.role == "distributor":
        q = q.join(Subscription).filter(Subscription.distributor_id == current_user.id)
    return q.limit(50).all()
