# ⚖️ Cyfuture LegalSmiths

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react)](./frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js)](./backend/node_backend)
[![FastAPI](https://img.shields.io/badge/AI%20Microservice-FastAPI%20%7C%20Python-009688?logo=fastapi)](./backend/python_backend)
[![OpenRouter](https://img.shields.io/badge/LLM-OpenRouter-6851FF)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**LegalSmiths** is a full-stack, enterprise-grade legal-tech platform built for the **Cyfuture AI Hackathon 1.0**. It couples agentic AI pipelines with statutory Indian legal intelligence (Bharatiya Nyaya Sanhita, BNSS, IPC, CrPC, Contract Act), real-time search verification via Serper.dev, hybrid RAG document indexing, and dual-database persistence.

---

## 🏛️ System Architecture

```text
                        ┌────────────────────────┐
                        │   React / Vite Client  │
                        │ (Port 5173 / Vercel)   │
                        └──────────┬─────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │ REST (JWT Auth & Document CRUD)         │ Direct AI Requests
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────────────┐
   │  Node.js / Express   │                  │  Python / FastAPI AI Service │
   │ (Port 5000 / Render) │                  │     (Port 8000 / Railway)    │
   └──────────┬───────────┘                  └──────────────┬───────────────┘
              │                                             │
      ┌───────┴───────┐                             ┌───────┴───────┐
      ▼               ▼                             ▼               ▼
┌───────────┐   ┌───────────┐                 ┌───────────┐   ┌───────────┐
│   MySQL   │   │  MongoDB  │                 │  Serper   │   │OpenRouter │
│ (Auth/JWT)│   │  (Docs)   │                 │  (Search) │   │ (LLM API) │
└───────────┘   └───────────┘                 └───────────┘   └───────────┘
```

---

## 🌟 Core Modules

### 1. 🏛️ Agentic Legal Assistant
* **4-Node LangGraph-style Pipeline:**
  * **Node 1 (Guardrails):** Catches prompt injection, jailbreak attempts, and illegal solicitation.
  * **Node 2 (Serper Search):** Fetches real-time Indian legal provisions, BNS/BNSS amendments, and Supreme Court judgments.
  * **Node 3 (Evaluator):** Scores relevance and filters out noisy or foreign legal provisions.
  * **Node 4 (Synthesis):** OpenRouter LLMs generate plain-language advice with mandatory statutory citations.

### 2. 📜 Smart Contract Analyzer
* **4-Node LangGraph-style Pipeline:**
  * **Node 1 (Ingestion & Hybrid RAG):** Chunks contracts and executes multi-dimensional sparse + dense retrieval (BM25 + FAISS with MMR & Cross-Encoder reranker).
  * **Node 2 (Clause Extractor):** Isolates operational terms (parties, critical dates, payment terms, performance covenants, and termination triggers).
  * **Node 3 (Risk Auditor):** Flags uncapped indemnities, one-sided liabilities, and determines risk rating (`Low`, `Medium`, `High`).
  * **Node 4 (Synthesis & Formatter):** Generates plain summaries, actionable recommendations, and strict JSON output.

### 3. ⚖️ Case Outcome Predictor
* Generates court-style legal advisory analyses based on Indian legal precedent.
* Predicts win probabilities, strongest arguments, statutory penalties, and procedural strategies.

---

## 📂 Project Structure

```text
Cyfuture_LegalSmiths/
├── backend/
│   ├── node_backend/          # Node.js + Express REST API
│   │   ├── .env.example       # Node environment template
│   │   ├── src/               # Controllers, models, routes, middlewares, db
│   │   └── server.js          # Entry point (Port 5000)
│   └── python_backend/        # FastAPI AI Microservice
│       ├── .env.example       # Python environment template
│       ├── config/            # Settings & device detection
│       ├── models/            # OpenRouter LLM multi-model fallback wrapper
│       ├── routers/           # FastAPI endpoints
│       ├── services/          # Legal Assistant & Contract Analyzer agentic pipelines
│       └── main.py            # Entry point (Port 8000)
└── frontend/                  # React + Vite Client
    ├── .env.example           # Frontend environment template
    ├── src/                   # Components, pages, styles, utils, API config
    └── package.json           # Frontend dependencies (Port 5173)
```

---

## 🚀 Quickstart Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/omBukkawar/Cyfuture_LegalSmiths.git
cd Cyfuture_LegalSmiths
```

### Step 2: Configure Environment Variables
Each service includes an `.env.example` template:

```bash
# 1. Node.js Backend
cp backend/node_backend/.env.example backend/node_backend/.env

# 2. Python AI Backend
cp backend/python_backend/.env.example backend/python_backend/.env

# 3. React Frontend
cp frontend/.env.example frontend/.env
```

### Step 3: Run Node.js Backend
```bash
cd backend/node_backend
npm install
npm start
# Server running at http://localhost:5000
```

### Step 4: Run Python AI Backend
```bash
cd backend/python_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# FastAPI running at http://localhost:8000 (Swagger docs: http://localhost:8000/docs)
```

### Step 5: Run React Frontend
```bash
cd frontend
npm install
npm run dev
# Vite client running at http://localhost:5173
```

---

## ⚙️ Environment Variables Reference

| Service | File | Key Variables |
|---|---|---|
| **Node.js** | `backend/node_backend/.env` | `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DATABASE`, `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PORT` |
| **Python** | `backend/python_backend/.env` | `OPENROUTER_API_KEY`, `SERPER_API_KEY`, `LEGAL_ASSISTANT_MODEL`, `CONTRACT_ANALYZER_MODEL`, `CASE_PREDICTOR_MODEL`, `PORT` |
| **Frontend** | `frontend/.env` | `VITE_NODE_API_URL`, `VITE_AI_API_URL` |

---

## 🧪 Quality & Testing
* **Frontend ESLint:** `cd frontend && npx eslint src` (0 errors)
* **Frontend Production Build:** `cd frontend && npm run build` (Clean 1.0s bundle)
* **API Documentation:** Interactive Swagger UI available at `http://localhost:8000/docs`
