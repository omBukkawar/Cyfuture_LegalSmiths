# LegalSmiths — Python AI Backend

> **AI Microservice powering LegalSmiths**: A production-grade FastAPI application orchestrating three multi-node agentic AI pipelines for legal Q&A, commercial contract risk auditing, and adversarial case outcome prediction.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Two-Critic Agentic Security Architecture](#two-critic-agentic-security-architecture)
4. [Tech Stack & Rationale](#tech-stack--rationale)
5. [File Structure](#file-structure)
6. [Pipeline Deep Dives](#pipeline-deep-dives)
   - [1. Legal Assistant](#1-legal-assistant)
   - [2. Contract Analyzer](#2-contract-analyzer)
   - [3. Case Outcome Predictor](#3-case-outcome-predictor)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)
9. [Local Setup](#local-setup)
10. [Deployment (Render)](#deployment-render)
11. [Design Decisions](#design-decisions)
12. [Known Limitations](#known-limitations)
13. [Contributing](#contributing)
14. [License](#license)

---

## Overview

The LegalSmiths Python backend is an **AI microservice** built with FastAPI. It exposes three high-concurrency REST endpoints, each backed by an agentic pipeline combining live web research, hybrid retrieval-augmented generation (RAG), grounding verification, and large language model (LLM) reasoning to deliver legally defensible, cited answers.

> **Direct Client Invocations**: The React frontend calls this microservice **directly** (`VITE_AI_API_URL`) for all inference generation. The Node.js backend does not act as an AI proxy.

| Pipeline | Endpoint | Rate Limit | Timeout | Primary Engine |
|---|---|---|---|---|
| **Legal Assistant** | `POST /legalassistant` | 20/min | 90s | `meta-llama/llama-3.3-70b-instruct` |
| **Contract Analyzer** | `POST /contractanalyzer` | 10/min | 180s | `openai/gpt-4o-mini` |
| **Case Outcome Predictor** | `POST /caseoutcomeprediction` | 10/min | 180s | `meta-llama/llama-3.3-70b-instruct` |

All LLM calls route through **OpenRouter** as a unified gateway with automatic priority fallback chains, zero vendor lock-in, and strict model constraints (no Chinese models, no rate-limited Gemini 2.5 Flash).

---

## Architecture

### System Flow Diagram

```
                        CLIENT (React Frontend directly)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FastAPI Application (main.py)                         │
│     CORS Middleware · slowapi Rate Limiting · Lifespan · OpenAPI Docs       │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  POST /legalassistant│ POST /contractanalyzer│ POST /caseoutcomeprediction  │
│  (limiter: 20/min)   │ (limiter: 10/min)    │ (limiter: 10/min)             │
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Input Critic Agent (services/agents/input_critic.py)         │
│     Layer 1: Structural Regex (XSS, Path Traversal, Flooding, Size Limit)   │
│     Layer 2: LLM Semantic Critic (Intent: LEGAL, OFF_TOPIC, INJECTION, ...) │
│     Fail-Open Policy: Critic failures never block legitimate user requests  │
└──────────┬──────────────────────┬───────────────────────────┬───────────────┘
           │ SAFE                 │ SAFE                      │ SAFE
           ▼                      ▼                           ▼
    ┌─────────────┐        ┌──────────────┐          ┌─────────────────┐
    │    Legal    │        │   Contract   │          │  Case Outcome   │
    │  Assistant  │        │   Analyzer   │          │    Predictor    │
    │   Pipeline  │        │   Pipeline   │          │ Adversarial RAG │
    └──────┬──────┘        └──────┬───────┘          └────────┬────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Output Critic Agent (services/agents/output_critic.py)       │
│     LLM-powered output review for completeness, legal accuracy & formatting │
│     Confidence threshold >= 85 required to reject; fail-open fallback       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                             200 OK JSON Response
```

### OpenRouter Priority Fallback Chains

If a model returns `404` (rotated), `402` (quota reservation), `429` (upstream rate limit), or `500` (downtime), `models/llm.py` automatically falls back to the next model in the chain using exact model identifiers from `config/settings.py`:

```
Pipeline               Primary Model                 Fallback 1            Fallback 2                               Fallback Free Tier
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Legal Assistant    ──► meta-llama/llama-3.3-70b-instruct ──► openai/gpt-4o-mini ──► mistralai/mistral-small-24b-instruct-2501 ──► nvidia/nemotron-3.5-lightning:free
Contract Analyzer  ──► openai/gpt-4o-mini                ──► meta-llama/llama-3.3-70b-instruct ──► mistralai/mistral-small-24b-instruct-2501 ──► nvidia/nemotron-3.5-lightning:free
Case Predictor     ──► meta-llama/llama-3.3-70b-instruct ──► openai/gpt-4o-mini ──► mistralai/mistral-small-24b-instruct-2501 ──► nvidia/nemotron-3-ultra-550b-a55b:free
```

---

## Two-Critic Agentic Security Architecture

Rather than relying solely on brittle regex expressions that break on typos, leetspeak, or harmless legal vocabulary (e.g. "drop charges", "court select"), LegalSmiths implements a **two-critic architecture**:

### 1. Input Critic Agent (`services/agents/input_critic.py`)

- **Layer 1 — Structural Guard (Regex / Fast Path)**:
  - Zero-latency syntactic checks for unambiguous attacks:
    - XSS & script tags (`<script>`, `javascript:`, `onload=`, `eval()`)
    - Path traversal & command injection (`../`, `/etc/passwd`, `$(...)`, shell pipes)
    - Payload size limits (5k chars for Assistant, 2k for Contract prompt, 6k for Case facts)
    - Repetition flooding & character DoS protection.
- **Layer 2 — LLM Semantic Critic (Intent Classifier)**:
  - Invokes a fast LLM (`openai/gpt-4o-mini`) to classify user intent into 5 categories:
    - `LEGAL`: Genuine legal question or case description.
    - `OFF_TOPIC`: Questions about cooking (e.g., paneer tikka), sports, movies, coding, etc.
    - `INJECTION`: Prompt injection, jailbreak attempts (DAN mode), instruction overrides, leetspeak tricks.
    - `ILLICIT`: Requests to forge documents, bribe officials, launder money.
    - `UNCLEAR`: Vague inputs (defaulting to safe).
  - Returns friendly role-defining messages explaining the module's exact purpose.
  - **Fail-Open**: If the critic times out or encounters network failure, the request is permitted through.

### 2. Output Critic Agent (`services/agents/output_critic.py`)

- Runs after pipeline execution before returning the response to the user.
- Verifies module-specific structural completeness:
  - **Legal Assistant**: Non-empty, substantively answers legal query, contains legal references.
  - **Contract Analyzer**: Verified JSON structure, no raw unparsed JSON strings, valid risk rubric.
  - **Case Predictor**: Valid verdict structure, reasoned balancing of claimant vs defence.
- **Confidence threshold**: Only rejects with confidence >= 85%. Low confidence rejections fail-open to protect user experience.

---

## Tech Stack & Rationale

| Component | Technology | Rationale |
|---|---|---|
| **Web Framework** | FastAPI (0.110+) | High-performance asynchronous routing, Pydantic data validation, auto-generated OpenAPI/Swagger UI |
| **Rate Limiter** | slowapi | In-memory token bucket rate limiting per IP address to safeguard upstream API quotas |
| **LLM Gateway** | OpenRouter | Single unified API for multi-provider models with automated client-side fallback chains |
| **Pipeline Framework** | LangChain & LangGraph | Modular, stateful multi-node graphs with conditional branching and structured state passing |
| **Vector Store** | FAISS (`faiss-cpu`) | Ultra-fast in-memory similarity search without requiring heavy external vector database servers |
| **Keyword Retrieval** | BM25 (`rank-bm25`) | Lexical search capturing exact legal statute citations, party names, and section numbers |
| **Reranker** | CrossEncoder | Scores query-document pairs jointly to provide deep semantic ranking of retrieved contract clauses |
| **Embeddings** | `all-MiniLM-L6-v2` | Lightweight 384-dimensional sentence transformer model optimized for rapid CPU inference |
| **Live Web Search** | Serper.dev | Programmatic Google Search API with Indian geolocation (`gl=in`) for statutory and case precedents |
| **Web Scraping** | BeautifulSoup4 | Clean HTML content extraction from official Indian legal databases (e.g., Indian Kanoon) |
| **Document Parsing** | PyPDF / python-docx / unstructured | Resilient text extraction across PDF, DOCX, DOC, and TXT contract uploads |

---

## File Structure

```
backend/python_backend/
├── .dockerignore                     # Docker build exclusions
├── .env.example                      # Template for required environment variables
├── Dockerfile                        # Production container build specification
├── limiter.py                        # Standalone slowapi Limiter instance (prevents circular imports)
├── main.py                           # FastAPI application entry, slowapi, CORS, lifespan, GET /
├── README.md                         # Microservice documentation
├── requirements.txt                  # Pinned Python package dependencies
│
├── config/
│   ├── __init__.py
│   └── settings.py                   # Pydantic Settings, OpenRouter model priority lists, device selection
│
├── data/
│   └── indexes/                      # Local storage directory for pre-built FAISS and BM25 index files
│
├── models/
│   ├── __init__.py
│   ├── embeddings.py                 # sentence-transformers HuggingFace embeddings loader
│   └── llm.py                        # OpenRouter LLM wrapper, automatic fallback logic, max_tokens=2500 cap
│
├── routers/
│   ├── __init__.py
│   ├── case_prediction.py            # Route: POST /caseoutcomeprediction (timeout: 180s, limit: 10/min)
│   ├── contract_analyzer.py          # Route: POST /contractanalyzer (timeout: 180s, limit: 10/min)
│   └── legal_assistant.py            # Route: POST /legalassistant (timeout: 90s, limit: 20/min)
│
├── schemas/
│   ├── __init__.py
│   ├── assistant_schemas.py          # Pydantic models for Legal Assistant requests and answers
│   ├── case_schemas.py               # Pydantic models for adversarial debate verdict outputs
│   └── contract_schemas.py           # Pydantic models supporting flexible Mixed-type analysis structures
│
├── scripts/
│   └── __pycache__/                  # Script cache directory
│
└── services/
    ├── __init__.py
    ├── case_service.py               # 5-Stage LangGraph Adversarial Debate Pipeline
    ├── contract_service.py           # Facade wrapper executing contract analyzer pipeline
    ├── document_service.py           # Multi-format text extraction (PDF, DOCX, DOC, TXT)
    ├── input_guard.py                # Facade delegating input validation to InputCriticAgent
    ├── rag_service.py                # FAISS vector store + BM25 hybrid retrieval
    ├── search_service.py             # Serper.dev API client wrapper
    │
    ├── agents/
    │   ├── __init__.py
    │   ├── input_critic.py           # 2-layer Input Critic Agent (Structural + LLM Intent)
    │   └── output_critic.py          # Post-generation Output Critic Agent with confidence filtering
    │
    ├── contract_analyzer/            # 4-Node Contract Risk Audit Pipeline
    │   ├── __init__.py
    │   ├── clause_extractor_node.py  # Extraction of parties, dates, payments, termination, obligations
    │   ├── grounding_engine.py       # Regex section discovery, quote verification, reference correction
    │   ├── ingestion_node.py         # Adaptive ingestion: Full-Doc (<=65k) vs Hybrid RAG (>65k)
    │   ├── pipeline.py               # Graph execution runner
    │   ├── risk_audit_node.py        # 8-category commercial risk audit
    │   ├── state.py                  # ContractAnalyzerState TypedDict
    │   └── synthesis_formatter_node.py # Executive summary & structured JSON formatting
    │
    └── legal_assistant/              # 4-Node Legal Assistant Pipeline
        ├── __init__.py
        ├── evaluator_node.py         # Context relevance and validity filter
        ├── guardrail_node.py         # Safety and prompt injection validation
        ├── pipeline.py               # Graph execution runner
        ├── search_node.py            # Serper.dev Google India search + BeautifulSoup page extraction
        ├── state.py                  # LegalAssistantState TypedDict
        └── synthesis_node.py         # Final legal opinion synthesis with statutory citations
```

---

## Pipeline Deep Dives

### 1. Legal Assistant

**Endpoint:** `POST /legalassistant`  
**Execution:** 4-Node LangGraph Flow  
**Primary Engine:** `meta-llama/llama-3.3-70b-instruct`  

```
User Query ──► Input Critic (Structural + Semantic)
                     │ SAFE
                     ▼
             guardrail_node (Malicious Intent Filter)
                     │
                     ▼
             search_node (Serper.dev Google India Search + BS4 Content Fetch)
                     │
                     ▼
             evaluator_node (Relevance Filtering & Noise Reduction)
                     │
                     ▼
             synthesis_node (Grounded Indian Legal Synthesis with Citations)
                     │
                     ▼
             Output Critic (Quality Review) ──► 200 OK Response
```

- **Live Research**: Retrieves authoritative statutes, Central Acts, High Court rulings, and Supreme Court precedents.
- **Strict Grounding**: The LLM synthesizes conclusions strictly anchored in fetched evidence.

---

### 2. Contract Analyzer

**Endpoint:** `POST /contractanalyzer` (multipart/form-data)  
**Execution:** 4-Node Agentic Pipeline + Grounding Engine  
**Primary Engine:** `openai/gpt-4o-mini`  

```
Contract Files (PDF/DOCX/TXT) + Instruction
                     │
                     ▼
          Input Critic (Input Validation)
                     │
                     ▼
            ingestion_node (Adaptive Ingestion)
               │
               ├── len(text) <= 65k chars ──► Full Document Context (Zero chunking loss)
               └── len(text) > 65k chars  ──► Hybrid RAG (BM25 + FAISS MMR + CrossEncoder Reranker)
                     │
                     ▼
        clause_extractor_node (Parties, Dates, Payment Terms, Termination, Obligations)
                     │
                     ▼
           risk_audit_node <──► grounding_engine.py
               │                  ├── extract_actual_contract_sections()
               │                  ├── generate_section_directory_text()
               │                  ├── verify_and_ground_quote() (3-tier match)
               │                  └── correct_clause_reference()
               ▼
     synthesis_formatter_node (Executive Summary, Red Flags, Missing Protections, Amendments)
                     │
                     ▼
          Output Critic (Schema Validation) ──► 200 OK JSON
```

#### Grounding Engine Features:
1. **Section Discovery**: Regex scans real contract headings (`Section 12. Indemnification`, `Clause 14`), preventing fabricated section numbers.
2. **Quote Verification**: Three-tier matching (exact substring, fuzzy token ratio >= 85, token overlap >= 70%) confirms citations exist verbatim in the document.
3. **8-Category Commercial Checklist**: Evaluates liability caps, SLA remedies, renewal fee escalations, subcontracting carve-outs, IP ownership, customer handover, and clause symmetry.

---

### 3. Case Outcome Predictor

**Endpoint:** `POST /caseoutcomeprediction`  
**Execution:** 5-Stage LangGraph Adversarial Debate Pipeline  
**Primary Engine:** `meta-llama/llama-3.3-70b-instruct`  

```
Case Facts Statement ──► Input Critic
                              │ SAFE
                              ▼
                     legal_research_node (Precedent & Statute Retrieval)
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
     claimant_counsel_node         defence_counsel_node
   (Statutes, Proof Elements)   (Defences, Distinctions, Rebuttals)
               └──────────────┬──────────────┘
                              ▼
                     citation_audit_node (Statutory Citation Verification)
                              ▼
                   judicial_evaluator_node (Impartial Bench Comparison)
                              │
                              ▼
                   Output Critic (Verdict Validation) ──► 200 OK Verdict JSON
```

- **Adversarial Steelmanning**: Rather than asking a single LLM to guess a verdict, separate models rigorously argue claimant and defence positions before an impartial judicial evaluator decides the prevailing side.
- **Detailed Output**: Provides comparative verdict, win probability, side-by-side scorecard, winning points, vulnerabilities, and tactical next steps.

---

## API Reference

### `GET /`
Health check and endpoint catalogue.
```json
{
  "status": "online",
  "service": "LegalSmiths AI Backend",
  "version": "2.0.0",
  "endpoints": [
    "/legalassistant",
    "/contractanalyzer",
    "/caseoutcomeprediction",
    "/health",
    "/docs"
  ]
}
```

---

### `GET /health`
Returns service status and compute device.
```json
{
  "status": "healthy",
  "device": "cpu"
}
```

---

### `POST /legalassistant`
Answers legal inquiries grounded in real-time Indian legal search.

- **Rate Limit**: `20/minute`
- **Timeout**: `90 seconds`
- **Request Body**:
```json
{
  "questions": [
    "What are the mandatory legal requirements for filing an anticipatory bail application under Section 438 of the Code of Criminal Procedure?"
  ]
}
```
- **Response (`200 OK`)**:
```json
{
  "answers": [
    "Under Section 438 of the Code of Criminal Procedure, 1973 (and corresponding Section 482 of the Bharatiya Nagarik Suraksha Sanhita, 2023), anticipatory bail may be sought by a person who has reason to believe they may be arrested on an accusation of having committed a non-bailable offence...\n\nReferences:\n1. Supreme Court of India - Gurbaksh Singh Sibbia v. State of Punjab\n2. Sushila Aggarwal v. State (NCT of Delhi) (2020)"
  ]
}
```

---

### `POST /contractanalyzer`
Analyzes uploaded contract documents for commercial risks, ambiguities, and missing provisions.

- **Rate Limit**: `10/minute`
- **Timeout**: `180 seconds`
- **Request**: `multipart/form-data`
  - `files`: One or more contract files (`.pdf`, `.docx`, `.doc`, `.txt`, max 20MB each, up to 5 files).
  - `request`: String instruction (default: `"Please perform a complete evidence-backed contract risk audit."`).
- **Response (`200 OK`)**:
```json
{
  "answers": [
    {
      "title": "Commercial Agreement Risk Audit",
      "risk_level": "High",
      "plain_summary": "The agreement presents significant financial exposure due to uncapped indemnification carve-outs...",
      "risk_assessment": {
        "overall_level": "High",
        "score_rationale": "Indemnification obligations are carved out from the limitation of liability cap.",
        "rubric_breakdown": {
          "financial_exposure": "Critical (uncapped indemnity)",
          "dispute_probability": "Medium",
          "clause_symmetry": "One-sided",
          "cross_clause_interaction": "Severe"
        }
      },
      "red_flags": [
        {
          "title": "Uncapped Indemnification Liability",
          "severity": "Critical",
          "clause_reference": "Section 13 (Limitation of Liability)",
          "evidence": "Neither party's liability under Section 12 (Indemnification) shall be limited by this Section 13.",
          "explanation": "Carving out indemnity obligations exposes the indemnifying party to unlimited liability.",
          "impact": "Financial exposure can exceed total contract value.",
          "recommendation": "Negotiate a super-cap on indemnification liabilities (e.g., 2x annual contract value)."
        }
      ],
      "missing_protections": [],
      "mistakes_ambiguities": [],
      "recommendations": "1. Insert an aggregate liability cap covering indemnification...\n2. Define objective SLA resolution metrics."
    }
  ]
}
```

---

### `POST /caseoutcomeprediction`
Predicts outcome of legal disputes using adversarial claimant vs defence deliberation.

- **Rate Limit**: `10/minute`
- **Timeout**: `180 seconds`
- **Request Body**:
```json
{
  "questions": [
    "A consumer purchased a high-end laptop with an extended warranty. Within 4 months, the motherboard malfunctioned. The manufacturer refused repair or refund, claiming liquid damage despite service center inspection showing no liquid traces. Consumer has complete email records and job sheet."
  ],
  "case_type": "consumer",
  "jurisdiction": "District Consumer Disputes Redressal Commission",
  "incident_date": "2024-03-15"
}
```
- **Response (`200 OK`)**:
```json
{
  "answers": [
    {
      "comparative_verdict": "LIKELY_CLAIMANT_PREVAILS",
      "winning_side": "claimant",
      "confidence_score": 85,
      "verdict_summary": "The claimant has established a prima facie case of deficiency in service under Consumer Protection Act 2019...",
      "case_theory": {
        "claimant_theory": "Unfair trade practice and deficiency of service under Section 2(11) of CPA 2019.",
        "defence_theory": "Warranty voided by customer-induced damage."
      },
      "point_by_point_clashes": [],
      "tactical_next_steps_for_lawyer": []
    }
  ]
}
```

---

## Environment Variables

Create `.env` in `backend/python_backend/` (template provided in `.env.example`):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | Optional | `8000` | Port for the Uvicorn web server |
| `HOST` | Optional | `0.0.0.0` | Bind host address |
| `DEVICE` | Optional | `auto` | Device for embedding models (`auto`, `cpu`, or `cuda`) |
| `INDEX_DIR` | Optional | `./data/indexes` | Storage location for FAISS and BM25 index files |
| `OPENROUTER_API_KEY` | **Required** | — | Secret API key for OpenRouter LLM gateway |
| `OPENROUTER_BASE_URL` | Optional | `https://openrouter.ai/api/v1` | OpenRouter API base endpoint |
| `SERPER_API_KEY` | **Required** | — | Serper.dev API key for Google India live legal search |
| `LEGAL_ASSISTANT_MODEL` | Optional | `meta-llama/llama-3.3-70b-instruct` | Primary model for Legal Assistant pipeline |
| `CONTRACT_ANALYZER_MODEL`| Optional | `openai/gpt-4o-mini` | Primary model for Contract Analyzer pipeline |
| `CASE_PREDICTOR_MODEL` | Optional | `meta-llama/llama-3.3-70b-instruct` | Primary model for Case Outcome Predictor |
| `ADVOCATE_MODEL` | Optional | `meta-llama/llama-3.3-70b-instruct` | Model for Claimant and Defence nodes in Case Predictor |
| `JUDGE_MODEL` | Optional | `meta-llama/llama-3.3-70b-instruct` | Model for Judicial Evaluator node |
| `LEGAL_ASSISTANT_TIMEOUT`| Optional | `90` | Legal Assistant execution timeout in seconds |
| `CONTRACT_ANALYZER_TIMEOUT`| Optional| `180` | Contract Analyzer execution timeout in seconds |
| `CASE_PREDICTOR_TIMEOUT` | Optional | `180` | Case Predictor execution timeout in seconds |
| ALLOWED_ORIGINS | Optional | http://localhost:5173,https://legalsmiths.onrender.com | Comma-separated CORS origins permitted to query API |
| OPENROUTER_MODEL_NAME | Optional | meta-llama/llama-3.3-70b-instruct | Global fallback model identifier across all pipelines |

---

## Local Setup

### Prerequisites
- Python 3.10, 3.11, or 3.12
- Valid OpenRouter API Key ([openrouter.ai](https://openrouter.ai/))
- Valid Serper.dev API Key ([serper.dev](https://serper.dev/))

### Installation Steps

```bash
# 1. Navigate to the Python backend directory
cd backend/python_backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Open .env and insert your OPENROUTER_API_KEY and SERPER_API_KEY

# 5. Run the FastAPI development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will initialize at:
- **API Base:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## Deployment (Render)

The microservice deploys as a **Web Service** on Render:

| Field | Configuration |
|---|---|
| **Environment** | `Python` |
| **Root Directory** | `backend/python_backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path**| `/health` |

### Required Environment Variables on Render Dashboard
- `OPENROUTER_API_KEY`
- `SERPER_API_KEY`
- `DEVICE` = `cpu`
- `INDEX_DIR` = `./data/indexes`

> [!NOTE]
> On the free tier, initial cold start takes approximately 45–75 seconds as PyTorch and sentence-transformer models load into memory.

---

## Design Decisions

1. **Unified OpenRouter Gateway with Strict Model Boundaries**:
   - Zero dependence on Chinese model providers (ensuring data privacy).
   - Removed Gemini 2.5 Flash to eliminate aggressive quota rate limiting (`429`).
   - Strict `max_tokens=2500` ceiling prevents credit reservation failures (`HTTP 402`).
2. **Two-Critic System Over Raw Regex**:
   - Syntactic regex handles unambiguous attacks (XSS, path traversal, payload size).
   - Fast semantic LLM agent (`openai/gpt-4o-mini`) evaluates actual user intent, rejecting off-topic inputs gracefully while eliminating false positives on legitimate legal terms.
3. **Adaptive Ingestion**:
   - Contracts under 65,000 characters are fed in full to the LLM (zero chunking context loss).
   - Contracts over 65,000 characters use hybrid BM25 + FAISS MMR retrieval with CrossEncoder reranking across 6 risk dimensions.
4. **Standalone Limiter (`limiter.py`)**:
   - Initialized outside `main.py` to break circular import dependencies when routers attach `@limiter.limit` decorators.

---

## Known Limitations

| Limitation | Impact | Mitigation / Status |
|---|---|---|
| **Free-Tier Cold Starts** | 45–75s delay after 15 minutes of inactivity on Render | Keep-warm cron ping or upgraded standard tier instance |
| **Stateless Memory** | Each query executes independently; follow-up questions do not remember previous messages | Conversational history stored in MongoDB and injected by frontend |
| **OCR for Scanned PDFs** | Pure image-scanned PDFs without embedded text cannot be extracted | Supported formats: text-based PDF, DOCX, DOC, TXT |
| **Jurisdictional Focus** | Default search settings target Indian jurisdiction (`gl=in`) | General common-law principles still apply to foreign contracts |

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Follow PEP 8 style guidelines.
3. Test all endpoints locally before submitting a PR.

---

## License

MIT License — Copyright (c) 2026 LegalSmiths.
