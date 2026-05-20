from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    master_account_id = Column(Integer, ForeignKey("master_accounts.id"), nullable=False)
    profile_number = Column(Integer, nullable=False)  # 1..N
    pin = Column(String(10), nullable=True)
    status = Column(String(20), default="available")  # available | occupied

    master_account = relationship("MasterAccount", back_populates="profiles")
    subscriptions = relationship("Subscription", back_populates="profile", cascade="all, delete-orphan")
