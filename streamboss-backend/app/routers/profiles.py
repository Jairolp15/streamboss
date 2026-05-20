from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_admin
from app.models.profile import Profile
from app.schemas.master_account import ProfileSlot, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["Perfiles"])


@router.patch("/{profile_id}", response_model=ProfileSlot)
def update_profile(
    profile_id: int,
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    # Update the pin field (supports None or empty string to clear the PIN)
    profile.pin = data.pin if data.pin else None

    db.commit()
    db.refresh(profile)
    return profile
