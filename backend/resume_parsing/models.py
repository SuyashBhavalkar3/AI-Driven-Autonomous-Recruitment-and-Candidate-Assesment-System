from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from authentication.database import Base
from sqlalchemy.orm import relationship

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String(20), nullable=True)
    linkedin_url = Column(String(500), nullable=False)
    resume_url = Column(String(500), nullable=False)
    parsed_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")