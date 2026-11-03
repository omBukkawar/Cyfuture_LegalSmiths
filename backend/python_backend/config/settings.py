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

# Default fallback model
OPENROUTER_MODEL_NAME = os.getenv("OPENROUTER_MODEL_NAME", "nvidia/nemotron-3-ultra-550b-a55b:free")

# --------------------------------------------------------------------------
# Per-module model priority chains
# --------------------------------------------------------------------------

LEGAL_ASSISTANT_MODELS = [
    os.getenv("LEGAL_ASSISTANT_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free"),
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
]

CONTRACT_ANALYZER_MODELS = [
    os.getenv("CONTRACT_ANALYZER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free"),
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
]

CASE_PREDICTOR_MODELS = [
    os.getenv("CASE_PREDICTOR_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free"),
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
]

# --------------------------------------------------------------------------
# LangGraph Case Analysis Pipeline models
# ADVOCATE: used for claimant/defence legal briefs
# JUDGE: judicial evaluator (supports JSON mode for structured output)
# --------------------------------------------------------------------------

ADVOCATE_MODEL = os.getenv("ADVOCATE_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
ADVOCATE_FALLBACK_MODELS: list = [
    os.getenv("ADVOCATE_FALLBACK_1", "nvidia/nemotron-3.5-lightning:free"),
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
]

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
JUDGE_FALLBACK_MODELS: list = [
    os.getenv("JUDGE_FALLBACK_1", "nvidia/nemotron-3.5-lightning:free"),
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free",
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
