import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings
from app.database import engine
from app.models import *  # noqa: ensure all models are registered
from app.database import Base
from app.routers import auth, users, platforms, master_accounts, clients, subscriptions, account_requests, notifications, profiles, public, reports
from app.tasks.expiry_checker import check_expiring_subscriptions

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("streamboss")

scheduler = BackgroundScheduler()


def auto_seed_db():
    from app.database import SessionLocal
    from app.models.user import User
    from app.models.platform import Platform
    import bcrypt

    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.email == "admin@admin.com").first()
        if not admin_exists:
            logger.info("Admin user not found. Seeding database...")
            PLATFORMS = [
                {"name": "Netflix",      "max_profiles": 5, "color_hex": "#E50914"},
                {"name": "Disney+",      "max_profiles": 4, "color_hex": "#113CCF"},
                {"name": "Prime Video",  "max_profiles": 6, "color_hex": "#00A8E1"},
                {"name": "HBO Max",      "max_profiles": 5, "color_hex": "#5822B4"},
                {"name": "HBO Premium",  "max_profiles": 5, "color_hex": "#7333B0"},
                {"name": "Paramount+",   "max_profiles": 6, "color_hex": "#0064FF"},
                {"name": "Crunchyroll",  "max_profiles": 5, "color_hex": "#F47521"},
                {"name": "Flujo TV",     "max_profiles": 3, "color_hex": "#00C853"},
                {"name": "IPTV",         "max_profiles": 1, "color_hex": "#00838F"},
                {"name": "Spotify",      "max_profiles": 6, "color_hex": "#1DB954"},
                {"name": "YouTube Premium","max_profiles": 6, "color_hex": "#FF0000"},
                {"name": "Canva",        "max_profiles": 5, "color_hex": "#00C4CC"},
                {"name": "CapCut",       "max_profiles": 1, "color_hex": "#000000"},
                {"name": "Gemini Pro",   "max_profiles": 1, "color_hex": "#1A73E8"},
                {"name": "Google One (30GB)", "max_profiles": 1, "color_hex": "#4285F4"},
                {"name": "Google One (100GB)", "max_profiles": 5, "color_hex": "#34A853"},
                {"name": "Google One (200GB)", "max_profiles": 5, "color_hex": "#FBBC05"},
                {"name": "ChatGPT Plus", "max_profiles": 1, "color_hex": "#10A37F"},
                {"name": "Deezer",       "max_profiles": 6, "color_hex": "#FEAA2D"},
            ]
            for p in PLATFORMS:
                exists = db.query(Platform).filter(Platform.name == p["name"]).first()
                if not exists:
                    db.add(Platform(**p))
                    logger.info(f"Seeded platform: {p['name']}")

            pwd = b"admin"
            hashed = bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")
            db.add(User(
                name="Administrador",
                email="admin@admin.com",
                hashed_password=hashed,
                role="admin",
                is_active=True,
            ))
            db.commit()
            logger.info("Admin user 'admin@admin.com' created successfully via auto-seed!")
        else:
            logger.info("Admin user already exists. Skipping auto-seed.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during auto-seed: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    # Auto-seed if needed
    auto_seed_db()
    # Start scheduler
    scheduler.add_job(check_expiring_subscriptions, "interval", hours=1, id="expiry_checker")
    scheduler.start()
    logger.info("APScheduler started — expiry checker running every hour")
    yield
    scheduler.shutdown()
    logger.info("APScheduler stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="API de gestión de distribución de perfiles streaming",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=PREFIX)
app.include_router(users.router, prefix=PREFIX)
app.include_router(platforms.router, prefix=PREFIX)
app.include_router(master_accounts.router, prefix=PREFIX)
app.include_router(clients.router, prefix=PREFIX)
app.include_router(subscriptions.router, prefix=PREFIX)
app.include_router(account_requests.router, prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(profiles.router, prefix=PREFIX)
app.include_router(public.router, prefix=PREFIX)
app.include_router(reports.router, prefix=PREFIX)


@app.get("/")
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}
