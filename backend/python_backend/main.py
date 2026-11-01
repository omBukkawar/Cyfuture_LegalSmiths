import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        "endpoints": [
            "/legalassistant",
            "/contractanalyzer",
            "/caseoutcomeprediction",
            "/health",
            "/docs",
        ],
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "device": DEVICE}

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)

