# LegalSmiths — Python AI Backend

> **AI microservice powering LegalSmiths**: A production-grade FastAPI application orchestrating three agentic AI pipelines for legal research, contract analysis, and case outcome prediction.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack & Rationale](#tech-stack--rationale)
4. [File Structure](#file-structure)
5. [Pipeline Descriptions](#pipeline-descriptions)
   - [Legal Assistant](#1-legal-assistant)
   - [Contract Analyzer](#2-contract-analyzer)
   - [Case Outcome Predictor](#3-case-outcome-predictor)
6. [API Reference](#api-reference)
7. [Environment Variables](#environment-variables)
8. [Local Setup](#local-setup)
9. [Render Deployment](#render-deployment)
10. [Design Decisions](#design-decisions)
11. [Known Limitations](#known-limitations)

---

## Overview

The LegalSmiths Python backend is an **AI microservice** built with FastAPI. It exposes three REST endpoints, each backed by a multi-node agentic pipeline that combines web research, retrieval-augmented generation (RAG), and large language model (LLM) reasoning to deliver grounded, legally-aware responses.

| Pipeline | Endpoint | Use Case |
|---|---|---|
| Legal Assistant | `POST /legalassistant` | Answers general legal questions using live Google India search + LLM synthesis |
| Contract Analyzer | `POST /contractanalyzer` | Performs clause extraction, 8-category risk audit, and executive summary on uploaded contracts |
| Case Outcome Predictor | `POST /caseoutcomeprediction` | Simulates an adversarial court debate and returns a probabilistic verdict |

All LLM calls route through **OpenRouter** as a unified gateway with automatic per-model failover, ensuring high availability without vendor lock-in.

---

## Architecture

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / multipart
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Application (main.py)                  │
│  CORS Middleware │ Lifespan Manager │ OpenAPI /docs              │
├──────────────────┬──────────────────┬───────────────────────────┤
│  /legalassistant │ /contractanalyzer │   /caseoutcomeprediction  │
│  (router)        │ (router)          │   (router)                │
└────────┬─────────┴────────┬──────────┴─────────────┬────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────────┐
  │  Legal      │  │  Contract        │  │  Case Outcome         │
  │  Assistant  │  │  Analyzer        │  │  Predictor            │
  │  Pipeline   │  │  Pipeline        │  │  Pipeline             │
  └──────┬──────┘  └───────┬──────────┘  └──────────┬────────────┘
         │                 │                         │
         ▼                 ▼                         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │               Shared Services Layer                          │
  │  search_service.py │ rag_service.py │ document_service.py   │
  └──────────────────────────┬──────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐      ┌────────────┐      ┌────────────┐
   │  Serper   │      │  FAISS +   │      │  OpenRouter│
   │  API      │      │  BM25 RAG  │      │  LLM GW    │
   │  (Search) │      │  (Vectors) │      │  (Models)  │
   └───────────┘      └────────────┘      └────────────┘
```

### OpenRouter Model Failover Chain

```
  Request ──► Primary Model ──[fail]──► Fallback 1 ──[fail]──► Fallback 2 ──[fail]──► Free Tier
                   │                        │                       │                      │
        llama-3.3-70b              gpt-4o-mini           mistral-small-24b        nemotron-3.5-free
        (Legal / Case)          (Contract primary)     (all pipelines)          (all pipelines)
```

---

## Tech Stack & Rationale

| Component | Technology | Rationale |
|---|---|---|
| **Web Framework** | FastAPI | Async-native, automatic OpenAPI docs, type-safe request/response via Pydantic |
| **LLM Gateway** | OpenRouter | Single API key across multiple providers; built-in failover without custom retry logic |
| **LLM Orchestration** | LangChain / LangGraph | Graph-based pipeline definition; nodes are composable and independently testable |
| **Vector Store** | FAISS | CPU-efficient approximate nearest-neighbour search; no external DB dependency |
| **Keyword Retrieval** | BM25 (rank_bm25) | Complements semantic search for exact legal term matching (statute names, clause labels) |
| **Reranker** | CrossEncoder (sentence-transformers) | Improves precision of hybrid retrieval results before passing to LLM |
| **Embedding Model** | `all-MiniLM-L6-v2` | Lightweight 384-dim model; fast on CPU, good general-purpose semantic similarity |
| **Web Search** | Serper API | Programmatic Google Search (India region) with structured JSON results |
| **Page Scraping** | BeautifulSoup4 | Extracts readable text from search result pages for grounded answers |
| **Document Parsing** | PyMuPDF / python-docx | Robust PDF and DOCX text extraction with layout preservation |
| **Fuzzy Matching** | rapidfuzz | 3-tier evidence verification (exact → fuzzy → token-level) for grounding engine |
| **Deployment** | Uvicorn + Render | ASGI server; zero-config cloud deployment via Render web service |

---

## File Structure

```
python_backend/
├── main.py                          # FastAPI app entry point: CORS, router mounting, lifespan
├── requirements.txt                 # All Python dependencies
├── Dockerfile                       # Container build definition
├── .env                             # Local environment secrets (git-ignored)
├── .env.example                     # Template for required environment variables
│
├── config/
│   └── settings.py                  # Pydantic Settings: env var parsing, model chains, DEVICE
│
├── models/
│   ├── llm.py                       # OpenRouter LLM client; failover chain; max_tokens=2500
│   └── embeddings.py                # sentence-transformers loader; respects DEVICE env var
│
├── routers/
│   ├── legal_assistant.py           # Route: POST /legalassistant
│   ├── contract_analyzer.py         # Route: POST /contractanalyzer (multipart file upload)
│   └── case_prediction.py           # Route: POST /caseoutcomeprediction
│
├── schemas/
│   ├── assistant_schemas.py         # Pydantic I/O models for Legal Assistant
│   ├── contract_schemas.py          # Mixed-type schema for flexible analysis JSON output
│   └── case_schemas.py              # Pydantic I/O models for Case Predictor
│
├── services/
│   ├── legal_assistant/             # 4-node Legal Assistant pipeline
│   │   ├── state.py                 # TypedDict pipeline state
│   │   ├── pipeline.py              # LangGraph graph definition and runner
│   │   ├── guardrail_node.py        # Off-topic / malicious prompt filter
│   │   ├── search_node.py           # Serper search + BeautifulSoup page fetch
│   │   ├── evaluator_node.py        # Validates search result relevance
│   │   └── synthesis_node.py        # LLM answer synthesis with citations
│   │
│   ├── contract_analyzer/           # 4-node Contract Analyzer pipeline
│   │   ├── state.py                 # TypedDict pipeline state
│   │   ├── pipeline.py              # LangGraph graph definition and runner
│   │   ├── ingestion_node.py        # Adaptive ingestion: full-doc or Hybrid RAG
│   │   ├── clause_extractor_node.py # Extracts parties, dates, terms, obligations
│   │   ├── risk_audit_node.py       # 8-category risk audit with evidence grounding
│   │   ├── synthesis_formatter_node.py  # Executive summary + recommendations + JSON
│   │   └── grounding_engine.py      # Evidence verification & section-number correction
│   │
│   ├── case_service.py              # LangGraph adversarial debate pipeline (Case Predictor)
│   ├── document_service.py          # PDF / DOCX text extraction utilities
│   ├── rag_service.py               # FAISS + BM25 hybrid retrieval service
│   └── search_service.py            # Serper API wrapper
│
└── data/
    └── indexes/                     # FAISS vector index + BM25 corpus storage
```

---

## Pipeline Descriptions

### 1. Legal Assistant

**Endpoint:** `POST /legalassistant`  
**Pipeline:** `services/legal_assistant/`  
**Model Chain:** `llama-3.3-70b-instruct` → `gpt-4o-mini` → `mistral-small-24b` → `nemotron-3.5-lightning:free`

```
User Question
     │
     ▼
┌──────────────────┐
│  guardrail_node  │── OFF-TOPIC / MALICIOUS ──► Return early refusal
└────────┬─────────┘
         │ SAFE
         ▼
┌──────────────────┐
│   search_node    │  Serper API → top-N Google India results
│                  │  BeautifulSoup → fetch & parse page content
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ evaluator_node   │── NOT RELEVANT ──► Trigger fallback / generic answer
└────────┬─────────┘
         │ RELEVANT
         ▼
┌──────────────────┐
│ synthesis_node   │  LLM synthesizes grounded answer with inline citations
└────────┬─────────┘
         │
         ▼
   { answer: string }
```

**Node Details:**

| Node | Responsibility |
|---|---|
| `guardrail_node` | Classifies the question against an allow-list of legal topics; blocks jailbreaks, off-topic requests (medical, financial, etc.), and prompt injections |
| `search_node` | Calls Serper API with `gl=in` (Google India) for jurisdiction-relevant results; fetches top result pages via BeautifulSoup for full-text context |
| `evaluator_node` | Scores retrieved content relevance against the original question; prevents hallucination by ensuring synthesis has valid source material |
| `synthesis_node` | Instructs the LLM to produce a structured answer grounded only in retrieved content; appends numbered citations |

---

### 2. Contract Analyzer

**Endpoint:** `POST /contractanalyzer`  
**Pipeline:** `services/contract_analyzer/`  
**Model Chain:** `gpt-4o-mini` → `llama-3.3-70b-instruct` → `mistral-small-24b` → `nemotron-3.5-lightning:free`

```
Uploaded File(s) + Request JSON
          │
          ▼
┌────────────────────┐
│  document_service  │  PDF → PyMuPDF, DOCX → python-docx
└─────────┬──────────┘
          │  raw_text
          ▼
┌────────────────────────────────────────────┐
│            ingestion_node                  │
│                                            │
│  len(text) ≤ 65,000 chars?                 │
│    YES → Full-Document Context             │
│           (zero chunking loss)             │
│                                            │
│    NO  → Hybrid RAG Pipeline               │
│           ┌─────────────────────────┐      │
│           │  FAISS MMR (semantic)   │      │
│           │  + BM25 (keyword)       │      │
│           │  → CrossEncoder rerank  │      │
│           │  × 6 retrieval dims:    │      │
│           │    liability, SLA,      │      │
│           │    payment, IP,         │      │
│           │    termination,         │      │
│           │    obligations          │      │
│           └─────────────────────────┘      │
└─────────┬──────────────────────────────────┘
          │  document_context
          ▼
┌────────────────────────┐
│  clause_extractor_node │  Extracts: parties, effective_date,
│                        │  expiry_date, payment_terms,
│                        │  obligations, termination_clauses
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐    ┌────────────────────────────────┐
│   risk_audit_node      │◄───│       grounding_engine         │
│                        │    │                                │
│  8-category checklist: │    │  extract_actual_contract_      │
│  1. Liability cap      │    │    sections() — regex scan     │
│  2. SLA / penalties    │    │  generate_section_directory_   │
│  3. Payment risk       │    │    text() — real section map   │
│  4. IP ownership       │    │  verify_and_ground_quote()     │
│  5. Termination risk   │    │    — 3-tier fuzzy/exact match  │
│  6. Obligations        │    │  correct_clause_reference()    │
│  7. Dispute resolution │    │    — fixes invented §numbers   │
│  8. Governing law      │    └────────────────────────────────┘
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────┐
│  synthesis_formatter_node  │
│                            │
│  • Executive summary       │
│  • Numbered recommendations│
│  • Final structured JSON   │
└──────────┬─────────────────┘
           │
           ▼
  { answers: [AnalysisObject] }
```

**Adaptive Ingestion Strategy:**

| Contract Size | Strategy | Rationale |
|---|---|---|
| ≤ 65,000 chars | Full-document context | Entire contract fits in LLM context window; no information loss from chunking |
| > 65,000 chars | Hybrid RAG (FAISS MMR + BM25 + CrossEncoder) | Retrieves only the most relevant clauses for each of 6 risk dimensions; prevents context overflow |

**Grounding Engine (`grounding_engine.py`):**

The grounding engine is a hallucination-prevention layer that runs before and after risk audit LLM calls:

- **`extract_actual_contract_sections()`** — Regex-scans the raw contract text for real section headings (e.g., `Section 4.2`, `Clause 7`, `Article III`)
- **`generate_section_directory_text()`** — Formats the discovered section map into a structured block injected into the LLM prompt, so the model knows what sections actually exist
- **`verify_and_ground_quote()`** — Three-tier match to confirm that every evidence quote the LLM cites actually appears in the contract:
  1. **Exact match** — substring search
  2. **Fuzzy match** — `rapidfuzz.fuzz.partial_ratio` ≥ 85
  3. **Token match** — key-token overlap ≥ 70%
- **`correct_clause_reference()`** — When the LLM invents a section number (e.g., `§ 12.3`), this function maps it to the nearest real section found by `extract_actual_contract_sections()`

---

### 3. Case Outcome Predictor

**Endpoint:** `POST /caseoutcomeprediction`  
**Pipeline:** `services/case_service.py`  
**Model Chain:** `llama-3.3-70b-instruct` → `gpt-4o-mini` → `mistral-small-24b` → `nemotron-3-ultra-550b-a55b:free`

```
Case Description + Parties + Facts
           │
           ▼
┌──────────────────────────┐
│    Legal Research Node   │  Serper API + official domain scraping
│                          │  (indiankanoon.org, sci.gov.in, etc.)
└──────────┬───────────────┘
           │  statutes, precedents, citations
           ▼
┌──────────────────────────┐
│  Claimant Counsel Node   │  LLM argues claimant's case; cites
│                          │  gathered statutes and precedents
└──────────┬───────────────┘
           │  claimant_brief
           ▼
┌──────────────────────────┐
│  Defence Counsel Node    │  LLM argues defendant's case; rebuts
│                          │  claimant brief with counter-precedents
└──────────┬───────────────┘
           │  defence_statement
           ▼
┌──────────────────────────┐
│  Citation Audit Node     │  Heuristic checks: validates statute
│                          │  names, section numbers, case citations
│                          │  against retrieved source content
└──────────┬───────────────┘
           │  verified_arguments
           ▼
┌──────────────────────────┐
│  Judicial Evaluator Node │  Weighs both sides; applies legal
│                          │  standards; outputs structured verdict
└──────────┬───────────────┘
           │
           ▼
  {
    verdict: string,
    winner: "claimant" | "defendant" | "unclear",
    win_probability: float,
    reasoning: string,
    key_factors: string[],
    applicable_law: string[],
    citations: string[]
  }
```

**Adversarial Design:** The pipeline deliberately assigns separate LLM calls to claimant and defence roles, preventing the model from producing a one-sided analysis. The judicial evaluator sees both briefs simultaneously and is instructed to reason from legal standards, not narrative strength.

---

## API Reference

### `GET /`

Health check with endpoint directory.

**Response:**
```json
{
  "service": "LegalSmiths AI Backend",
  "status": "running",
  "endpoints": ["/legalassistant", "/contractanalyzer", "/caseoutcomeprediction", "/health", "/docs"]
}
```

---

### `GET /health`

Detailed health status including compute device.

**Response:**
```json
{
  "status": "healthy",
  "device": "cpu"
}
```

---

### `POST /legalassistant`

Answers a legal question using live research and LLM synthesis.

**Request Body:** `application/json`
```json
{
  "question": "What are the grounds for anticipatory bail under Section 438 CrPC?"
}
```

**Response:** `200 OK`
```json
{
  "answer": "Under Section 438 of the Code of Criminal Procedure... [1] indiankanoon.org/..."
}
```

**Error Responses:**

| Code | Meaning |
|---|---|
| `400` | Off-topic or malicious question blocked by guardrail |
| `422` | Invalid request body (Pydantic validation failure) |
| `500` | LLM or search service error |

---

### `POST /contractanalyzer`

Analyzes one or more uploaded contract files.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more PDF or DOCX contract files |
| `request` | `string` (JSON) | Optional JSON string with analysis preferences |

**Response:** `200 OK`
```json
{
  "answers": [
    {
      "filename": "service_agreement.pdf",
      "executive_summary": "...",
      "clauses": {
        "parties": ["...", "..."],
        "effective_date": "...",
        "payment_terms": "...",
        "obligations": ["..."],
        "termination_clauses": ["..."]
      },
      "risk_audit": {
        "liability_cap": { "risk_level": "HIGH", "evidence": "...", "recommendation": "..." },
        "sla_penalties": { "risk_level": "MEDIUM", "evidence": "...", "recommendation": "..." },
        "payment_risk": { "risk_level": "LOW", "evidence": "...", "recommendation": "..." },
        "ip_ownership": { "risk_level": "HIGH", "evidence": "...", "recommendation": "..." },
        "termination_risk": { "risk_level": "MEDIUM", "evidence": "...", "recommendation": "..." },
        "obligations": { "risk_level": "LOW", "evidence": "...", "recommendation": "..." },
        "dispute_resolution": { "risk_level": "MEDIUM", "evidence": "...", "recommendation": "..." },
        "governing_law": { "risk_level": "LOW", "evidence": "...", "recommendation": "..." }
      },
      "recommendations": ["1. Negotiate liability cap...", "2. Clarify IP assignment..."]
    }
  ]
}
```

**Error Responses:**

| Code | Meaning |
|---|---|
| `400` | Unsupported file type |
| `422` | Malformed multipart request |
| `500` | Document parsing or LLM error |

---

### `POST /caseoutcomeprediction`

Simulates an adversarial court debate and returns a probabilistic verdict.

**Request Body:** `application/json`
```json
{
  "case_description": "Dispute over non-payment of software development fees",
  "claimant": "ABC Technologies Pvt Ltd",
  "defendant": "XYZ Corp",
  "jurisdiction": "Delhi High Court",
  "applicable_law": "Indian Contract Act, 1872",
  "facts": "..."
}
```

**Response:** `200 OK`
```json
{
  "verdict": "In favour of Claimant",
  "winner": "claimant",
  "win_probability": 0.73,
  "reasoning": "The claimant demonstrated...",
  "key_factors": ["Signed work order", "Partial payment acknowledgement"],
  "applicable_law": ["Indian Contract Act §73", "Specific Relief Act §10"],
  "citations": ["State of Rajasthan v. Basant Nehata (2005)"]
}
```

**Error Responses:**

| Code | Meaning |
|---|---|
| `422` | Missing required fields |
| `500` | LLM or search service error |

---

### `GET /docs`

Swagger UI — interactive API documentation auto-generated by FastAPI.

---

## Environment Variables

Copy `.env.example` to `.env` and populate all values before running locally.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8000` | Port the Uvicorn server listens on |
| `HOST` | No | `0.0.0.0` | Bind address |
| `DEVICE` | No | `cpu` | Compute device: `auto`, `cpu`, or `cuda` |
| `INDEX_DIR` | No | `./data/indexes` | Directory for FAISS and BM25 index files |
| `OPENROUTER_API_KEY` | **Yes** | — | OpenRouter API key (`sk-or-v1-...`) |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_MODEL_NAME` | No | `meta-llama/llama-3.3-70b-instruct` | Default model for OpenRouter client |
| `SERPER_API_KEY` | **Yes** | — | Serper.dev API key for Google Search |
| `LEGAL_ASSISTANT_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | Primary model for Legal Assistant pipeline |
| `CONTRACT_ANALYZER_MODEL` | No | `openai/gpt-4o-mini` | Primary model for Contract Analyzer pipeline |
| `CASE_PREDICTOR_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | Primary model for Case Predictor pipeline |
| `ADVOCATE_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | Model used for claimant & defence counsel nodes |
| `JUDGE_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | Model used for the judicial evaluator node |

**`.env.example`:**
```env
PORT=8000
HOST=0.0.0.0
DEVICE=cpu
INDEX_DIR=./data/indexes

OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_NAME=meta-llama/llama-3.3-70b-instruct

SERPER_API_KEY=your-serper-key-here

LEGAL_ASSISTANT_MODEL=meta-llama/llama-3.3-70b-instruct
CONTRACT_ANALYZER_MODEL=openai/gpt-4o-mini
CASE_PREDICTOR_MODEL=meta-llama/llama-3.3-70b-instruct
ADVOCATE_MODEL=meta-llama/llama-3.3-70b-instruct
JUDGE_MODEL=meta-llama/llama-3.3-70b-instruct
```

---

## Local Setup

### Prerequisites

- Python 3.10+
- `pip` / `venv`
- API keys: OpenRouter, Serper

### Steps

```bash
# 1. Navigate to the backend directory
cd backend/python_backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and fill in OPENROUTER_API_KEY and SERPER_API_KEY

# 5. Start the development server
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Base URL:** `http://localhost:8000`
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Running with Docker

```bash
# Build the image
docker build -t legalsmith-backend .

# Run with environment variables
docker run -p 8000:8000 --env-file .env legalsmith-backend
```

---

## Render Deployment

### Web Service Configuration

| Setting | Value |
|---|---|
| **Environment** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Standard (minimum) — CPU inference requires at least 1 GB RAM |

### Environment Variables on Render

Set the following in **Render Dashboard → Environment → Environment Variables**:

```
OPENROUTER_API_KEY     = sk-or-v1-...
SERPER_API_KEY         = ...
DEVICE                 = cpu
INDEX_DIR              = ./data/indexes
```

All other variables have sensible defaults and are optional.

### Notes

- Render automatically sets `PORT`; the start command uses `$PORT` to pick it up.
- First cold start may take 60–90 seconds while sentence-transformers downloads the embedding model weights. Subsequent starts are faster if the instance is kept warm.
- For GPU inference, upgrade to a Render GPU instance and set `DEVICE=cuda`.

---

## Design Decisions

### 1. OpenRouter as Unified LLM Gateway
Instead of integrating multiple provider SDKs (OpenAI, Anthropic, Together AI), all LLM calls go through OpenRouter's OpenAI-compatible API. This enables:
- **Single API key** across all models
- **Automatic failover** via ordered model chain in `config/settings.py`
- **Cost control** by placing free-tier models at the end of the chain

### 2. `max_tokens=2500` Hard Cap
OpenRouter charges for *reserved* tokens at request time, not just generated tokens. Setting `max_tokens` too high (e.g., 4096) causes `HTTP 402` errors on models with restrictive quotas. The 2500-token cap was empirically chosen to prevent this while keeping responses comprehensive.

### 3. Adaptive Ingestion (Full-Doc vs. Hybrid RAG)
The 65,000-character threshold was chosen because it comfortably fits within the context windows of `gpt-4o-mini` (128k) and `llama-3.3-70b` (128k) with room for the system prompt and response. Contracts below this threshold are processed without any chunking, eliminating the risk of splitting clauses mid-sentence. Larger contracts use Hybrid RAG across 6 legal dimensions to ensure the most relevant clauses are retrieved for each risk category.

### 4. BM25 + FAISS Hybrid Retrieval
Legal documents contain precise terminology (statute names, defined terms, section numbers) that semantic embeddings often de-emphasize. BM25 keyword retrieval captures these exact matches, while FAISS MMR (Maximal Marginal Relevance) provides semantic diversity. The CrossEncoder reranker then scores the merged candidate set for final precision.

### 5. Grounding Engine — Hallucination Prevention
LLMs frequently hallucinate section numbers and invent quotes when analyzing contracts. The grounding engine:
- Injects a **real section map** into every prompt, bounding what the model can cite
- **Verifies every evidence quote** post-generation with 3-tier fuzzy matching
- **Corrects invented section references** to the nearest real section by string similarity

This makes the risk audit output legally defensible and reproducible.

### 6. Adversarial Debate for Case Prediction
A single LLM call producing a verdict is prone to anchoring on the narrative framing of the input. The adversarial pipeline forces the model to steelman both sides before allowing the judicial evaluator to weigh arguments, producing more balanced and legally-reasoned outcomes.

### 7. No Chinese Models, No Gemini 2.5 Flash
Model selection was constrained to avoid data-residency concerns (no Chinese-hosted models) and to ensure consistent structured JSON output (Gemini 2.5 Flash had reliability issues in early testing with strict JSON schemas). The chosen chain covers frontier models (GPT-4o-mini), open-weight large models (Llama 3.3 70B), and free-tier fallbacks (Nemotron).

### 8. LangGraph with try/except Mocks
Pipeline orchestration uses LangGraph's graph API (`StateGraph`, `add_node`, `add_edge`). All LangGraph imports are wrapped in `try/except ImportError` blocks that substitute lightweight mock implementations. This allows the codebase to run (with degraded orchestration) even if LangGraph is not installed, simplifying CI/CD environments.

---

## Known Limitations

| Limitation | Impact | Mitigation / Roadmap |
|---|---|---|
| **Cold start latency** | First request after idle takes ~60–90 s while loading embedding model | Pre-warm with lifespan startup event; consider persistent workers |
| **No persistent FAISS index per document** | Contract indexes are built in-memory per request; large contracts re-index on every upload | Add Redis or SQLite-backed index cache keyed by document hash |
| **Serper rate limits** | Legal Assistant and Case Predictor share the same Serper key; concurrent requests may hit rate limits | Add per-endpoint Serper key rotation or caching layer |
| **max_tokens=2500 cap** | Very long contracts or complex cases may receive truncated analysis sections | Stream responses; use multiple synthesis calls for different sections |
| **No authentication / rate limiting** | All endpoints are publicly accessible | Add API key middleware or JWT auth before production exposure |
| **PDF layout sensitivity** | PyMuPDF extracts text in reading order; scanned PDFs or complex multi-column layouts may produce garbled text | Add OCR fallback (Tesseract) for image-based PDFs |
| **Jurisdiction scope** | Legal research is biased toward Indian law (Serper `gl=in`) | Add jurisdiction parameter to route searches to jurisdiction-appropriate domains |
| **Win probability is heuristic** | The `win_probability` field is an LLM estimate, not a statistically calibrated probability | Calibrate with historical case outcome datasets |
| **No conversation memory** | Each API call is stateless; follow-up questions lose prior context | Add session-based message history with Redis or in-memory store |
| **Embedding model CPU-only by default** | On CPU, embedding large contracts (>65k chars) adds ~2–5 s latency | Set `DEVICE=cuda` on GPU-enabled Render instances or use API-based embeddings |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run linting: `flake8 . --max-line-length 120`
4. Submit a pull request with a description of the change and any new ENV vars required

---

## License

This project is proprietary software developed for the LegalSmiths platform. All rights reserved.
