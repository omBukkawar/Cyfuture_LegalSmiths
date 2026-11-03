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
OPENROUTER_MODEL_NAME = os.getenv("OPENROUTER_MODEL_NAME", "meta-llama/llama-3.3-70b-instruct")

# --------------------------------------------------------------------------
# Per-Module Model Priority Chains (High Quality, High Rate Limits, Non-Chinese)
#
# 1. Legal Assistant:
#    - Primary: meta-llama/llama-3.3-70b-instruct (70B deep legal reasoning & statutory precision)
#    - Backup 1: openai/gpt-4o-mini (High-throughput, rapid inference)
#    - Backup 2: mistralai/mistral-small-24b-instruct-2501 (EU legal precision & zero rate-limit friction)
#    - Free Fallback: nvidia/nemotron-3.5-lightning:free (NVIDIA USA free engine)
#
# 2. Contract Analyzer:
#    - Primary: openai/gpt-4o-mini (Flawless strict JSON formatting & loophole auditing)
#    - Backup 1: meta-llama/llama-3.3-70b-instruct (70B commercial covenant & risk audit)
#    - Backup 2: mistralai/mistral-small-24b-instruct-2501 (Fast multi-clause extraction)
#    - Free Fallback: nvidia/nemotron-3.5-lightning:free (NVIDIA USA free engine)
#
# 3. Case Outcome Predictor:
#    - Primary: meta-llama/llama-3.3-70b-instruct (70B judicial balancing & win probability)
#    - Backup 1: openai/gpt-4o-mini (Rapid case precedent extraction)
#    - Backup 2: mistralai/mistral-small-24b-instruct-2501 (Remedies & statutory liabilities)
#    - Free Fallback: nvidia/nemotron-3-ultra-550b-a55b:free (NVIDIA USA 550B free engine)
# --------------------------------------------------------------------------

LEGAL_ASSISTANT_MODELS = [
    os.getenv("LEGAL_ASSISTANT_MODEL", "meta-llama/llama-3.3-70b-instruct"),
    "openai/gpt-4o-mini",
    "mistralai/mistral-small-24b-instruct-2501",
    "nvidia/nemotron-3.5-lightning:free",
]

CONTRACT_ANALYZER_MODELS = [
    os.getenv("CONTRACT_ANALYZER_MODEL", "openai/gpt-4o-mini"),
    "meta-llama/llama-3.3-70b-instruct",
    "mistralai/mistral-small-24b-instruct-2501",
    "nvidia/nemotron-3.5-lightning:free",
]

CASE_PREDICTOR_MODELS = [
    os.getenv("CASE_PREDICTOR_MODEL", "meta-llama/llama-3.3-70b-instruct"),
    "openai/gpt-4o-mini",
    "mistralai/mistral-small-24b-instruct-2501",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
]

# 4. LangGraph Adversarial Case Debate (Advocate & Judge)
ADVOCATE_MODEL = os.getenv('ADVOCATE_MODEL', 'meta-llama/llama-3.3-70b-instruct')
ADVOCATE_FALLBACK_MODELS = [
    'openai/gpt-4o-mini',
    'mistralai/mistral-small-24b-instruct-2501',
    'nvidia/nemotron-3.5-lightning:free',
]

JUDGE_MODEL = os.getenv('JUDGE_MODEL', 'meta-llama/llama-3.3-70b-instruct')
JUDGE_FALLBACK_MODELS = [
    'openai/gpt-4o-mini',
    'mistralai/mistral-small-24b-instruct-2501',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
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
