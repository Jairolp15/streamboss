from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, require_admin, get_current_user
from app.models.platform import Platform
from app.schemas.platform import PlatformCreate, PlatformResponse, PlatformUpdate

router = APIRouter(prefix="/platforms", tags=["Plataformas"])


@router.get("/", response_model=List[PlatformResponse])
def list_platforms(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Platform).all()


@router.post("/", response_model=PlatformResponse, status_code=201)
def create_platform(data: PlatformCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Platform).filter(Platform.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plataforma ya existe")
    platform = Platform(**data.model_dump())
    db.add(platform)
    db.commit()
    db.refresh(platform)
    return platform


@router.patch("/{platform_id}", response_model=PlatformResponse)
def update_platform(platform_id: int, data: PlatformUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(platform, field, value)
    db.commit()
    db.refresh(platform)
    return platform


@router.delete("/{platform_id}", status_code=204)
def delete_platform(platform_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    platform = db.query(Platform).filter(Platform.id == platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    db.delete(platform)
    db.commit()
