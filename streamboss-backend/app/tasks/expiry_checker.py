import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal
from app.models.subscription import Subscription
from app.models.profile import Profile
from app.models.master_account import MasterAccount
from app.models.platform import Platform
from app.models.notification import Notification

logger = logging.getLogger("streamboss.tasks")


def check_expiring_subscriptions():
    """Runs every hour. Detects subscriptions with exactly 3 days remaining."""
    db: Session = SessionLocal()
    try:
        today = date.today()
        target = today + timedelta(days=3)

        # Subscription expiry alerts
        subs = (
            db.query(Subscription)
            .options(
                joinedload(Subscription.client),
                joinedload(Subscription.profile).joinedload(Profile.master_account).joinedload(MasterAccount.platform),
            )
            .filter(
                Subscription.end_date == target,
                Subscription.status == "active",
                Subscription.renewal_notified == False,
            )
            .all()
        )

        for sub in subs:
            platform_name = sub.profile.master_account.platform.name
            client_name = sub.client.full_name
            message = (
                f"⚠️ RENOVACIÓN PENDIENTE\n"
                f"Cliente: {client_name}\n"
                f"Plataforma: {platform_name}\n"
                f"Vence en: 3 días ({target.strftime('%d/%m/%Y')})"
            )
            notif = Notification(
                subscription_id=sub.id,
                type="expiry_warning",
                message_template=message,
                sent_whatsapp=False,
            )
            sub.renewal_notified = True
            sub.status = "expiring"
            db.add(notif)
            logger.info(f"Expiry alert created for subscription {sub.id} — {client_name}")

        # Master account expiry alerts
        expiring_accounts = (
            db.query(MasterAccount)
            .filter(
                MasterAccount.expiry_date == target,
                MasterAccount.status == "active",
            )
            .all()
        )
        for acc in expiring_accounts:
            acc.status = "expiring"
            logger.info(f"Master account {acc.id} marked as expiring")

        db.commit()
        logger.info(f"Expiry check done: {len(subs)} subscriptions, {len(expiring_accounts)} accounts")
    except Exception as e:
        logger.error(f"Expiry check error: {e}")
        db.rollback()
    finally:
        db.close()
