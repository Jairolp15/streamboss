from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    distributor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_whatsapp = Column(String(30), nullable=True)
    device_type = Column(String(20), nullable=False, default="phone")  # phone | laptop | tv
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    distributor = relationship("User", back_populates="clients")
    subscriptions = relationship("Subscription", back_populates="client")
