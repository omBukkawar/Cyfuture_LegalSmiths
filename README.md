# ⚖️ LegalSmiths — AI-Powered Legal Intelligence Platform

<div align="center">

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic-FF6B35?style=for-the-badge)
![OpenRouter](https://img.shields.io/badge/OpenRouter-LLM_Gateway-7C3AED?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-TiDB_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Deployed on Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)

**An enterprise-grade, full-stack AI legal intelligence platform engineered for the Indian legal ecosystem.**  
Live statutory Q&A · 8-category commercial contract risk audit · Adversarial case outcome prediction.

[🌐 Live Web Application](https://legalsmiths.onrender.com) · [🤖 Python AI Backend Docs](https://legalsmiths-ai.onrender.com/docs) · [📡 Node API Gateway](https://legalsmiths-node.onrender.com)

</div>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Two-Critic Agentic Security Architecture](#-two-critic-agentic-security-architecture)
4. [Tech Stack & Rationale](#-tech-stack--rationale)
5. [AI Pipelines Deep Dive](#-ai-pipelines-deep-dive)
   - [1. Legal Assistant](#1-legal-assistant)
   - [2. Contract Analyzer](#2-contract-analyzer)
   - [3. Case Outcome Predictor](#3-case-outcome-predictor)
6. [User Guides & Feature Walkthroughs](#-user-guides--feature-walkthroughs)
7. [Security & Abuse Prevention](#-security--abuse-prevention)
8. [Database Architecture](#-database-architecture)
9. [Frontend Routes & Navigation](#-frontend-routes--navigation)
10. [API Reference](#-api-reference)
11. [Environment Variables Reference](#-environment-variables-reference)
12. [Local Setup Guide](#-local-setup-guide)
13. [Project Directory Structure](#-project-directory-structure)
14. [Deployment (Render Blueprint)](#-deployment-render-blueprint)
15. [Contributing Guidelines](#-contributing-guidelines)
16. [License](#-license)

---

## 🧭 Overview

**LegalSmiths** is a production-hardened platform designed to give lawyers, legal researchers, and enterprises verifiable, grounded legal analysis. The platform solves the core weaknesses of consumer LLMs in legal workflows: **hallucinated evidence**, **invented section numbers**, **one-sided reasoning**, and **unvetted prompts**.

The platform is split into **three independently deployed services**:

| Service | Technology Stack | Port | Production URL |
|---|---|---|---|
| **Frontend** | React 18, Vite 7, React Router v7, Custom CSS | `5173` | [https://legalsmiths.onrender.com](https://legalsmiths.onrender.com) |
| **Node Backend** | Express 5, Mongoose 8, MySQL2, TiDB Cloud, express-rate-limit | `5000` | [https://legalsmiths-node.onrender.com](https://legalsmiths-node.onrender.com) |
| **Python AI Backend** | FastAPI 0.110+, LangGraph, OpenRouter, slowapi, FAISS, BM25 | `8000` | [https://legalsmiths-ai.onrender.com](https://legalsmiths-ai.onrender.com) |

---

## 🏗️ Architecture

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                      USER BROWSER                       │
                               │             React 18 + Vite SPA (Port 5173)             │
                               │   /legalAssistant   /contractAnalyzer   /casePrediction │
                               └───────────┬─────────────────────────────────┬───────────┘
                                           │                                 │
           Auth, Sessions, Vault, History  │                                 │ Direct AI Inference Requests
        HTTPS / httpOnly Cookies / JWT Bearer                              │ REST / JSON (No Gateway Hop)
                                           ▼                                 ▼
┌────────────────────────────────────────────────────────┐ ┌─────────────────────────────────────────────────────────┐
│          NODE.JS BACKEND GATEWAY (Port 5000)           │ │           PYTHON AI MICROSERVICE (Port 8000)            │
│  Express 5 · Dual Token Auth · Rate Limiting · Multer  │ │    FastAPI · LangGraph · slowapi · OpenRouter Failover  │
│                                                        │ │                                                         │
│   ┌──────────────────────┐  ┌──────────────────────┐   │ │ ┌───────────────────┐ ┌─────────────────┐ ┌───────────┐ │
│   │  MySQL / TiDB Cloud  │  │    MongoDB Atlas     │   │ │ │  Legal Assistant  │ │Contract Analyzer│ │  Case Pred │ │
│   │  (Users & Passwords) │  │  (Chats, Contracts,  │   │ │ │ 4-Node LangGraph  │ │4-Node Flow + RAG│ │ 5-Stage RAG │ │
│   │                      │  │   Cases, Summaries)  │   │ │ └─────────┬─────────┘ └────────┬────────┘ └─────┬─────┘ │
│   └──────────────────────┘  └──────────────────────┘   │ │           │                    │                │       │
└────────────────────────────────────────────────────────┘ │           ▼                    ▼                ▼       │
                                                           │     input_critic.py      input_critic.py   input_critic │
                                                           │     output_critic.py     output_critic.py  output_critic│
                                                           │           └────────────────────┼────────────────┘       │
                                                           │                                ▼                        │
                                                           │                 ┌─────────────────────────────┐         │
                                                           │                 │   OpenRouter LLM Gateway    │         │
                                                           │                 │ Llama 3.3 70B · GPT-4o-mini │         │
                                                           │                 │ Mistral 24B · Nemotron 550B │         │
                                                           │                 └──────────────┬──────────────┘         │
                                                           │                                │                        │
                                                           │           ┌────────────────────┴───────────────────┐    │
                                                           │           ▼                                        ▼    │
                                                           │ ┌───────────────────┐                    ┌────────────┐ │
                                                           │ │Serper.dev Search  │                    │FAISS + BM25│ │
                                                           │ │(Google India)     │                    │CrossEncoder│ │
                                                           │ └───────────────────┘                    └────────────┘ │
                                                           └─────────────────────────────────────────────────────────┘
```

---

## 🛡️ Two-Critic Agentic Security Architecture

Raw regex filters break easily when faced with minor typos, leetspeak (`1gn0r3`), or standard legal terminology (e.g. "drop charges", "court select"). LegalSmiths implements an **intelligent 2-Critic system**:

```
                       User Request (Text / Contract / Case Facts)
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│               LAYER 1: Structural Guard (Regex / Zero Latency)                          │
│   • Payload Size Limits (5k chars for Assistant, 2k for Contract prompt, 6k for Case)   │
│   • Character & Repetition Flooding / DoS Protection                                    │
│   • XSS Injection (<script>, javascript:, onload=, eval())                              │
│   • Path Traversal & Shell Injection (../, /etc/passwd, $(...))                         │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ PASS
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│               LAYER 2: Input Critic Agent (Semantic Intent Classifier)                  │
│   • Invokes gpt-4o-mini to categorize input into:                                       │
│     - LEGAL: Valid legal inquiry (PROCEED)                                              │
│     - OFF_TOPIC: Questions about cooking (paneer tikka), sports, movies, coding        │
│     - INJECTION: Jailbreak attempts, DAN mode, instruction override tricks              │
│     - ILLICIT: Solicitations on how to forge deeds, bribe officials, launder money      │
│     - UNCLEAR: Ambiguous inputs (PROCEED via fail-open policy)                          │
│   • Blocked requests return clear, module-specific role guidance.                       │
│   • Fail-Open: Upstream critic failure never prevents legitimate user workflows.        │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ SAFE
                                            ▼
                            AI PIPELINE EXECUTES (LangGraph)
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│               LAYER 3: Output Critic Agent (Post-Execution Quality Review)              │
│   • Evaluates completeness, grounding, and absence of raw escaped JSON artifacts.       │
│   • High confidence threshold (≥85%) required to block bad outputs.                     │
│   • Fail-Open: Never suppresses valid pipeline answers due to critic uncertainty.       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                  200 OK Final Response
```

---

## 🛠️ Tech Stack & Rationale

### Frontend
| Technology | Version | Rationale |
|---|---|---|
| **React** | `18.2.0` | Concurrent rendering, declarative state management, custom hook modularity. |
| **Vite** | `^7.1.2` | Native ES modules provide instant dev server startup and optimized Rollup production chunking. |
| **React Router** | `^7.18.5` | Centralized route guards (`ProtectedRoute`), nested layouts, and smooth navigation. |
| **Axios** | `^1.6.7` | Interceptors for automated JWT cookie forwarding and custom header attachment. |
| **Custom CSS** | Pure CSS | Zero runtime overhead; full control over legal aesthetics, cards, and Poppins font tokens. |

### Node.js Backend
| Technology | Version | Rationale |
|---|---|---|
| **Express** | `^5.1.0` | Native async route handlers eliminate boilerplate promise catch wrappers. |
| **express-rate-limit**| `^7.5.0` | 3-tier sliding window rate limiter: auth (20/15m), AI routes (30/15m), general (200/15m). |
| **cookie-parser** | `^1.4.7` | Parses encrypted httpOnly session tokens, protecting against XSS credential theft. |
| **jsonwebtoken** | `^9.0.2` | Stateless cryptographic authentication with access (15m) and refresh (7d) tokens. |
| **bcryptjs** | `^3.0.3` | Password hashing with 10 salt rounds for secure user identity storage. |
| **Mongoose** | `^8.18.0` | Strict schemas and validators for chat histories, contract vault, and case verdicts. |
| **MySQL2 / TiDB** | `^3.14.3` | Serverless cloud relational database ensuring ACID guarantees for user accounts. |

### Python AI Backend
| Technology | Version | Rationale |
|---|---|---|
| **FastAPI** | `0.110+` | High-throughput asynchronous endpoints with Pydantic validation and automatic OpenAPI specs. |
| **slowapi** | `0.1.9+` | Per-route rate limiting: Legal Assistant (20/min), Contract & Case Predictor (10/min). |
| **LangGraph & LangChain**| Latest | Stateful cyclic and acyclic multi-node graph pipelines with conditional branching. |
| **OpenRouter** | API | Single unified gateway to non-Chinese enterprise LLMs with automatic fallback chains. |
| **FAISS (`faiss-cpu`)**| `^1.7.4` | In-memory approximate nearest neighbor vector similarity search. |
| **BM25 (`rank-bm25`)** | `^0.2.2` | Lexical keyword matching to capture exact statute numbers, parties, and clause titles. |
| **CrossEncoder** | Latest | Joint query-chunk reranking for precise contract clause prioritization. |
| **Serper.dev** | API | Low-latency Google India live legal search with jurisdiction targeting (`gl=in`). |

---

## 🤖 AI Pipelines Deep Dive

### 1. Legal Assistant
- **Endpoint**: `POST /legalassistant`
- **Execution Flow**: 4-Node LangGraph Flow
- **Model Hierarchy**: `meta-llama/llama-3.3-70b-instruct` ➔ `openai/gpt-4o-mini` ➔ `mistralai/mistral-small-24b-instruct-2501` ➔ `nvidia/nemotron-3.5-lightning:free`

```
User Query ──► Input Critic ──► guardrail_node ──► search_node (Serper.dev + BS4)
                                                         │
                                                         ▼
                                                  evaluator_node (Relevance)
                                                         │
                                                         ▼
                                                  synthesis_node (Llama 3.3 70B)
                                                         │
                                                         ▼
                                                  Output Critic ──► 200 OK Response
```

### 2. Contract Analyzer
- **Endpoint**: `POST /contractanalyzer` (multipart/form-data)
- **Execution Flow**: 4-Node Agentic Pipeline + Grounding Engine
- **Model Hierarchy**: `openai/gpt-4o-mini` ➔ `meta-llama/llama-3.3-70b-instruct` ➔ `mistralai/mistral-small-24b-instruct-2501` ➔ `nvidia/nemotron-3.5-lightning:free`

```
Upload (PDF/DOCX/TXT) ──► Input Critic ──► ingestion_node:
                                                ├── ≤ 65k chars: Full Document Context
                                                └── > 65k chars: Hybrid RAG (BM25 + FAISS + CrossEncoder)
                                                        │
                                                        ▼
                                           clause_extractor_node (Parties, Dates, Terms)
                                                        │
                                                        ▼
                                           risk_audit_node ◄──► grounding_engine.py
                                                        │       (Quote Verification & Section Map)
                                                        ▼
                                           synthesis_formatter_node (Summary & Actionable Fixes)
                                                        │
                                                        ▼
                                           Output Critic ──► 200 OK Audit JSON
```

### 3. Case Outcome Predictor
- **Endpoint**: `POST /caseoutcomeprediction`
- **Execution Flow**: 5-Stage LangGraph Adversarial Debate Pipeline
- **Model Hierarchy**: `meta-llama/llama-3.3-70b-instruct` ➔ `openai/gpt-4o-mini` ➔ `mistralai/mistral-small-24b-instruct-2501` ➔ `nvidia/nemotron-3-ultra-550b-a55b:free`

```
Dispute Facts ──► Input Critic ──► legal_research_node (Precedents & Statutes)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             claimant_counsel_node                       defence_counsel_node
          (Case Theory & Proof Elements)              (Defences, Rebuttals, Bars)
                       └─────────────────────┬─────────────────────┘
                                             ▼
                                    citation_audit_node
                                             ▼
                                  judicial_evaluator_node (Impartial Ruling)
                                             │
                                             ▼
                                  Output Critic ──► 200 OK Verdict JSON
```

---

## 📖 User Guides & Feature Walkthroughs

### 1. Using the Legal Assistant
1. Navigate to `/legalAssistant` (requires login).
2. Enter any legal query regarding Indian statutes, Consumer Protection, CrPC, IPC, or civil procedure.
3. The assistant triggers real-time search, parses official law sources, and provides an authoritative response with inline citations.
4. **History Sidebar**: All discussions are automatically saved to your account. Click any past chat to resume or click the trash icon to permanently remove it.

### 2. Using the Contract Analyzer
1. Navigate to `/contractAnalyzer`.
2. **Input Options**:
   - **Upload Document**: Drag and drop any `.pdf`, `.docx`, `.doc`, or `.txt` file (up to 20MB).
   - **Paste Text**: Switch to the "Paste Text" tab and enter contract clauses directly.
3. Click **"Analyze Contract"**.
4. **Explore the 5 Audit Tabs**:
   - **Red Flags**: View prioritized risks with exact verbatim evidence quotes from the agreement.
   - **Missing Protections**: Identify missing market-standard clauses (e.g. mutual indemnification, audit rights).
   - **Key Terms**: Review extracted Parties, Effective Dates, Payment Terms, and Termination Triggers.
   - **Drafting Ambiguities**: Identify subjective phrases or conflicting obligations.
   - **Recommendations**: Read clear negotiation action steps before signing.
5. **Review the 4-Quadrant Risk Rubric**: Evaluate Financial Exposure, Dispute Probability, Clause Symmetry, and Cross-Clause Interactions.
6. **Exports**:
   - Click **"Download PDF Report"** to open a clean, multi-section legal memorandum print dialog.
   - Click **"Export JSON"** to download raw analysis data.
7. **Contract Vault**: Previous audits are preserved in the left sidebar for instant reloading or deletion.

### 3. Using the Case Outcome Predictor
1. Navigate to `/casePrediction`.
2. Enter the narrative case facts, incident date, and jurisdiction.
3. Click **"Predict Outcome"**.
4. The system executes the adversarial debate pipeline (~60–90 seconds) and displays:
   - **Claimant Legal Brief**
   - **Defence Written Statement**
   - **Judicial Bench Verdict** with win probability percentage, key deciding factors, and actionable next steps for counsel.

---

## 🔒 Security & Abuse Prevention

| Layer | Implementation |
|---|---|
| **Session Protection** | Dual-token auth via `httpOnly` cookies (`accessToken`: 15m, `refreshToken`: 7d). Authorization Bearer header fallback. |
| **Rate Limiting (Node)** | 3 tiers: `/api/auth` (20/15m), AI proxies (30/15m), general CRUD (200/15m). |
| **Rate Limiting (Python)**| `slowapi`: Legal Assistant (20/min), Contract & Case Predictor (10/min). |
| **Input Critic** | Two-layer guard: Layer 1 structural regex + Layer 2 LLM intent classifier (`gpt-4o-mini`). |
| **Output Critic** | Post-generation LLM review checking for completeness and valid legal structure (threshold $\ge 85\%$). |
| **Execution Timeouts** | ThreadPoolExecutor wrappers: Legal Assistant (90s), Contract & Case Predictors (180s). |
| **Upload Safety** | Multer MIME-type filters; maximum file size capped at 20MB; maximum 5 files per audit. |
| **Database Injection** | Parameterized queries for MySQL via `mysql2`; Mongoose schema typing and validators for MongoDB. |

---

## 🗄️ Database Architecture

### 1. Relational Identity Store (MySQL / TiDB Cloud)
```sql
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255)        NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password       VARCHAR(255)        NOT NULL,
  phone_number   VARCHAR(20)         NOT NULL,
  refresh_token  TEXT                DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);
```

### 2. Document Collections (MongoDB Atlas)
- **`chats`**: User ID, conversation title, category, and message array (max 500 messages, max 20k chars per message).
- **`contracts`**: User ID, original filename, MIME type, file size, contract text (up to 500k chars), and complete `Mixed` analysis JSON.
- **`cases`**: User ID, title, dispute facts narrative (max 20k chars), status, and `Mixed` adversarial verdict JSON.
- **`summaries`**: User ID, title, document summary text (max 50k chars), and categorization tags.

---

## 🛣️ Frontend Routes & Navigation

| Route | Access | Component | Purpose |
|---|---|---|---|
| `/` | Public | `homepage.jsx` | Platform landing page and service previews |
| `/login` | Public | `login.jsx` | User authentication via credentials |
| `/register` | Public | `register.jsx` | User account creation |
| `/services` | 🔒 Protected | `services.jsx` | Navigation hub for all legal services |
| `/legalAssistant` | 🔒 Protected | `legalAssistant.jsx` | Conversational legal research & session vault |
| `/contractAnalyzer` | 🔒 Protected | `contractAnalyzer.jsx` | Complete contract risk audit dashboard & vault |
| `/casePrediction` | 🔒 Protected | `casePrediction.jsx` | Adversarial dispute outcome simulator |
| `/contact` | Public | `contact.jsx` | Inquiries and support form |

---

## 📡 API Reference

### Node.js Backend Gateway (`/api/*`)
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Login user; sets `httpOnly` cookies.
- `POST /api/auth/refresh-token` — Issue fresh access token from refresh token.
- `GET /api/auth/me` — Retrieve authenticated user profile.
- `POST /api/auth/logout` — Clear session cookies.
- `GET /api/chats/sessions` — Retrieve past legal chat sessions.
- `POST /api/chats/sessions` — Create a new chat session.
- `GET /api/chats/sessions/:sessionId` — Retrieve message history for a specific session.
- `POST /api/chats/sessions/:sessionId/messages` — Append user query or assistant reply.
- `PATCH /api/chats/sessions/:sessionId/title` — Rename chat session title.
- `DELETE /api/chats/sessions/:sessionId` — Delete chat session.
- `GET /api/contracts/contracts` — List all analyzed contracts in user vault.
- `POST /api/contracts/contracts/save-audit` — Save contract text and audit results.
- `GET /api/contracts/contracts/:id` — Fetch complete analysis report for a contract.
- `DELETE /api/contracts/contracts/:id` — Delete contract from vault.
- `GET /api/cases/cases` — List case outcome prediction history.
- `POST /api/cases/cases/save-prediction` — Store case outcome prediction.
- `GET /api/cases/cases/:id` — Fetch full judicial verdict details.
- `DELETE /api/cases/cases/:id` — Delete case prediction record.
- `GET /api/summaries/summaries` — List saved legal document summaries.
- `POST /api/summaries/summaries` — Create new document summary.
- `GET /api/summaries/summaries/:id` — Fetch single summary by ID.
- `PATCH /api/summaries/summaries/:id` — Update summary record.
- `DELETE /api/summaries/summaries/:id` — Delete summary record.
- `GET /health` — Check MongoDB connection health.

### Python AI Backend (`/*`)
- `GET /` — Microservice root status, version, and active endpoint catalog.
- `GET /health` — Health check returning compute device (`cpu`/`cuda`).
- `GET /docs` — Interactive OpenAPI / Swagger UI documentation.
- `POST /legalassistant` — 4-Node LangGraph legal Q&A pipeline (Rate limit: 20/min).
- `POST /contractanalyzer` — 4-Node contract risk audit pipeline (Rate limit: 10/min).
- `POST /caseoutcomeprediction` — 5-Stage adversarial debate pipeline (Rate limit: 10/min).

---

## 🔐 Environment Variables Reference

### Python AI Backend (`backend/python_backend/.env`)
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

LEGAL_ASSISTANT_TIMEOUT=90
CONTRACT_ANALYZER_TIMEOUT=180
CASE_PREDICTOR_TIMEOUT=180
ALLOWED_ORIGINS=http://localhost:5173,https://legalsmiths.onrender.com
```

### Node.js Backend (`backend/node_backend/.env`)
```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,https://legalsmiths.onrender.com
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/legalData?retryWrites=true&w=majority
MYSQL_URL=mysql://user:password@gateway.tidbcloud.com:4000/users?ssl={"rejectUnauthorized":true}

ACCESS_TOKEN_SECRET=your_64_char_hex_access_token_secret
REFRESH_TOKEN_SECRET=your_64_char_hex_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### Frontend (`frontend/.env`)
```env
VITE_NODE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

---

## ⚙️ Local Setup Guide

### 1. Clone Repository
```bash
git clone https://github.com/Pavankumar-Batchu1185/Cyfuture_LegalSmiths.git
cd Cyfuture_LegalSmiths
```

### 2. Setup Python AI Backend
```bash
cd backend/python_backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY and SERPER_API_KEY

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Setup Node.js Backend Gateway
Open a second terminal:
```bash
cd backend/node_backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI, MYSQL_URL, and token secrets

npm run dev
```

### 4. Setup React Frontend
Open a third terminal:
```bash
cd frontend
npm install
cp .env.example .env
# Verify VITE_NODE_API_URL=http://localhost:5000 and VITE_AI_API_URL=http://localhost:8000

npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 📁 Project Directory Structure

```
Cyfuture_LegalSmiths/
├── .github/workflows/ci.yml           # Automated CI/CD pipeline (lint, test, build, deploy)
├── README.md                          # Master documentation
│
├── data/indexes/                      # Local directory for cached FAISS and BM25 indexes
│
├── frontend/                          # React 18 + Vite SPA
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── README.md                      # Frontend documentation
│   └── src/
│       ├── components/                # ProtectedRoute, Footer
│       ├── config/api.js              # Axios base endpoints & getAuthHeaders()
│       ├── pages/                     # homepage, login, register, services,
│       │                              # legalAssistant, contractAnalyzer, casePrediction, contact
│       ├── styles/                    # Dedicated page stylesheets (Poppins, CSS tokens)
│       └── utils/auth.js              # Token management & user session helpers
│
├── backend/
│   ├── node_backend/                  # Express 5 Identity & Persistence Service
│   │   ├── server.js                  # Database connection & server bootstrap
│   │   ├── package.json
│   │   ├── Dockerfile                 # Production Docker configuration
│   │   ├── readme.md                  # Node Backend documentation
│   │   └── src/
│   │       ├── app.js                 # Rate limiters, cookies, CORS, routes
│   │       ├── controllers/           # auth, chat, contract, case, summary
│   │       ├── middlewares/           # verifyToken (cookie+header), multer
│   │       ├── models/                # chat, contract, casePredictor, summary
│   │       ├── routes/                # auth, chat, contract, case, summary
│   │       ├── db/                    # mongodb.js, sqldb.js
│   │       └── utils/                 # apiFeatures.js
│   │
│   └── python_backend/                # FastAPI Multi-Agentic AI Microservice
│       ├── main.py                    # App entry, slowapi rate limiter, CORS, lifespan
│       ├── limiter.py                 # Standalone slowapi Limiter instance
│       ├── requirements.txt
│       ├── Dockerfile                 # Production Docker configuration
│       ├── README.md                  # Python AI Backend documentation
│       ├── config/settings.py         # OpenRouter model priority chains & timeouts
│       ├── models/                    # llm.py (OpenRouter failover), embeddings.py
│       ├── routers/                   # legal_assistant, contract_analyzer, case_prediction
│       ├── schemas/                   # Pydantic request/response schemas
│       └── services/
│           ├── agents/                # input_critic.py, output_critic.py
│           ├── legal_assistant/       # 4-node LangGraph pipeline
│           ├── contract_analyzer/     # 4-node agentic pipeline + grounding_engine.py
│           ├── case_service.py        # 5-stage adversarial debate pipeline
│           ├── contract_service.py    # Service facade delegating to contract analyzer
│           ├── document_service.py    # Multi-format text extraction (PyPDF, docx, unstructured)
│           ├── input_guard.py         # Input validation facade delegating to Input Critic
│           ├── rag_service.py         # Hybrid FAISS vector store + BM25 retrieval
│           └── search_service.py      # Serper.dev Google India search wrapper
```

---

## 🚀 Deployment (Render & GitHub Actions CI/CD)

The project utilizes automated CI/CD via [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Upon every push to `main`, GitHub Actions performs verification (frontend build, Node backend app load, Python FastAPI import, and Docker container builds) before invoking Render Deploy Hooks:

```
Push to main ──► GitHub Actions CI/CD ──► 1. Frontend Lint & Build
                                      ──► 2. Node.js Verification
                                      ──► 3. Python AI Import Test
                                      ──► 4. Docker Build Verification
                                      ──► 5. Trigger Render Deploy Hooks ──► Services Updated
```

### Render Services Configuration

| Service | Render Type | Root Directory | Build Command | Start Command / Publish |
|---|---|---|---|---|
| **Frontend** | Static Site | `frontend` | `npm install && npm run build` | Publish: `dist`, Rewrite: `/*` ➔ `/index.html` |
| **Node Backend** | Web Service (Node) | `backend/node_backend` | `npm install` | `node server.js` |
| **Python AI Backend** | Web Service (Python) | `backend/python_backend` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

> [!NOTE]
> On the free tier, services sleep after 15 minutes of inactivity. Initial wake-up takes ~45–75 seconds while models and database pools reinitialize.

---

## 🤝 Contributing Guidelines

1. Fork the repository and create your branch: `git checkout -b feature/improvement-name`.
2. Ensure code standards:
   - Frontend: `npm run lint` and `npm run build` must succeed without warnings.
   - Python: Follow PEP 8 guidelines.
3. Commit using semantic commit messages (`feat: ...`, `fix: ...`, `docs: ...`).
4. Submit a Pull Request describing your changes.

---

## 📄 License

MIT License — Copyright (c) 2026 LegalSmiths Contributors.
