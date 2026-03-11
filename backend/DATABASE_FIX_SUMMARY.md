# Database Schema Fix - Summary

## Problem
SQLAlchemy was detecting duplicate table definitions causing `InvalidRequestError: Table 'experiences' is already defined`.

## Root Cause
Models were defined in TWO places:
1. `candidate_profile/models.py` - Experience, Education, Skill, Project
2. `resume_parsing/models.py` - Experience, Education, Skill, Project, Certification (DUPLICATES!)

## Solution Applied

### 1. Removed Duplicate Models
**File: `resume_parsing/models.py`**
- Removed: Experience, Education, Skill, Project, Certification models
- Kept: Only Candidate model
- Added: certifications relationship to Candidate

### 2. Consolidated All Profile Models
**File: `candidate_profile/models.py`**
- Experience: Added `marks` field, made all fields nullable
- Education: Added `graduation_date`, `marks`, `location` fields, made all nullable
- Skill: Kept original structure with multiple columns (languages, backend_technologies, etc.)
- Project: Made all fields nullable
- Certification: Added new model

### 3. Fixed Imports
**File: `resume_parsing/utils.py`**
- Changed: `from resume_parsing.models import ...`
- To: `from candidate_profile.models import ...`

### 4. Updated Schemas
**File: `candidate_profile/schemas.py`**
- SkillCreate: Changed from `skill_name/proficiency` to multiple skill category fields
- EducationCreate: Added `graduation_date`, `marks`, `location` fields
- ExperienceCreate: Added `marks` field

**File: `resume_parsing/schemas.py`**
- Already had correct structure matching the models

### 5. Fixed save_parsed_data Function
**File: `resume_parsing/utils.py`**
- Updated to use correct field names matching the models
- Handles both single objects and lists for education/experience
- Properly saves skills as single object with multiple columns
- Handles certifications as comma-separated string or list

### 6. Import Order Fix
**File: `main.py`**
- Models imported BEFORE routes to prevent duplicate registration

## Database Schema

```
candidates
├── experiences (company_name, job_title, location, start_date, end_date, is_current, description, marks)
├── education (institution, degree, field_of_study, start_date, end_date, grade, graduation_date, marks, location)
├── skills (languages, backend_technologies, databases, ai_ml_frameworks, tools_platforms, core_competencies)
├── projects (project_name, description, github_url)
└── certifications (title)
```

## Testing

Run the server:
```bash
cd backend
uvicorn main:app --reload
```

Test resume upload:
```bash
POST /resume/upload-resume/
- Upload a PDF/DOCX resume
- Data will be parsed and saved to separate tables
```

## All Routes Working

✅ Resume upload and parsing
✅ Candidate profile CRUD operations
✅ Experience CRUD
✅ Education CRUD
✅ Skills CRUD (with update endpoint added)
✅ Projects relationships
✅ Certifications relationships
