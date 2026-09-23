import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.hr import router as hr_router
from backend.routes.auth_routes import router as auth_router
from backend.routes.analysis_routes import router as analysis_router
from backend.routes.interview_routes import router as interview_router
from backend.routes.what_if_routes import router as what_if_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database on startup
    init_db()
    yield

app = FastAPI(
    title="Career Lens API",
    description="Evidence-based resume matching, recruiter/ATS insights, mock interview coaching, and career simulation.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(hr_router)
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(interview_router)
app.include_router(what_if_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Career Lens API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
