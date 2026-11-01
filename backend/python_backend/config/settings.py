import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for python_backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env first, fallback to variables.env
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / "variables.env"

load_dotenv(dotenv_path=env_path)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

# Default fallback model (used when no module-specific chain applies)
OPENROUTER_MODEL_NAME = os.getenv("OPENROUTER_MODEL_NAME", "openrouter/auto")

# --------------------------------------------------------------------------
# Per-module model priority chains
# Models are tried in order; 404/402 errors skip to the next automatically.
# openrouter/auto at the end = ultimate safety net (picks any working free model).
# --------------------------------------------------------------------------

LEGAL_ASSISTANT_MODELS = [
    os.getenv("LEGAL_ASSISTANT_MODEL", "google/gemma-4-31b-it:free"),
    "mistralai/mistral-7b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-8b:free",
    "openrouter/auto",
]

CONTRACT_ANALYZER_MODELS = [
    os.getenv("CONTRACT_ANALYZER_MODEL", "qwen/qwen-2.5-72b-instruct:free"),
    "google/gemma-4-31b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "openrouter/auto",
]

CASE_PREDICTOR_MODELS = [
    os.getenv("CASE_PREDICTOR_MODEL", "deepseek/deepseek-r1:free"),
    "google/gemma-4-31b-it:free",
    "nousresearch/hermes-3-llama-3.1-8b:free",
    "openrouter/auto",
]

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")

# Local storage path for FAISS and BM25 pre-built indexes
INDEX_DIR = os.getenv("INDEX_DIR", str(BASE_DIR / "data" / "indexes"))
os.makedirs(INDEX_DIR, exist_ok=True)

# Device selection: Use CUDA if available, otherwise CPU
has_torch = False
try:
    import torch
    has_torch = True
except ImportError:
    pass

DEVICE_ENV = os.getenv("DEVICE", "auto").lower()
if DEVICE_ENV == "cuda" and has_torch and torch.cuda.is_available():
    DEVICE = "cuda"
elif DEVICE_ENV == "cpu":
    DEVICE = "cpu"
else:
    DEVICE = "cuda" if (has_torch and torch.cuda.is_available()) else "cpu"
