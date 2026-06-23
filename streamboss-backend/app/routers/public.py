from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
from app.core.dependencies import get_db
from app.models.platform import Platform
from app.models.account_request import AccountRequest

router = APIRouter(prefix="/public", tags=["Registro Público de Auto-Servicio"])


# Request Schemas
class PublicRegisterRequest(BaseModel):
    full_name: str
    phone_whatsapp: Optional[str] = None
    device_type: str
    platform_id: int
    desired_pin: Optional[str] = None


class PublicRequestResponse(BaseModel):
    request_id: int
    message: str


class PublicPlatformResponse(BaseModel):
    id: int
    name: str
    color_hex: str
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/platforms", response_model=List[PublicPlatformResponse])
def list_public_platforms(db: Session = Depends(get_db)):
    """Retorna las plataformas activas de forma pública."""
    return db.query(Platform).all()


@router.post("/submit-request", response_model=PublicRequestResponse, status_code=201)
def public_submit_request(data: PublicRegisterRequest, db: Session = Depends(get_db)):
    """
    Crea una solicitud de cuenta pública que será revisada por el administrador.
    Los datos del cliente se guardan en el campo 'notes'.
    """
    # 1. Verificar existencia de la plataforma
    platform = db.query(Platform).filter(Platform.id == data.platform_id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="La plataforma seleccionada no existe")

    # 2. Guardar datos del cliente en notes estructurado
    client_info = {
        "full_name": data.full_name,
        "phone_whatsapp": data.phone_whatsapp,
        "device_type": data.device_type,
        "is_public_request": True,
        "desired_pin": data.desired_pin,
    }
    
    # 3. Crear el AccountRequest asociado al Administrador (ID 1)
    account_request = AccountRequest(
        distributor_id=1,  # Admin
        platform_id=platform.id,
        status="pending",
        notes=json.dumps(client_info)
    )
    
    db.add(account_request)
    db.commit()
    db.refresh(account_request)

    return {
        "request_id": account_request.id,
        "message": "Solicitud enviada con éxito. Será contactado pronto."
    }

