from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="distributor")  # admin | distributor
    phone_whatsapp = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    master_accounts = relationship("MasterAccount", back_populates="created_by_user")
    clients = relationship("Client", back_populates="distributor")
    subscriptions = relationship("Subscription", back_populates="distributor")
    account_requests = relationship("AccountRequest", back_populates="distributor")
