# LegalSmiths AI Backend (FastAPI Microservice)

The unified, production AI backend for **LegalSmiths**, powering statutory Indian Legal Advice, Advanced Contract Clause Analysis, and Judicial Case Outcome Prediction.

---

## 🌐 Live Production Deployment

The AI microservice is deployed as a containerized web service on **Render**:
* **Live Base URL:** [https://legalsmiths-ai.onrender.com](https://legalsmiths-ai.onrender.com)
* **Interactive Swagger UI:** [https://legalsmiths-ai.onrender.com/docs](https://legalsmiths-ai.onrender.com/docs)
* **Health Check:** [https://legalsmiths-ai.onrender.com/health](https://legalsmiths-ai.onrender.com/health)
* **Hosting:** Render Web Service (Docker Runtime)
* **Region:** Singapore (`ap-southeast-1`) — Optimized for low latency.
* **CI/CD:** Automated verification and gated webhook deployment via GitHub Actions.

---

## 🌟 Key Architecture & Capabilities

```text
backend/python_backend/
├── Dockerfile               # Production Slim Python 3.11 container
├── .dockerignore            # Excludes caches, venv, and large indexes
├── requirements.txt         # Slimmed, production-safe dependencies
├── main.py                  # FastAPI application entrypoint & lifecycle
├── config/
│   └── settings.py          # Environment, device selection, and priority model chains
├── models/
│   └── llm.py               # OpenRouter LLM wrapper with multi-model fallback chain
├── routers/
│   ├── legal_assistant.py   # POST /legalassistant
│   ├── contract_analyzer.py # POST /contractanalyzer
│   └── case_prediction.py   # POST /caseoutcomeprediction
├── schemas/
│   ├── assistant_schemas.py # Pydantic request/response schemas
│   ├── contract_schemas.py  # Structured contract JSON schemas
│   └── case_schemas.py      # Case outcome prediction schemas
└── services/
    ├── legal_assistant/     # 4-Node Agentic Legal Assistant Pipeline
    │   ├── guardrail_node.py    # Node 1: Prompt injection & safety filter
    │   ├── search_node.py       # Node 2: Live Google India search (Serper)
    │   ├── evaluator_node.py    # Node 3: Result validation & spam filter
    │   ├── synthesis_node.py    # Node 4: Context injection & LLM synthesis
    │   └── pipeline.py          # Orchestrator
    ├── contract_analyzer/   # 4-Node Agentic Contract Analyzer Pipeline
    │   ├── ingestion_node.py    # Node 1: Hybrid RAG indexing & multi-dimensional retrieval
    │   ├── clause_extractor_node.py # Node 2: Parties, dates, payments & obligations
    │   ├── risk_audit_node.py   # Node 3: Deep liability & red flag detector
    │   ├── synthesis_formatter_node.py # Node 4: Plain summary & strict JSON formatting
    │   └── pipeline.py          # Orchestrator
    ├── search_service.py    # Serper.dev Google India search client
    ├── case_service.py      # Indian court-style advisory synthesis
    └── document_service.py  # PDF, DOCX, TXT multi-engine document extraction
```

---

## 🔄 Multi-Model Fallback Resilience Chain

To guarantee 99.9% uptime during evaluations and production load, the microservice implements a tailored, 100% non-Chinese priority fallback chain (`models/llm.py`):

```text
User Request
     │
     ├── 1. Primary Engine:
     │       - Legal Assistant: Meta Llama 3.3 70B (Statutory precision & BNSS/BNS context)
     │       - Contract Analyzer: OpenAI GPT-4o-mini (Strict JSON schema adherence)
     │       - Case Predictor: Meta Llama 3.3 70B (Judicial precedent balancing)
     │       └── If 404 / 402 / 429 / 500 Error ──► Automatically catches and retries
     │
     ├── 2. High-Speed Secondary Backup:
     │       - OpenAI GPT-4o-mini or Meta Llama 3.3 70B
     │       └── If busy / rate-limited ──► Automatically catches and retries
     │
     ├── 3. European Enterprise Backup:
     │       - Mistral Small 24B Instruct (France) — 1.1s latency, zero rate-limit friction
     │       └── If unavailable ──► Automatically catches and retries
     │
     └── 4. Free Zero-Credit Safety Net (NVIDIA, USA):
             - nvidia/nemotron-3.5-lightning:free (Contracts & Legal)
             - nvidia/nemotron-3-ultra-550b-a55b:free (Case Outcome Prediction)
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in `backend/python_backend/`:

```bash
cp .env.example .env
```

### Production `.env` Template
```env
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-xxxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_NAME=meta-llama/llama-3.3-70b-instruct

# Per-module primary models (optional overrides)
LEGAL_ASSISTANT_MODEL=meta-llama/llama-3.3-70b-instruct
CONTRACT_ANALYZER_MODEL=openai/gpt-4o-mini
CASE_PREDICTOR_MODEL=meta-llama/llama-3.3-70b-instruct
CASE_PREDICTOR_MODEL=openrouter/auto

# Serper.dev Key for Real-time Indian Law Search
SERPER_API_KEY=xxxxxx

PORT=8000
HOST=0.0.0.0
```

---

## 🚀 Running Locally

```bash
cd backend/python_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
* API Server: `http://localhost:8000`
* Swagger Interactive Docs: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

---

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t legalsmiths-ai .

# Run Docker container
docker run -p 8000:8000 --env-file .env legalsmiths-ai
```
