from authentication.routes import router as auth_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_interview_bot.router import router as ai_router

app = FastAPI()

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

app.include_router(ai_router)  # uses routes such as /ws/interview/{session_id}
app.include_router(auth_router, prefix="/v1/auth", tags=["auth"])

