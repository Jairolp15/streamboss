from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    logo_url = Column(String(255), nullable=True)
    max_profiles = Column(Integer, default=5)
    color_hex = Column(String(7), default="#6366f1")

    master_accounts = relationship("MasterAccount", back_populates="platform")
    account_requests = relationship("AccountRequest", back_populates="platform")
    reports = relationship("IssueReport", back_populates="platform")
