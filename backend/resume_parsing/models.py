from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON,Text
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
    education = relationship("Education", back_populates="candidate", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="candidate", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="candidate", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="candidate", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="candidate", cascade="all, delete-orphan")

class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    degree = Column(String)
    institution = Column(String)
    graduation_date = Column(String)
    location = Column(String)
    marks = Column(String, nullable=True)

    candidate = relationship("Candidate", back_populates="education")

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    company_name = Column(String)
    title = Column(String)
    start_date = Column(String)
    end_date = Column(String)
    location = Column(String)
    marks = Column(String)
    responsibilities = Column(Text)

    candidate = relationship("Candidate", back_populates="experiences")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    project_name = Column(String)
    description = Column(Text)
    github_url = Column(String)

    candidate = relationship("Candidate", back_populates="projects")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    languages = Column(String)
    backend_technologies = Column(String)
    databases = Column(String)
    ai_ml_frameworks = Column(String)
    tools_platforms = Column(String)
    core_competencies = Column(String)

    candidate = relationship("Candidate", back_populates="skills")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    title = Column(String)

    candidate = relationship("Candidate", back_populates="certifications")
