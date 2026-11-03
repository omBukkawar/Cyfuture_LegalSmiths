# ⚖️ Cyfuture LegalSmiths

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react)](./frontend)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js)](./backend/node_backend)
[![FastAPI](https://img.shields.io/badge/AI%20Microservice-FastAPI%20%7C%20Python-009688?logo=fastapi)](./backend/python_backend)
[![Render](https://img.shields.io/badge/Cloud%20Hosting-Render-46E3B7?logo=render)](https://render.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions)](https://github.com/omBukkawar/Cyfuture_LegalSmiths/actions)
[![TiDB Cloud](https://img.shields.io/badge/Database-TiDB%20Cloud%20(MySQL)-3451B2)](https://tidbcloud.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)](https://cloud.mongodb.com)
[![OpenRouter](https://img.shields.io/badge/LLM-OpenRouter-6851FF)](https://openrouter.ai)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**LegalSmiths** is a full-stack, enterprise-grade legal-tech platform built for the **Cyfuture AI Hackathon 1.0**. It couples agentic AI pipelines with statutory Indian legal intelligence (Bharatiya Nyaya Sanhita, BNSS, IPC, CrPC, Contract Act), real-time search verification via Serper.dev, hybrid RAG document indexing, polyglot cloud persistence, and a gated production CI/CD pipeline.

---

## 🌐 Production Deployments

All services are fully deployed in the cloud with automated CI/CD:

| Tier | Service | Technology | Hosting Platform | Region | Status | Live Endpoint |
|---|---|---|---|---|---|---|
| **Client** | `legalsmiths` | React 18, Vite | Render Static Site | Global CDN | 🟢 Live | [legalsmiths.onrender.com](https://legalsmiths.onrender.com) |
| **App API** | `legalsmiths-node` | Node.js 20, Express | Render Web Service (Docker) | Singapore (`ap-southeast-1`) | 🟢 Live | [legalsmiths-node.onrender.com](https://legalsmiths-node.onrender.com) |
| **AI Microservice** | `legalsmiths-ai` | Python 3.11, FastAPI | Render Web Service (Docker) | Singapore (`ap-southeast-1`) | 🟢 Live | [legalsmiths-ai.onrender.com](https://legalsmiths-ai.onrender.com) |
| **Auth Database** | `users` | TiDB Serverless (MySQL) | TiDB Cloud (AWS) | Singapore (`ap-southeast-1`) | 🟢 Live | Managed TLS 1.2+ Cloud |
| **Data Database** | `legalData` | MongoDB v7.0 | MongoDB Atlas | AWS | 🟢 Live | Managed Multi-region Cluster |

---

## 🏛️ System Architecture

```text
                               ┌───────────────────────────────────┐
                               │     React / Vite Client (SPA)     │
                               │  https://legalsmiths.onrender.com │
                               └─────────────────┬─────────────────┘
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   │ REST (JWT Auth & Document CRUD)                           │ Direct AI Inference Requests
                   ▼                                                           ▼
    ┌──────────────────────────────┐                            ┌──────────────────────────────┐
    │     Node.js / Express        │                            │   Python / FastAPI AI Engine │
    │    (Docker Container)        │                            │      (Docker Container)      │
    │ legalsmiths-node.onrender.com│                            │  legalsmiths-ai.onrender.com │
    └──────────────┬───────────────┘                            └──────────────┬───────────────┘
                   │                                                           │
          ┌────────┴────────┐                                         ┌────────┴────────┐
          ▼                 ▼                                         ▼                 ▼
  ┌───────────────┐ ┌───────────────┐                         ┌───────────────┐ ┌───────────────┐
  │  TiDB Cloud   │ │ MongoDB Atlas │                         │  Serper.dev   │ │  OpenRouter   │
  │ (MySQL 8.0)   │ │  (Doc Store)  │                         │ (Google India)│ │ (Fallback LLM)│
  │  TLS 1.2 Auth │ │ Contracts/Chat│                         │ Indian Statutes│ │ Gemma/Mistral │
  └───────────────┘ └───────────────┘                         └───────────────┘ └───────────────┘
```

---

## 🔄 Automated CI/CD Pipeline

The project implements a modern, gated **GitHub Actions CI/CD Pipeline** (`.github/workflows/ci.yml`). Deployments to Render are strictly gated by automated quality checks:

```text
git push origin main
       │
       ├── Parallel CI Validation Gates:
       │   ├── 1. Frontend Check: ESLint linting + Production Vite build
       │   ├── 2. Node.js Backend Check: Dependency resolution + Express syntax & route test
       │   ├── 3. Python AI Check: Dependency resolution + FastAPI compilation verification
       │   └── 4. Docker Build Check: Multi-stage Docker image build verification (Node + Python)
       │
       └── CD Deployment Gates (Only on push to 'main' when ALL checks pass):
           ├── Deploy Frontend ───────► Authenticated Deploy Hook (Render Static Site)
           ├── Deploy Node Backend ───► Authenticated Deploy Hook (Render Docker Web Service)
           └── Deploy Python Backend ─► Authenticated Deploy Hook (Render Docker Web Service)
```

---

## 🌟 Core Modules

### 1. 🏛️ Agentic Legal Assistant (`/legalassistant`)
* **4-Node LangGraph-style Pipeline:**
  * **Node 1 (Guardrails):** Catches prompt injection, jailbreak attempts, and illegal solicitation.
  * **Node 2 (Serper Search):** Fetches real-time Indian legal provisions, BNS/BNSS amendments, and Supreme Court judgments.
  * **Node 3 (Evaluator):** Scores relevance and filters out noisy or foreign legal provisions.
  * **Node 4 (Synthesis):** OpenRouter LLMs generate plain-language advice with mandatory statutory citations.

### 2. 📜 Smart Contract Analyzer (`/contractanalyzer`)
* **4-Node LangGraph-style Pipeline:**
  * **Node 1 (Ingestion & Hybrid RAG):** Chunks contracts and executes multi-dimensional sparse + dense retrieval (BM25 + FAISS with MMR & Cross-Encoder reranker).
  * **Node 2 (Clause Extractor):** Isolates operational terms (parties, critical dates, payment terms, performance covenants, and termination triggers).
  * **Node 3 (Risk Auditor):** Flags uncapped indemnities, one-sided liabilities, and determines risk rating (`Low`, `Medium`, `High`).
  * **Node 4 (Synthesis & Formatter):** Generates plain summaries, actionable recommendations, and strict JSON output.

### 3. ⚖️ Case Outcome Predictor (`/caseoutcomeprediction`)
* Generates court-style legal advisory analyses based on Indian legal precedent.
* Predicts win probabilities, strongest arguments, statutory penalties, and procedural strategies.

---

## 📂 Project Structure

```text
Cyfuture_LegalSmiths/
├── .github/
│   └── workflows/
│       └── ci.yml             # Full-Stack GitHub Actions CI/CD Pipeline
├── backend/
│   ├── node_backend/          # Node.js + Express REST API
│   │   ├── Dockerfile         # Production Alpine-based container
│   │   ├── .dockerignore      # Docker ignore exclusions
│   │   ├── .env.example       # Node environment template
│   │   ├── src/               # Controllers, models, routes, middlewares, db (TiDB + MongoDB)
│   │   └── server.js          # Entry point (Port 5000)
│   └── python_backend/        # FastAPI AI Microservice
│       ├── Dockerfile         # Production Slim Python container
│       ├── .dockerignore      # Docker ignore exclusions
│       ├── requirements.txt   # Slimmed, production-safe dependencies
│       ├── .env.example       # Python environment template
│       ├── config/            # Settings & compute device selection
│       ├── models/            # OpenRouter LLM multi-model fallback wrapper
│       ├── routers/           # FastAPI endpoints
│       ├── services/          # Legal Assistant & Contract Analyzer agentic pipelines
│       └── main.py            # Entry point (Port 8000)
└── frontend/                  # React + Vite Client
    ├── vercel.json            # SPA routing rewrite configuration
    ├── .env.example           # Frontend environment template
    ├── src/                   # Components, pages, styles, utils, API config
    └── package.json           # Frontend dependencies (Port 5173)
```

---

## 🚀 Local Development Setup

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
# Server running at http://localhost:5000 (Health check: http://localhost:5000/health)
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

| Service | File | Key Variables | Description |
|---|---|---|---|
| **Node.js** | `backend/node_backend/.env` | `MYSQL_URL` / `DATABASE_URL` | TiDB Cloud TLS 1.2+ connection URI |
| | | `MONGODB_URI` | MongoDB Atlas cluster connection string |
| | | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | JWT signing keys |
| | | `PORT` | Service port (default `5000`) |
| **Python** | `backend/python_backend/.env` | `OPENROUTER_API_KEY` | OpenRouter API authentication |
| | | `SERPER_API_KEY` | Serper.dev Google India search key |
| | | `OPENROUTER_MODEL_NAME` | Default fallback LLM (`meta-llama/llama-3.3-70b-instruct`) |
| | | `PORT` | Service port (default `8000`) |
| **Frontend** | `frontend/.env` | `VITE_NODE_API_URL` | Production Node backend URL |
| | | `VITE_AI_API_URL` | Production Python AI backend URL |
| **CI/CD** | GitHub Secrets | `RENDER_DEPLOY_HOOK_FRONTEND` | Render Static Site deploy hook |
| | | `RENDER_DEPLOY_HOOK_NODE` | Render Node backend deploy hook |
| | | `RENDER_DEPLOY_HOOK_PYTHON` | Render Python backend deploy hook |

---

## 💡 Backend Keepalive & Demo Day Warm-up Guide (cron-job.org)

Render's free-tier Web Services automatically spin down ("sleep") after **15 minutes of inactivity**, causing the next request to experience a **30–50 second cold start**. 

To eliminate cold-start delays during hackathon evaluations, client presentations, or testing, **any team member can set up their own free automated keepalive cron jobs** on [cron-job.org](https://cron-job.org) in under 2 minutes.

### 🛠️ Self-Service Setup Instructions for Teammates

#### Step 1: Create a Free Account
1. Visit **[cron-job.org](https://cron-job.org)**.
2. Sign up for a free account (no credit card or billing details required).

#### Step 2: Create Keepalive Cron Job for Node.js Backend
1. In your dashboard, click **"CREATE CRONJOB"**.
2. Configure the following fields:
   * **Title:** `LegalSmiths - Node Backend Keepalive`
   * **URL:** `https://legalsmiths-node.onrender.com/health`
   * **Schedule:** Every **10 minutes** (`*/10 * * * *`)
   * **Request Method:** `GET`
3. Click **"Save"**.
4. **Important:** Click the toggle switch next to the job so that it is **DISABLED (grey)** by default.

#### Step 3: Create Keepalive Cron Job for Python AI Backend
1. Click **"CREATE CRONJOB"** again.
2. Configure the following fields:
   * **Title:** `LegalSmiths - Python AI Backend Keepalive`
   * **URL:** `https://legalsmiths-ai.onrender.com/health`
   * **Schedule:** Every **10 minutes** (`*/10 * * * *`)
   * **Request Method:** `GET`
3. Click **"Save"**.
4. Set to **DISABLED (grey)** by default.

---

### ⏱️ How & When to Use (Demo Day Workflow)

Keep jobs disabled during normal hours to preserve Render's monthly free-tier compute budget.

```text
[1 Hour Before Demo]              [During Presentation]             [After Presentation]
       │                                   │                                  │
       ▼                                   ▼                                  ▼
Login to cron-job.org             Both backends stay hot             Login to cron-job.org
Toggle BOTH jobs: GREEN (ON) ──►  Instant sub-second response ──►   Toggle BOTH jobs: GREY (OFF)
                                  No cold-start lag                  Services safely sleep
```

1. **1 Hour Before Demo/Testing:**
   * Log in to **cron-job.org**.
   * Toggle **BOTH** cron jobs to **ENABLED (Green)**.
   * This immediately wakes up both containers and sends an HTTP ping every 10 minutes to keep them hot.
2. **After the Demo/Testing is Finished:**
   * Log in to **cron-job.org**.
   * Toggle **BOTH** cron jobs to **DISABLED (Grey)**.
   * Services will naturally sleep after 15 minutes of inactivity.

---

### 🔍 Why Ping `/health` Instead of the Root URL?

| Metric | `/health` Endpoint (Recommended) | Root URL `/` or Web Page |
|---|---|---|
| **Response Payload** | Minimal JSON: `{"status":"healthy"}` (<100 bytes) | Heavy HTML / static bundle (several KB) |
| **Database Load** | Zero database queries executed | May trigger session or query validation |
| **Latency** | <50ms response time | 200–500ms processing time |
| **Purpose** | Strictly keeps container process alive | Intended for real human end users |

---

## 🧪 Quality & Testing
* **Frontend Linting:** `cd frontend && npx eslint src` (0 errors)
* **Frontend Production Build:** `cd frontend && npm run build` (Clean Vite bundle)
* **API Documentation:** Interactive Swagger UI available at `https://legalsmiths-ai.onrender.com/docs`
* **Automated CI/CD:** All commits verified via GitHub Actions on every push
