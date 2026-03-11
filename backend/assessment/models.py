from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from authentication.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, unique=True)
    
    # Assessment metadata
    score = Column(Integer, nullable=True)  # Total score
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    application = relationship("Application", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")
    answers = relationship("AssessmentAnswer", back_populates="assessment", cascade="all, delete-orphan")
    

class AssessmentQuestion(Base):
    """Individual MCQ questions generated for an assessment"""
    __tablename__ = "assessment_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    
    # Question content
    question_text = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)  # A, B, C, or D
    
    # Metadata
    topic = Column(String, nullable=True)  # e.g., "Python", "Database Design"
    difficulty = Column(String, nullable=True)  # easy, medium, hard
    explanation = Column(Text, nullable=True)  # Optional explanation for the answer
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    assessment = relationship("Assessment", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question")


class AssessmentAnswer(Base):
    """Candidate's answers to assessment questions"""
    __tablename__ = "assessment_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    
    # Candidate's response
    selected_option = Column(String, nullable=True)  # A, B, C, D, or null if not answered
    is_correct = Column(Boolean, nullable=True)  # True/False/None if not evaluated
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")
