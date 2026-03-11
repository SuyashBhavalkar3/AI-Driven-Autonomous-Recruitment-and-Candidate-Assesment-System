from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_interview_bot.router import router as ai_router
from ai_interview_bot.code_router import code_router
from ai_interview_bot.tts_router import router as tts_router
from authentication.database import engine, Base, init_db
from authentication.routes import router as auth_router
from resume_parsing.routes import router as resume_router
from job_management_module.routes import router as jobs_router
from ATS_score.route import router as ats_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Recruitment System",
    description="Autonomous recruitment and candidate assessment system",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ai interview backend running"}

app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(code_router)
app.include_router(tts_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(ats_router)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    init_db()
