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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
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
