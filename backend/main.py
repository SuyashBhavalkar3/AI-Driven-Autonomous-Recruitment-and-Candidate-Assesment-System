from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from authentication.database import init_db
from authentication.routes import router as auth_router
from resume_parsing.routes import router as resume_router

app = FastAPI(title="Project1 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def on_startup():
    init_db()
    
app.include_router(auth_router)
app.include_router(resume_router)
