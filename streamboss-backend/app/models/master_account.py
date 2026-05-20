from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class MasterAccount(Base):
    __tablename__ = "master_accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform_id = Column(Integer, ForeignKey("platforms.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String(150), nullable=False)
    password_encrypted = Column(String(255), nullable=False)
    purchase_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    total_profiles = Column(Integer, default=5)
    status = Column(String(20), default="active")  # active | expiring | expired
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    platform = relationship("Platform", back_populates="master_accounts")
    created_by_user = relationship("User", back_populates="master_accounts")
    profiles = relationship("Profile", back_populates="master_account", cascade="all, delete-orphan")
