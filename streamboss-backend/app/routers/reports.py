from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone
from app.core.dependencies import get_db, require_admin
from app.models.report import IssueReport
from app.schemas.report import IssueReportCreate, IssueReportResponse, IssueReportUpdate

router = APIRouter(prefix="/reports", tags=["Reportes de Errores"])


def _enrich(rep: IssueReport) -> dict:
    return {
        **{c.key: getattr(rep, c.key) for c in rep.__table__.columns},
        "platform": rep.platform,
    }


@router.get("/", response_model=List[IssueReportResponse])
def list_reports(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Lista todos los reportes — solo administradores."""
    reports = (
        db.query(IssueReport)
        .options(joinedload(IssueReport.platform))
        .order_by(IssueReport.created_at.desc())
        .all()
    )
    return [_enrich(r) for r in reports]


@router.post("/", response_model=IssueReportResponse, status_code=201)
def create_report(data: IssueReportCreate, db: Session = Depends(get_db)):
    """Crea un reporte de error — acceso público, sin autenticación."""
    report = IssueReport(**data.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    # Reload with joins
    report = (
        db.query(IssueReport)
        .options(joinedload(IssueReport.platform))
        .filter(IssueReport.id == report.id)
        .first()
    )
    return _enrich(report)


@router.patch("/{report_id}", response_model=IssueReportResponse)
def resolve_report(
    report_id: int,
    data: IssueReportUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Acepta o deniega un reporte — solo administradores."""
    report = (
        db.query(IssueReport)
        .options(joinedload(IssueReport.platform))
        .filter(IssueReport.id == report_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="El reporte ya fue resuelto")

    report.status = data.status
    if data.admin_note is not None:
        report.admin_note = data.admin_note
    report.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(report)
    return _enrich(report)
