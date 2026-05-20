"""
seed.py — Populate initial data: platforms and admin user.
Run with: python seed.py
"""
from app.database import SessionLocal, engine
from app.database import Base
from app.models import *  # noqa
import bcrypt
from app.models.user import User
from app.models.platform import Platform

Base.metadata.create_all(bind=engine)

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

ADMIN = {
    "name": "Administrador",
    "email": "admin@admin.com",
    "password": "admin",
    "role": "admin",
}


def seed():
    db = SessionLocal()
    try:
        # Platforms
        for p in PLATFORMS:
            exists = db.query(Platform).filter(Platform.name == p["name"]).first()
            if not exists:
                db.add(Platform(**p))
                print(f"  [OK] Platform: {p['name']}")

        # Admin user
        admin_exists = db.query(User).filter(User.email == ADMIN["email"]).first()
        if not admin_exists:
            pwd = ADMIN["password"].encode("utf-8")
            hashed = bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")
            db.add(User(
                name=ADMIN["name"],
                email=ADMIN["email"],
                hashed_password=hashed,
                role=ADMIN["role"],
                is_active=True,
            ))
            print(f"  [OK] Admin user: {ADMIN['email']} / {ADMIN['password']}")

        db.commit()
        print("\n[DONE] Seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seed error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
