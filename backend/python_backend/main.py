import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from limiter import limiter
from config.settings import PORT, HOST, DEVICE, INDEX_DIR
from routers import assistant_router, contract_router, case_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    print("=" * 60)
    print("[Starting] LegalSmiths AI Backend Starting...")
    print(f"[Device] Compute Device: {DEVICE}")
    print(f"[Storage] Index Storage Directory: {INDEX_DIR}")
    print(f"[Endpoints] Active: /legalassistant, /contractanalyzer, /caseoutcomeprediction")
    print("=" * 60)
    yield
    print("[Shutdown] LegalSmiths AI Backend Shutting down...")

app = FastAPI(
    title="LegalSmiths AI Backend",
    description="Unified AI Microservice for Legal Q&A, Contract Analysis, and Case Outcome Prediction",
    version="2.0.0",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS Configuration
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5000,http://localhost:8000,https://legalsmiths.onrender.com,https://legalsmiths-node.onrender.com,https://legalsmiths-ai.onrender.com",
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(assistant_router)
app.include_router(contract_router)
app.include_router(case_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "LegalSmiths AI Backend",
        "version": "2.0.0",
        "endpoints": ["/legalassistant", "/contractanalyzer", "/caseoutcomeprediction", "/health", "/docs"],
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "device": DEVICE}

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
