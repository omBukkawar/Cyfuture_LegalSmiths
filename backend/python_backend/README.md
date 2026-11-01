# LegalSmiths AI Backend (FastAPI Microservice)

The unified AI backend for **LegalSmiths**, powering AI Legal Advice, Advanced Contract Clause Analysis, and Judicial Case Outcome Prediction.

---

## 🌟 Key Architecture & Capabilities

```
backend/python_backend/
├── main.py                  # FastAPI application entrypoint & lifecycle
├── config/
│   └── settings.py          # Environment, device selection, and paths
├── models/
│   ├── llm.py               # Dedicated OpenRouter LLM provider
│   └── embeddings.py        # HuggingFace Embeddings & CrossEncoder models
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

### 1. 🏛️ Legal Assistant (`/legalassistant`)
* **Agentic 4-Node Pipeline:**
  1. **Node 1 (Guardrails):** Catches prompt injection, jailbreak attempts, and illegal solicitation before executing search or consuming LLM tokens.
  2. **Node 2 (Serper Search):** Fetches real-time Indian legal provisions, BNS/BNSS amendments, and court precedents.
  3. **Node 3 (Evaluator):** Scores relevance and filters out noise/foreign law, triggering internal fallback if necessary.
  4. **Node 4 (Synthesis):** OpenRouter LLM (`meta-llama/llama-3.3-70b-instruct`) generates plain-language advice with mandatory `[Act, Section]` citations.

### 2. 📜 Contract Analyzer (`/contractanalyzer`)
* **Agentic 4-Node Pipeline:**
  1. **Node 1 (Ingestion & Retrieval):** Chunks contract documents and runs an advanced Hybrid Retriever (BM25 sparse + FAISS dense MMR with Cross-Encoder reranker) across 5 core legal dimensions.
  2. **Node 2 (Clause Extractor):** Extracts operational terms (parties, critical dates, payment schedules, performance covenants, and termination triggers).
  3. **Node 3 (Risk Auditor):** Analyzes uncapped liabilities, one-sided indemnities, ambiguities, and computes a risk rating (`Low`, `Medium`, `High`).
  4. **Node 4 (Synthesis & Formatter):** Generates an executive summary, actionable amendment recommendations, and strictly formats the JSON matching frontend React tabs.

### 3. ⚖️ Case Outcome Prediction (`/caseoutcomeprediction`)
* Analyzes factual case summaries under Indian legal precedent.
* Computes win/loss probability percentage, strongest arguments, counterarguments, precedent citations, and statutory penalties.

---

## ⚙️ Environment Variables

Create or update `.env` in `backend/python_backend/`:

```env
# Server Configuration
PORT=8000
HOST=0.0.0.0
DEVICE=auto

# OpenRouter (Primary LLM Provider)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Per-Module Model Configuration (supports openrouter/auto or specific free models)
LEGAL_ASSISTANT_MODEL=openrouter/auto
CONTRACT_ANALYZER_MODEL=openrouter/auto
CASE_PREDICTOR_MODEL=openrouter/auto

# Serper API (Real-Time Google India Search)
SERPER_API_KEY=your_serper_api_key
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend/python_backend
pip install -r requirements.txt
```

### 2. Run the Development Server
```bash
uvicorn main:app --reload --port 8000
```

The service will be available at:
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 📡 API Endpoints

### 1. Legal Assistant
* **Method:** `POST /legalassistant`
* **Content-Type:** `application/json`
* **Request:**
  ```json
  {
    "questions": [
      "Can police arrest an accused without an arrest warrant in India?"
    ]
  }
  ```

### 2. Smart Contract Analyzer
* **Method:** `POST /contractanalyzer`
* **Content-Type:** `multipart/form-data`
* **Parameters:**
  * `request` (string): `"Please analyze this contract for liabilities and red flags."`
  * `files` (binary): One or more PDF, DOCX, or TXT contract files.

### 3. Case Outcome Prediction
* **Method:** `POST /caseoutcomeprediction`
* **Content-Type:** `application/json`
* **Request:**
  ```json
  {
    "questions": [
      "Petitioner entered into a registered lease agreement for commercial property. Respondent defaulted on rent for 6 months and refuses to vacate despite 30 days notice under Section 106 of the Transfer of Property Act."
    ]
  }
  ```

