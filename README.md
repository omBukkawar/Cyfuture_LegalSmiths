# ⚖️ LegalSmiths — AI-Powered Legal Intelligence Platform

<div align="center">

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic-FF6B35?style=for-the-badge)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM_Gateway-7C3AED?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-TiDB_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Deployed on Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**A full-stack AI legal intelligence platform engineered for the Indian legal ecosystem.**  
Conversational legal Q&A · Contract risk analysis · Case outcome prediction — all powered by agentic LangGraph pipelines.

[🌐 Live Demo](https://legalsmiths.onrender.com) · [🤖 AI Backend](https://legalsmiths-ai.onrender.com/docs) · [📡 Node API](https://legalsmiths-node.onrender.com)

</div>

---

## 📸 Screenshots

> _Screenshots / GIF demos go here._

| Homepage | Legal Assistant | Contract Analyzer | Case Predictor |
|---|---|---|---|
| ![Home](docs/screenshots/home.png) | ![Assistant](docs/screenshots/assistant.png) | ![Contracts](docs/screenshots/contracts.png) | ![Predictor](docs/screenshots/predictor.png) |

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Tech Stack](#-tech-stack)
4. [AI Pipelines](#-ai-pipelines)
5. [Database Design](#-database-design)
6. [Frontend Routes](#-frontend-routes)
7. [API Reference](#-api-reference)
8. [Environment Variables](#-environment-variables)
9. [Local Setup](#-local-setup)
10. [Project Structure](#-project-structure)
11. [Deployment (Render)](#-deployment-render)
12. [Contributing](#-contributing)
13. [License](#-license)

---

## 🧭 Overview

**LegalSmiths** is a production-grade, full-stack AI platform that democratises access to Indian legal intelligence. It exposes three distinct AI-powered features, each backed by its own agentic pipeline:

| Feature | What It Does |
|---|---|
| **⚡ Legal Assistant** | Conversational AI for Indian legal Q&A with live Google India search, cited grounded answers |
| **📄 Contract Analyzer** | Upload PDF / DOCX contracts → 4-node agentic pipeline → risk audit with grounded evidence, red flags, missing protections, and PDF report |
| **⚖️ Case Outcome Predictor** | LangGraph adversarial debate: Claimant brief → Defence brief → Citation audit → Judicial evaluator → Win probability verdict |

The platform is split into **three independently deployed services**:

| Service | Technology | Port | Live URL |
|---|---|---|---|
| **Frontend** | React 18 + Vite + React Router | 5173 | [legalsmiths.onrender.com](https://legalsmiths.onrender.com) |
| **Node Backend** | Express 5 + MongoDB Atlas + MySQL (TiDB) | 5000 | [legalsmiths-node.onrender.com](https://legalsmiths-node.onrender.com) |
| **Python AI Backend** | FastAPI + LangGraph + OpenRouter | 8000 | [legalsmiths-ai.onrender.com](https://legalsmiths-ai.onrender.com) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                                   │
│                      React 18 + Vite (Port 5173)                            │
│          /legalAssistant  /contractAnalyzer  /casePrediction                │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │  REST / JSON
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS BACKEND  (Port 5000)                         │
│                     Express 5 · JWT Auth · Multer                           │
│                                                                             │
│   ┌──────────────┐    ┌──────────────────┐    ┌────────────────────────┐   │
│   │  MySQL/TiDB  │    │  MongoDB Atlas   │    │  Proxy → AI Backend    │   │
│   │  (users)     │    │  (chats/cases/   │    │  (FastAPI Port 8000)   │   │
│   └──────────────┘    │   contracts)     │    └────────────────────────┘   │
│                       └──────────────────┘                                  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │  REST / JSON
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PYTHON AI BACKEND  (Port 8000)                          │
│                 FastAPI · LangChain · LangGraph · OpenRouter                │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │  Legal Assistant │  │  Contract Analyzer   │  │  Case Predictor       │  │
│  │  4-Node Pipeline │  │  4-Node Agentic      │  │  Adversarial Debate   │  │
│  │  (LangGraph)     │  │  Pipeline (LangGraph)│  │  Pipeline (LangGraph) │  │
│  └────────┬─────────┘  └──────────┬───────────┘  └──────────┬────────────┘  │
│           │                       │                          │               │
│           └───────────────────────┼──────────────────────────┘               │
│                                   ▼                                          │
│               ┌───────────────────────────────────────┐                     │
│               │          OpenRouter LLM Gateway        │                     │
│               │  Llama 3.3 70B · GPT-4o-mini ·        │                     │
│               │  Mistral Small · Nemotron (fallback)   │                     │
│               └───────────────────────────────────────┘                     │
│                                                                             │
│           ┌─────────────────┐          ┌──────────────────────┐             │
│           │  Serper.dev API  │          │  FAISS + BM25 +      │             │
│           │  (Google India)  │          │  CrossEncoder RAG    │             │
│           └─────────────────┘          └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Why Chosen |
|---|---|---|
| **React** | 18 | Concurrent rendering, battle-tested ecosystem, component reuse across 3 feature pages |
| **Vite** | 5 | Sub-second HMR, ES module native bundling — 10× faster DX than CRA |
| **React Router** | 6 | Nested layouts, `<Outlet>`, declarative protected routes |
| **Poppins (Google Fonts)** | — | Clean, modern font that projects legal authority without heaviness |
| **Custom CSS (no Tailwind)** | — | Full design control, smaller CSS bundle, no purge configuration needed |

### Node.js Backend

| Technology | Version | Why Chosen |
|---|---|---|
| **Express** | 5 | Minimal HTTP framework; v5 async error handling eliminates try/catch boilerplate |
| **jsonwebtoken** | — | Stateless auth — access (15 min) + refresh (7 d) token pair for secure session management |
| **bcryptjs** | — | Password hashing with salt — industry standard, pure JS (no native deps) |
| **Multer** | — | Streaming file upload middleware; feeds PDF/DOCX directly to AI backend |
| **MySQL2 / TiDB Cloud** | — | ACID transactions for user identity; TiDB is MySQL-compatible serverless with free tier |
| **Mongoose / MongoDB Atlas** | — | Flexible schema for heterogeneous AI outputs (chat history, contract analysis JSON, case verdicts) |
| **CORS + Helmet** | — | Security headers, cross-origin control between the three services |

### Python AI Backend

| Technology | Version | Why Chosen |
|---|---|---|
| **FastAPI** | 0.100+ | Async-first, automatic OpenAPI docs (`/docs`), Pydantic validation, 3× faster than Flask under load |
| **LangGraph** | — | Stateful agentic graph execution with explicit node → edge routing; enables rollback and conditional branching |
| **LangChain** | — | Unified LLM interface, prompt templates, chain composition; reduces boilerplate across 3 pipelines |
| **OpenRouter** | — | Single API key → 200+ models; automatic failover across model hierarchy without code changes |
| **Serper.dev** | — | Google India geotargeted search API; returns real legal citations from Indian courts |
| **BeautifulSoup4** | — | Lightweight HTML scraping to extract full page content from search result URLs |
| **FAISS** | — | Facebook's vector similarity search — GPU-optionally scales to millions of contract chunks |
| **BM25 (rank_bm25)** | — | Keyword-based retrieval complements dense FAISS for exact clause term matching |
| **CrossEncoder (sentence-transformers)** | — | Reranks retrieved chunks by relevance before LLM context injection |
| **sentence-transformers** | — | Local embedding generation (no API cost) for contract vectorisation |
| **PyPDF2 + python-docx** | — | Extracts raw text from uploaded PDF and DOCX contracts |
| **ReportLab / WeasyPrint** | — | PDF report generation for Contract Analyzer output |

---

## 🤖 AI Pipelines

### 1. Legal Assistant — 4-Node LangGraph Pipeline

```
 User Query
     │
     ▼
┌─────────────────────────────────┐
│  NODE 1: GUARDRAIL              │
│  • Safety classification        │
│  • Blocks prompt injection      │
│  • Rejects off-topic queries    │
│  • Routes: PASS → Node 2        │
│            FAIL → Reject msg    │
└───────────────┬─────────────────┘
                │ (safe query)
                ▼
┌─────────────────────────────────┐
│  NODE 2: SEARCH                 │
│  • Serper API → Google India    │
│  • Fetches top-N result URLs    │
│  • BeautifulSoup page scrape    │
│  • Returns raw text snippets    │
└───────────────┬─────────────────┘
                │ (search results)
                ▼
┌─────────────────────────────────┐
│  NODE 3: EVALUATOR              │
│  • LLM relevance scoring        │
│  • Filters low-quality results  │
│  • Routes: OK → Node 4          │
│            NO_RESULTS → retry   │
└───────────────┬─────────────────┘
                │ (validated results)
                ▼
┌─────────────────────────────────┐
│  NODE 4: SYNTHESIS              │
│  Model: Llama-3.3-70B           │
│  • Grounded answer generation   │
│  • Inline citation injection    │
│  • Indian legal context framing │
│  • Returns: answer + sources[]  │
└─────────────────────────────────┘

Model Hierarchy (failover order):
  meta-llama/llama-3.3-70b-instruct
    → openai/gpt-4o-mini
      → mistralai/mistral-small-24b-instruct-2501
        → nvidia/nemotron-3.5-lightning:free
```

---

### 2. Contract Analyzer — 4-Node Agentic Pipeline

```
 Upload: PDF / DOCX
     │
     ▼
┌─────────────────────────────────────────────────┐
│  NODE 1: INGESTION                              │
│  • PyPDF2 / python-docx text extraction         │
│                                                 │
│  if doc ≤ 65,000 chars:                         │
│    └─► Full-document context window mode        │
│                                                 │
│  if doc > 65,000 chars:                         │
│    └─► Hybrid RAG mode:                         │
│          • Chunk + embed (sentence-transformers)│
│          • FAISS MMR vector retrieval           │
│          • BM25 keyword retrieval               │
│          • CrossEncoder reranking               │
│          • Top-K chunks assembled               │
└───────────────────┬─────────────────────────────┘
                    │ (text context)
                    ▼
┌─────────────────────────────────────────────────┐
│  NODE 2: CLAUSE EXTRACTOR                       │
│  Extracts structured fields:                    │
│  • Parties (names, roles)                       │
│  • Effective & Expiry Dates                     │
│  • Payment Terms & Milestones                   │
│  • Obligations (each party)                     │
│  • Termination Conditions                       │
└───────────────────┬─────────────────────────────┘
                    │ (structured clauses)
                    ▼
┌─────────────────────────────────────────────────┐
│  NODE 3: RISK AUDIT                             │
│  8-Category Risk Checklist:                     │
│  1. Liability Caps & Indemnification            │
│  2. SLA & Performance Guarantees               │
│  3. Pricing & Payment Escalation                │
│  4. IP Ownership & Assignment                   │
│  5. Subcontracting & Assignment Rights          │
│  6. Dispute Resolution & Jurisdiction           │
│  7. Data Protection & Confidentiality           │
│  8. Force Majeure & Change of Control           │
│                                                 │
│  Grounding Engine:                              │
│  • Verifies every evidence quote against        │
│    real contract text (prevents hallucination)  │
│  • Corrects section references automatically    │
└───────────────────┬─────────────────────────────┘
                    │ (risk audit JSON)
                    ▼
┌─────────────────────────────────────────────────┐
│  NODE 4: SYNTHESIS FORMATTER                    │
│  • Executive summary (3-5 sentences)            │
│  • Priority recommendations list               │
│  • Red flags (immediate attention)              │
│  • Missing protections checklist                │
│  • Final structured JSON output                 │
│  • PDF report generation (ReportLab)            │
└─────────────────────────────────────────────────┘

Model Hierarchy (failover order):
  openai/gpt-4o-mini
    → meta-llama/llama-3.3-70b-instruct
      → mistralai/mistral-small-24b-instruct-2501
        → nvidia/nemotron-3.5-lightning:free
```

---

### 3. Case Outcome Predictor — LangGraph Adversarial Debate

```
 Case Facts Input (Claimant's Brief)
     │
     ▼
┌──────────────────────────────────────────┐
│  NODE 1: LEGAL RESEARCH                  │
│  • Retrieves relevant Indian case law    │
│  • Statutes, precedents, IPC/CPC refs    │
│  • Structures factual-legal matrix       │
└──────────────────┬───────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌────────────────┐    ┌────────────────────┐
│  NODE 2:       │    │  NODE 3:           │
│  CLAIMANT      │    │  DEFENCE COUNSEL   │
│  COUNSEL       │    │                    │
│  • Arguments   │    │  • Counter-args    │
│  • Precedents  │    │  • Rebuttals       │
│  • Relief ask  │    │  • Defences        │
└────────┬───────┘    └─────────┬──────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
┌──────────────────────────────────────────┐
│  NODE 4: CITATION AUDIT                  │
│  • Verifies all cited cases exist        │
│  • Flags hallucinated citations          │
│  • Validates statutory references        │
└──────────────────┬───────────────────────┘
                   │ (verified briefs)
                   ▼
┌──────────────────────────────────────────┐
│  NODE 5: JUDICIAL EVALUATOR              │
│  • Weighs both sides' arguments          │
│  • Applies Indian jurisprudence          │
│  • Outputs structured JSON verdict:      │
│    {                                     │
│      win_probability: 0.0–1.0,           │
│      likely_outcome: "...",              │
│      key_strengths: [...],               │
│      key_weaknesses: [...],              │
│      recommended_strategy: "..."        │
│    }                                     │
└──────────────────────────────────────────┘

Model Hierarchy (failover order):
  meta-llama/llama-3.3-70b-instruct  (Claimant + Judge)
    → openai/gpt-4o-mini
      → mistralai/mistral-small-24b-instruct-2501
        → nvidia/nemotron-3-ultra-550b-a55b:free
```

---

## 🗄️ Database Design

### MySQL / TiDB Cloud — Relational (User Identity)

```sql
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255)        NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255)        NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### MongoDB Atlas — Document Store (AI Session Data)

| Collection | Description | Key Fields |
|---|---|---|
| `chats` | Legal Assistant conversation history | `userId`, `sessionId`, `messages[]`, `createdAt` |
| `contracts` | Contract Analyzer vault | `userId`, `filename`, `rawText`, `analysis` (full JSON), `uploadedAt` |
| `cases` | Case Predictor results | `userId`, `caseTitle`, `facts`, `verdict` (JSON), `createdAt` |
| `summaries` | Stored contract executive summaries | `contractId`, `summary`, `redFlags[]`, `recommendations[]` |

---

## 🛣️ Frontend Routes

| Route | Access | Component | Description |
|---|---|---|---|
| `/` | Public | `HomePage` | Landing page with feature overview |
| `/register` | Public | `RegisterPage` | New user registration |
| `/login` | Public | `LoginPage` | JWT login, stores tokens |
| `/services` | Protected | `ServicesPage` | Feature selection hub |
| `/legalAssistant` | Protected | `LegalAssistantPage` | Conversational chat UI |
| `/contractAnalyzer` | Protected | `ContractAnalyzerPage` | File upload + analysis dashboard |
| `/casePrediction` | Protected | `CasePredictionPage` | Case form + adversarial verdict display |

> Protected routes redirect to `/login` when no valid JWT is present.

---

## 📡 API Reference

### Node.js Backend — `https://legalsmiths-node.onrender.com`

#### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register new user |
| `POST` | `/api/auth/login` | None | Login, returns `accessToken` + `refreshToken` |
| `POST` | `/api/auth/refresh` | Refresh token | Issue new access token |
| `POST` | `/api/auth/logout` | Bearer token | Invalidate refresh token |

#### Legal Assistant

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat/query` | Bearer | Send legal question, proxy to AI backend |
| `GET` | `/api/chat/history` | Bearer | Get user's chat history |
| `DELETE` | `/api/chat/:sessionId` | Bearer | Delete a chat session |

#### Contract Analyzer

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/contracts/analyze` | Bearer | Upload PDF/DOCX, proxy to AI backend |
| `GET` | `/api/contracts` | Bearer | List user's analyzed contracts |
| `GET` | `/api/contracts/:id` | Bearer | Get single contract analysis |
| `DELETE` | `/api/contracts/:id` | Bearer | Remove contract from vault |
| `GET` | `/api/contracts/:id/report` | Bearer | Download PDF risk report |

#### Case Predictor

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/cases/predict` | Bearer | Submit case facts, proxy to AI backend |
| `GET` | `/api/cases` | Bearer | List user's case predictions |
| `GET` | `/api/cases/:id` | Bearer | Get single case verdict |

---

### Python AI Backend — `https://legalsmiths-ai.onrender.com`

> Interactive docs at `/docs` (Swagger UI) and `/redoc`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/legal-assistant/query` | Run 4-node legal Q&A pipeline |
| `POST` | `/contract-analyzer/analyze` | Run 4-node contract analysis pipeline (multipart/form-data) |
| `POST` | `/case-predictor/predict` | Run adversarial LangGraph debate pipeline |

---

## 🔐 Environment Variables

### Python AI Backend (`.env` in `/ai-backend`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | OpenRouter unified LLM gateway key | `sk-or-v1-...` |
| `OPENROUTER_BASE_URL` | ✅ | OpenRouter base URL | `https://openrouter.ai/api/v1` |
| `SERPER_API_KEY` | ✅ | Serper.dev Google India search | `abc123...` |
| `LEGAL_ASSISTANT_MODEL` | ✅ | Primary model for Legal Assistant | `meta-llama/llama-3.3-70b-instruct` |
| `CONTRACT_ANALYZER_MODEL` | ✅ | Primary model for Contract Analyzer | `openai/gpt-4o-mini` |
| `CASE_PREDICTOR_MODEL` | ✅ | Primary model for Claimant/Research | `meta-llama/llama-3.3-70b-instruct` |
| `ADVOCATE_MODEL` | ✅ | Model for Defence Counsel node | `meta-llama/llama-3.3-70b-instruct` |
| `JUDGE_MODEL` | ✅ | Model for Judicial Evaluator node | `meta-llama/llama-3.3-70b-instruct` |
| `DEVICE` | ✅ | Torch device for embeddings | `cpu` |
| `PORT` | ✅ | FastAPI server port | `8000` |

### Node.js Backend (`.env` in `/node-backend`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster...` |
| `MYSQL_URL` | ✅ | TiDB Cloud MySQL connection URL | `mysql://user:pass@gateway...` |
| `JWT_SECRET` | ✅ | Legacy JWT signing secret (keep for migration) | `super_secret_string` |
| `ACCESS_TOKEN_SECRET` | ✅ | Access token signing secret (15 min) | `access_secret_string` |
| `REFRESH_TOKEN_SECRET` | ✅ | Refresh token signing secret (7 d) | `refresh_secret_string` |
| `PORT` | ✅ | Express server port | `5000` |

### Frontend (`.env` in `/frontend`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_NODE_API_URL` | ✅ | Node.js backend base URL | `https://legalsmiths-node.onrender.com` |
| `VITE_AI_API_URL` | ✅ | Python AI backend base URL | `https://legalsmiths-ai.onrender.com` |

---

## ⚙️ Local Setup

### Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.10+ | [python.org](https://python.org) |
| pnpm or npm | — | `npm i -g pnpm` |
| MongoDB Atlas | — | [cloud.mongodb.com](https://cloud.mongodb.com) (free tier) |
| TiDB Cloud / MySQL | — | [tidbcloud.com](https://tidbcloud.com) or local MySQL |
| Git | 2.x | [git-scm.com](https://git-scm.com) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/legalsmiths.git
cd legalsmiths
```

---

### Step 2 — Python AI Backend

```bash
# Navigate to the AI backend directory
cd ai-backend

# Create and activate a virtual environment
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy the environment template and fill in your keys
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY, SERPER_API_KEY, etc.

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> API will be available at `http://localhost:8000`  
> Swagger UI: `http://localhost:8000/docs`

---

### Step 3 — Node.js Backend

```bash
# From the repo root
cd node-backend

# Install dependencies
npm install
# or: pnpm install

# Copy the environment template and fill in your URIs and secrets
cp .env.example .env
# Edit .env with MONGODB_URI, MYSQL_URL, JWT secrets, etc.

# Run database migrations (if applicable)
npm run migrate

# Start the Express server
npm run dev
```

> API will be available at `http://localhost:5000`

---

### Step 4 — Frontend

```bash
# From the repo root
cd frontend

# Install dependencies
npm install
# or: pnpm install

# Copy the environment template
cp .env.example .env
# Set:
#   VITE_NODE_API_URL=http://localhost:5000
#   VITE_AI_API_URL=http://localhost:8000

# Start the Vite dev server
npm run dev
```

> App will be available at `http://localhost:5173`

---

### Running All Three Services Together

You can use three separate terminal windows/tabs, or install `concurrently`:

```bash
# From the repo root
npm install -g concurrently

concurrently \
  "cd ai-backend && uvicorn main:app --port 8000 --reload" \
  "cd node-backend && npm run dev" \
  "cd frontend && npm run dev"
```

---

## 📁 Project Structure

```
legalsmiths/
│
├── frontend/                        # React 18 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── components/              # Shared UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   ├── LegalAssistantPage.jsx
│   │   │   ├── ContractAnalyzerPage.jsx
│   │   │   └── CasePredictionPage.jsx
│   │   ├── services/                # API client functions
│   │   │   ├── authService.js
│   │   │   ├── chatService.js
│   │   │   ├── contractService.js
│   │   │   └── caseService.js
│   │   ├── context/                 # React Contexts (Auth, etc.)
│   │   ├── styles/                  # Custom CSS (Poppins-based design)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── node-backend/                    # Express 5 REST API
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── chatController.js
│   │   │   ├── contractController.js
│   │   │   └── caseController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verification
│   │   │   ├── uploadMiddleware.js  # Multer config
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── Chat.js              # Mongoose schema
│   │   │   ├── Contract.js          # Mongoose schema
│   │   │   └── Case.js              # Mongoose schema
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── chatRoutes.js
│   │   │   ├── contractRoutes.js
│   │   │   └── caseRoutes.js
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB + MySQL connection
│   │   │   └── jwt.js
│   │   └── app.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── ai-backend/                      # FastAPI + LangGraph AI Engine
│   ├── pipelines/
│   │   ├── legal_assistant/
│   │   │   ├── graph.py             # LangGraph definition
│   │   │   ├── nodes/
│   │   │   │   ├── guardrail.py
│   │   │   │   ├── search.py
│   │   │   │   ├── evaluator.py
│   │   │   │   └── synthesis.py
│   │   │   └── state.py
│   │   ├── contract_analyzer/
│   │   │   ├── graph.py
│   │   │   ├── nodes/
│   │   │   │   ├── ingestion.py     # Adaptive context / Hybrid RAG
│   │   │   │   ├── clause_extractor.py
│   │   │   │   ├── risk_audit.py
│   │   │   │   └── synthesis_formatter.py
│   │   │   └── state.py
│   │   └── case_predictor/
│   │       ├── graph.py
│   │       ├── nodes/
│   │       │   ├── legal_research.py
│   │       │   ├── claimant_counsel.py
│   │       │   ├── defence_counsel.py
│   │       │   ├── citation_audit.py
│   │       │   └── judicial_evaluator.py
│   │       └── state.py
│   ├── services/
│   │   ├── llm_client.py            # OpenRouter + failover logic
│   │   ├── search_client.py         # Serper.dev integration
│   │   ├── rag_engine.py            # FAISS + BM25 + CrossEncoder
│   │   └── pdf_generator.py         # Report generation
│   ├── routers/
│   │   ├── legal_assistant.py
│   │   ├── contract_analyzer.py
│   │   └── case_predictor.py
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
│
├── docs/
│   └── screenshots/                 # UI screenshots for README
│
├── .gitignore
├── README.md                        # This file
└── render.yaml                      # Render multi-service config
```

---

## 🚀 Deployment (Render)

All three services are deployed on [Render](https://render.com). The recommended approach uses a `render.yaml` blueprint for one-click multi-service deployment.

### `render.yaml` Blueprint

```yaml
services:
  # ── Frontend (Static Site) ──────────────────────────────────────────
  - type: web
    name: legalsmiths
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_NODE_API_URL
        value: https://legalsmiths-node.onrender.com
      - key: VITE_AI_API_URL
        value: https://legalsmiths-ai.onrender.com
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  # ── Node.js Backend ─────────────────────────────────────────────────
  - type: web
    name: legalsmiths-node
    runtime: node
    rootDir: node-backend
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: MYSQL_URL
        sync: false
      - key: ACCESS_TOKEN_SECRET
        sync: false
      - key: REFRESH_TOKEN_SECRET
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: PORT
        value: "5000"

  # ── Python AI Backend ────────────────────────────────────────────────
  - type: web
    name: legalsmiths-ai
    runtime: python
    rootDir: ai-backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENROUTER_API_KEY
        sync: false
      - key: OPENROUTER_BASE_URL
        value: https://openrouter.ai/api/v1
      - key: SERPER_API_KEY
        sync: false
      - key: LEGAL_ASSISTANT_MODEL
        value: meta-llama/llama-3.3-70b-instruct
      - key: CONTRACT_ANALYZER_MODEL
        value: openai/gpt-4o-mini
      - key: CASE_PREDICTOR_MODEL
        value: meta-llama/llama-3.3-70b-instruct
      - key: ADVOCATE_MODEL
        value: meta-llama/llama-3.3-70b-instruct
      - key: JUDGE_MODEL
        value: meta-llama/llama-3.3-70b-instruct
      - key: DEVICE
        value: cpu
```

### Manual Deployment Steps

1. **Push to GitHub** — Render auto-deploys on push to `main`.
2. **Create services** on [dashboard.render.com](https://dashboard.render.com):
   - Frontend → **Static Site** → root: `frontend/`, build: `npm run build`, publish: `dist`
   - Node Backend → **Web Service** → root: `node-backend/`, start: `node server.js`
   - Python Backend → **Web Service** → root: `ai-backend/`, start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Add Environment Variables** via the Render dashboard for each service (mark sensitive values as secret).
4. **Enable Auto-Deploy** so every push to `main` triggers a rebuild.

> **Note on cold starts:** Render free-tier services spin down after 15 minutes of inactivity. The first request after idle may take 30–60 seconds. Consider upgrading to a paid plan for production use.

---

## 🤝 Contributing

Contributions are welcome! Please follow the steps below:

1. **Fork** the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow the code style** — ESLint for JS/JSX, Black + isort for Python.

3. **Write meaningful commits:**
   ```
   feat(contract-analyzer): add grounding score threshold config
   fix(auth): refresh token rotation on concurrent requests
   docs(readme): update local setup for Windows users
   ```

4. **Test your changes** before opening a PR:
   ```bash
   # Python
   cd ai-backend && pytest

   # Node
   cd node-backend && npm test
   ```

5. **Open a Pull Request** against `main` with a clear description of what changed and why.

### Code of Conduct

Please be respectful, inclusive, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

---

## 📄 License

```
MIT License

Copyright (c) 2024 LegalSmiths Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

Built with ❤️ for the Indian legal ecosystem · Powered by LangGraph, OpenRouter & FastAPI

</div>
