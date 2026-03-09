from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from authentication.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    questions = Column(JSON, nullable=False)  # List of questions
    answers = Column(JSON)  # Candidate answers
    score = Column(Integer)  # Total score
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("Application", back_populates="assessments")
