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
    """
    Runs every hour.
    - Detects client subscriptions with exactly 3 days remaining → alert.
    - Marks client subscriptions as 'expired' ONLY when their own end_date has passed (days_remaining <= 0).
    - Marks master accounts as 'expiring' or 'expired' based on their own expiry_date.
    - IMPORTANT: Master account expiry NEVER cancels or modifies client subscriptions.
      A client subscription is only removed/expired when its own days reach 0.
    """
    db: Session = SessionLocal()
    try:
        today = date.today()
        target_warning = today + timedelta(days=3)

        # ── 1. Subscription 3-day warning alerts ──────────────────────────────
        subs_warning = (
            db.query(Subscription)
            .options(
                joinedload(Subscription.client),
                joinedload(Subscription.profile).joinedload(Profile.master_account).joinedload(MasterAccount.platform),
            )
            .filter(
                Subscription.end_date == target_warning,
                Subscription.status == "active",
                Subscription.renewal_notified == False,
            )
            .all()
        )

        for sub in subs_warning:
            platform_name = sub.profile.master_account.platform.name
            client_name = sub.client.full_name
            message = (
                f"⚠️ RENOVACIÓN PENDIENTE\n"
                f"Cliente: {client_name}\n"
                f"Plataforma: {platform_name}\n"
                f"Vence en: 3 días ({target_warning.strftime('%d/%m/%Y')})"
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

        # ── 2. Auto-expire client subscriptions ONLY when their own days reach 0 ──
        # Master account status is IGNORED here. Only the client's own end_date matters.
        expired_subs = (
            db.query(Subscription)
            .options(joinedload(Subscription.profile))
            .filter(
                Subscription.end_date < today,
                Subscription.status.in_(["active", "expiring"]),
            )
            .all()
        )
        for sub in expired_subs:
            sub.status = "expired"
            # Free up the profile slot so it can be reused
            if sub.profile:
                sub.profile.status = "available"
            logger.info(f"Subscription {sub.id} marked as expired (client's own end_date reached)")

        # ── 3. Master account expiry alerts (DOES NOT touch subscriptions) ────
        expiring_accounts = (
            db.query(MasterAccount)
            .filter(
                MasterAccount.expiry_date == target_warning,
                MasterAccount.status == "active",
            )
            .all()
        )
        for acc in expiring_accounts:
            acc.status = "expiring"
            logger.info(f"Master account {acc.id} marked as expiring (subscriptions NOT affected)")

        # Mark master accounts as expired when their own date passes
        truly_expired_accounts = (
            db.query(MasterAccount)
            .filter(
                MasterAccount.expiry_date < today,
                MasterAccount.status.in_(["active", "expiring"]),
            )
            .all()
        )
        for acc in truly_expired_accounts:
            acc.status = "expired"
            logger.info(f"Master account {acc.id} marked as expired (subscriptions NOT affected)")

        db.commit()
        logger.info(
            f"Expiry check done: {len(subs_warning)} warnings, "
            f"{len(expired_subs)} client subs expired, "
            f"{len(expiring_accounts)} accounts expiring, "
            f"{len(truly_expired_accounts)} accounts expired"
        )
    except Exception as e:
        logger.error(f"Expiry check error: {e}")
        db.rollback()
    finally:
        db.close()
