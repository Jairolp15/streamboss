from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class IssueReport(Base):
    __tablename__ = "issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(100), nullable=False)
    phone_whatsapp = Column(String(30), nullable=True)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    email = Column(String(150), nullable=False)
    password = Column(String(100), nullable=False)
    notes = Column(Text, nullable=False)
    admin_note = Column(Text, nullable=True)          # Nota de respuesta del admin
    status = Column(String(20), default="pending")    # pending | resolved | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    platform = relationship("Platform", back_populates="reports")
