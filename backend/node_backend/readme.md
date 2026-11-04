# LegalSmiths — Node.js Express Backend

> **Persistence & Authentication Layer** — The backbone API server bridging the React frontend with the Python AI microservice, handling all user authentication, data persistence, and file operations.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Responsibilities](#responsibilities)
4. [Tech Stack](#tech-stack)
5. [File Structure](#file-structure)
6. [Database Design](#database-design)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)
9. [Local Setup](#local-setup)
10. [Render Deployment](#render-deployment)
11. [Authentication Flow](#authentication-flow)
12. [Security Considerations](#security-considerations)

---

## Overview

The LegalSmiths Node.js backend is an **Express 5** REST API server that sits between:

- 🖥️ **React Frontend** — receives and serves structured JSON for UI rendering
- 🤖 **Python AI Microservice** — proxies/stores AI-generated analysis results (contract audits, case predictions, summaries)
- 🗄️ **Dual Database Layer** — MySQL (TiDB Cloud) for relational user auth + MongoDB Atlas for flexible document storage

It is intentionally lightweight: all AI heavy-lifting is delegated to the Python microservice. This server's job is **identity, persistence, and routing**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                     │
│              React Frontend (Vite + React Router)                   │
│              http://localhost:5173  /  Render Static                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NODE.JS API SERVER (Express 5)                   │
│                    http://localhost:5000                            │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  /auth   │  │  /chats  │  │/contracts│  │  /cases /summ.   │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        │             │              │                  │            │
│   ┌────▼─────────────▼──────────────▼──────────────────▼─────────┐ │
│   │          Auth Middleware (JWT Verification)                   │ │
│   └────────────────────────┬─────────────────────────────────────┘ │
│                            │                                        │
│          ┌─────────────────┴────────────────────┐                  │
│          ▼                                       ▼                  │
│  ┌───────────────┐                    ┌──────────────────────┐      │
│  │  MySQL2 Pool  │                    │  Mongoose (MongoDB)   │      │
│  │  (TiDB Cloud) │                    │  (MongoDB Atlas)      │      │
│  │               │                    │                       │      │
│  │  users table  │                    │  chats, contracts,    │      │
│  │  (auth data)  │                    │  cases, summaries     │      │
│  └───────────────┘                    └──────────────────────┘      │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │       Multer Middleware (Multipart File Upload Handling)      │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  Internal HTTP (axios)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 PYTHON AI MICROSERVICE (FastAPI)                     │
│                 http://localhost:8000                                │
│                                                                     │
│    Contract Audit  │  Case Prediction  │  Document Summarization    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsibilities

| # | Responsibility | Implementation |
|---|----------------|----------------|
| 1 | **User Authentication** | JWT access tokens (15 min) + refresh tokens (7 days); `bcryptjs` password hashing with salt rounds = 10 |
| 2 | **User Data Storage** | MySQL via TiDB Cloud for relational user account records |
| 3 | **Document & Session Persistence** | MongoDB Atlas collections for chat history, contract vault, case records, and summaries |
| 4 | **File Uploads** | `Multer` middleware for multipart/form-data (PDF, DOCX, etc.) |
| 5 | **REST API** | Versioned JSON API consumed by the React frontend |
| 6 | **AI Result Persistence** | Stores raw AI analysis JSON (flexible `Mixed` schema) alongside extracted contract text |

---

## Tech Stack

| Package | Version | Role | Why Chosen |
|---------|---------|------|------------|
| **express** | 5.x | HTTP server & router | Minimal, fast, battle-tested; v5 adds native async error handling (no need for `express-async-errors`) |
| **mongoose** | 8.x | MongoDB ODM | Schema validation + `Mixed` type for flexible AI JSON blobs; v8 is Promises-native |
| **mysql2** | latest | MySQL/TiDB client | Native Promise support, prepared statements, connection pooling out-of-the-box |
| **jsonwebtoken** | latest | JWT sign/verify | Industry standard for stateless auth tokens |
| **bcryptjs** | latest | Password hashing | Pure-JS bcrypt — no native addon, works on any deploy target including Render |
| **multer** | latest | File uploads | Official Express multipart middleware; memory/disk storage configurable |
| **axios** | latest | Internal HTTP client | Internal calls to the Python AI microservice |
| **dotenv** | latest | Config management | Loads `.env` into `process.env`; keeps secrets out of source control |
| **nodemon** | dev | Hot reload | Auto-restarts server on file changes during development |

**Database choices:**

- **TiDB Cloud (MySQL-compatible)** — Serverless, horizontally scalable, free tier. MySQL-compatible means `mysql2` driver works without changes. Ideal for structured user auth data.
- **MongoDB Atlas** — Free M0 tier. Schema-flexible documents suit AI-generated JSON (each AI response can have different shapes), and MongoDB's document model maps naturally to chat sessions and contract records.

---

## File Structure

```
node_backend/
├── server.js                      # Entry point: DB connections + Express start
├── package.json                   # Dependencies and npm scripts
├── Dockerfile                     # Container definition for deployment
├── .env                           # Local secrets (never commit)
├── .env.example                   # Template with all required keys
└── src/
    ├── app.js                     # Express app config, CORS, middleware, route mounting
    │
    ├── controllers/
    │   ├── auth.controller.js     # register, login, refresh, logout handlers
    │   ├── chat.controller.js     # save / get / delete legal assistant sessions
    │   ├── contract.controller.js # save-audit, list, get-by-id, delete contracts
    │   ├── case.controller.js     # save / get case predictions
    │   └── summary.controller.js  # save / get document summaries
    │
    ├── models/
    │   ├── chat.model.js          # MongoDB schema: Chat sessions
    │   ├── contract.model.js      # MongoDB schema: Contracts (text + Mixed analysis)
    │   ├── casePredictor.model.js # MongoDB schema: Case prediction results
    │   └── summary.model.js       # MongoDB schema: Document summaries
    │
    ├── routes/
    │   ├── auth.routes.js         # POST /auth/register, /auth/login, /auth/refresh
    │   ├── chat.routes.js         # GET / POST / DELETE /chats
    │   ├── contract.routes.js     # GET / POST / DELETE /contracts (+ /save-audit)
    │   ├── case.routes.js         # GET / POST /cases
    │   └── summary.routes.js      # GET / POST /summaries
    │
    ├── middlewares/
    │   ├── auth.middleware.js     # Verifies Bearer JWT, attaches req.user
    │   └── upload.middleware.js   # Multer config: memory/disk storage, file filters
    │
    ├── db/
    │   ├── mongodb.js             # Mongoose.connect() to MongoDB Atlas
    │   └── sqldb.js               # mysql2.createPool() for TiDB Cloud
    │
    └── utils/
        └── apiFeatures.js         # Query helpers: pagination, filtering, sorting
```

### Key File Descriptions

| File | Purpose |
|------|---------|
| `server.js` | Calls `connectMongo()` and `connectSQL()` before `app.listen()`. Ensures no requests are served until both DBs are ready. |
| `src/app.js` | Mounts CORS (origin-whitelisted), JSON body parser, and all route modules. Single source of truth for middleware order. |
| `src/middlewares/auth.middleware.js` | Reads `Authorization: Bearer <token>`, verifies with `ACCESS_TOKEN_SECRET`, and injects `req.user` for downstream controllers. |
| `src/middlewares/upload.middleware.js` | Configures Multer for file type filtering (PDF, DOCX) and size limits before file data hits controllers. |
| `src/db/mongodb.js` | Establishes Mongoose connection with retry logic and event listeners for connection drops. |
| `src/db/sqldb.js` | Creates a `mysql2` connection pool (not single connection) for TiDB Cloud with TLS/SSL enabled. |
| `src/utils/apiFeatures.js` | Reusable class/functions for `limit`, `skip`, `sort`, and `filter` on Mongoose queries. |

---

## Database Design

### MySQL (TiDB Cloud) — `users` Table

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | PK, AUTO_INCREMENT | Surrogate user identifier |
| `name` | `VARCHAR(100)` | NOT NULL | Display name shown in the UI |
| `email` | `VARCHAR(100)` | NOT NULL, UNIQUE | Login credential; indexed by TiDB |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt hash (60-char output) |
| `created_at` | `DATETIME` | DEFAULT NOW() | Registration timestamp |

> **Why only MySQL for users?** Auth data is relational and low-volume — perfect for a typed, ACID-compliant store. MongoDB's document model would add unnecessary overhead for a simple user record.

---

### MongoDB Atlas Collections

#### `chats` — Legal Assistant Sessions

```js
{
  userId:    String,     // MySQL user ID (FK by convention)
  title:     String,     // Session display title
  messages:  [           // Ordered conversation turns
    {
      role:    String,   // "user" | "assistant"
      content: String,
      timestamp: Date
    }
  ],
  createdAt: Date
}
```

#### `contracts` — Contract Vault

```js
{
  userId:       String,  // Owner reference
  fileName:     String,  // Original upload filename
  contractText: String,  // Full extracted text (from PDF/DOCX)
  analysis:     Mixed,   // Full AI audit JSON (variable shape per model version)
  createdAt:    Date
}
```

> `analysis` uses Mongoose `Mixed` type to accommodate evolving AI response shapes without schema migrations.

#### `cases` — Case Predictions

```js
{
  userId:    String,
  caseTitle: String,
  caseData:  Mixed,   // Input parameters sent to AI
  verdict:   Mixed,   // AI prediction output JSON
  createdAt: Date
}
```

#### `summaries` — Document Summaries

```js
{
  userId:       String,
  documentName: String,
  summary:      String,  // Plain-text AI-generated summary
  createdAt:    Date
}
```

---

## API Reference

All protected endpoints require the header:

```
Authorization: Bearer <accessToken>
```

---

### Auth Routes — `/auth`

#### `POST /auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name":     "Jane Doe",
  "email":    "jane@lawfirm.com",
  "password": "StrongP@ss123"
}
```

**Success Response `201`:**
```json
{
  "user": {
    "id":    1,
    "name":  "Jane Doe",
    "email": "jane@lawfirm.com"
  },
  "accessToken":  "eyJhbGci....<15min JWT>",
  "refreshToken": "eyJhbGci....<7day JWT>"
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing required fields |
| `409` | Email already registered |

---

#### `POST /auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email":    "jane@lawfirm.com",
  "password": "StrongP@ss123"
}
```

**Success Response `200`:**
```json
{
  "user": {
    "id":    1,
    "name":  "Jane Doe",
    "email": "jane@lawfirm.com"
  },
  "accessToken":  "eyJhbGci....<15min JWT>",
  "refreshToken": "eyJhbGci....<7day JWT>"
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing fields |
| `401` | Invalid email or password |

---

#### `POST /auth/refresh`

Exchange a valid refresh token for a new access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci....<7day JWT>"
}
```

**Success Response `200`:**
```json
{
  "accessToken": "eyJhbGci....<new 15min JWT>"
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing refresh token |
| `401` | Expired or invalid refresh token |

---

### Chat Routes — `/chats` 🔒

> All endpoints require a valid `Authorization: Bearer` header.

#### `GET /chats`

Retrieve all chat sessions belonging to the authenticated user.

**Success Response `200`:**
```json
[
  {
    "_id":       "6641abc123...",
    "userId":    "1",
    "title":     "Contract Dispute Query",
    "messages":  [
      { "role": "user",      "content": "What are my rights?", "timestamp": "2024-05-10T10:00:00Z" },
      { "role": "assistant", "content": "Under Section 73...", "timestamp": "2024-05-10T10:00:02Z" }
    ],
    "createdAt": "2024-05-10T10:00:00Z"
  }
]
```

---

#### `POST /chats`

Save a new legal assistant chat session.

**Request Body:**
```json
{
  "title":    "Landlord Dispute",
  "messages": [
    { "role": "user",      "content": "Can my landlord evict me without notice?" },
    { "role": "assistant", "content": "Under the Rent Control Act..." }
  ]
}
```

**Success Response `201`:**
```json
{
  "_id":       "6641def456...",
  "userId":    "1",
  "title":     "Landlord Dispute",
  "messages":  [...],
  "createdAt": "2024-05-10T11:00:00Z"
}
```

---

#### `DELETE /chats/:id`

Delete a specific chat session by MongoDB ObjectId.

**Success Response `200`:**
```json
{
  "message": "Chat session deleted successfully"
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `404` | Chat not found or not owned by user |

---

### Contract Routes — `/contracts` 🔒

#### `GET /contracts`

List all contracts saved in the authenticated user's vault.

**Success Response `200`:**
```json
[
  {
    "_id":        "6641aaa111...",
    "userId":     "1",
    "fileName":   "nda_acme_corp.pdf",
    "contractText": "This Non-Disclosure Agreement...",
    "analysis":   {
      "riskScore":   72,
      "clauses":     [...],
      "redFlags":    [...]
    },
    "createdAt":  "2024-05-09T08:30:00Z"
  }
]
```

---

#### `GET /contracts/:id`

Retrieve a single contract with its full AI analysis.

**Success Response `200`:**
```json
{
  "_id":          "6641aaa111...",
  "userId":       "1",
  "fileName":     "nda_acme_corp.pdf",
  "contractText": "This Non-Disclosure Agreement is entered...",
  "analysis": {
    "riskScore": 72,
    "summary":   "High-risk NDA with broad IP assignment clause.",
    "clauses": [
      { "type": "IP Assignment", "risk": "high", "text": "..." }
    ],
    "redFlags": ["Unlimited liability", "No governing law clause"]
  },
  "createdAt": "2024-05-09T08:30:00Z"
}
```

---

#### `POST /contracts/save-audit`

Save a contract's extracted text plus the AI audit JSON to the vault.

> Typically called after the React frontend receives the analysis from the Python microservice and wants to persist it.

**Request Body:**
```json
{
  "fileName":     "service_agreement_v2.pdf",
  "contractText": "This Service Agreement is made between...",
  "analysis": {
    "riskScore": 45,
    "clauses":   [...],
    "redFlags":  []
  }
}
```

**Success Response `201`:**
```json
{
  "message":  "Contract audit saved successfully",
  "contract": {
    "_id":      "6641bbb222...",
    "fileName": "service_agreement_v2.pdf",
    "createdAt":"2024-05-10T12:00:00Z"
  }
}
```

---

#### `DELETE /contracts/:id`

Remove a contract from the vault.

**Success Response `200`:**
```json
{
  "message": "Contract removed from vault"
}
```

---

### Case Routes — `/cases` 🔒

#### `GET /cases`

List all case prediction records for the authenticated user.

**Success Response `200`:**
```json
[
  {
    "_id":       "6641ccc333...",
    "userId":    "1",
    "caseTitle": "Property Boundary Dispute",
    "caseData":  { "jurisdiction": "Delhi HC", "acts": ["Transfer of Property Act"] },
    "verdict":   { "outcome": "Likely favourable", "confidence": 0.78 },
    "createdAt": "2024-05-08T14:00:00Z"
  }
]
```

---

#### `POST /cases`

Save a new case prediction result.

**Request Body:**
```json
{
  "caseTitle": "Property Boundary Dispute",
  "caseData":  {
    "jurisdiction": "Delhi HC",
    "acts": ["Transfer of Property Act", "Civil Procedure Code"]
  },
  "verdict": {
    "outcome":    "Likely favourable",
    "confidence": 0.78,
    "reasoning":  "Precedents in HC favour plaintiff in boundary disputes..."
  }
}
```

**Success Response `201`:**
```json
{
  "message": "Case prediction saved",
  "_id":     "6641ddd444..."
}
```

---

### Summary Routes — `/summaries` 🔒

#### `GET /summaries`

Retrieve all document summaries for the authenticated user.

**Success Response `200`:**
```json
[
  {
    "_id":          "6641eee555...",
    "userId":       "1",
    "documentName": "High_Court_Judgment_2023.pdf",
    "summary":      "The court held that the defendant breached...",
    "createdAt":    "2024-05-07T09:00:00Z"
  }
]
```

---

#### `POST /summaries`

Save a new document summary.

**Request Body:**
```json
{
  "documentName": "High_Court_Judgment_2023.pdf",
  "summary":      "The court held that the defendant breached the terms of the lease..."
}
```

**Success Response `201`:**
```json
{
  "message": "Summary saved",
  "_id":     "6641fff666..."
}
```

---

## Environment Variables

Create a `.env` file in `node_backend/` by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `PORT` | ✅ | `5000` | Port the Express server listens on |
| `MONGODB_URI` | ✅ | `mongodb+srv://user:pass@cluster0.example.mongodb.net/legalData` | MongoDB Atlas connection string |
| `MYSQL_URL` | ⚠️ Optional | `mysql://user:pass@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/users?ssl={"rejectUnauthorized":true}` | Full TiDB Cloud URL (alternative to individual SQL vars) |
| `SQL_HOST` | ✅ | `127.0.0.1` | MySQL/TiDB host |
| `SQL_PORT` | ✅ | `3306` | MySQL/TiDB port |
| `SQL_USER` | ✅ | `root` | MySQL/TiDB username |
| `SQL_PASSWORD` | ✅ | `your_password` | MySQL/TiDB password |
| `SQL_DATABASE` | ✅ | `users` | MySQL/TiDB database name |
| `ACCESS_TOKEN_SECRET` | ✅ | `64-char random hex` | Secret for signing JWT access tokens |
| `REFRESH_TOKEN_SECRET` | ✅ | `64-char random hex` | Secret for signing JWT refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | ✅ | `15m` | Access token lifetime (jsonwebtoken format) |
| `REFRESH_TOKEN_EXPIRY` | ✅ | `7d` | Refresh token lifetime |

> **Generating secure secrets:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Run twice — one for each token secret.

---

## Local Setup

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **MySQL** instance (local MySQL 8, or TiDB Cloud free tier)
- A **MongoDB Atlas** account (free M0 cluster) **OR** a local MongoDB 7 instance

---

### Step 1 — Clone & Navigate

```bash
git clone <repo-url>
cd backend/node_backend
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all values. For local development:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legalData
SQL_HOST=127.0.0.1
SQL_PORT=3306
SQL_USER=root
SQL_PASSWORD=yourLocalPassword
SQL_DATABASE=users
ACCESS_TOKEN_SECRET=<generate with crypto.randomBytes>
REFRESH_TOKEN_SECRET=<generate with crypto.randomBytes>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

### Step 4 — Set Up MySQL Database

Connect to your MySQL instance and create the required table:

```sql
CREATE DATABASE IF NOT EXISTS users;
USE users;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);
```

**Using TiDB Cloud (free tier)?**

1. Sign up at [tidbcloud.com](https://tidbcloud.com)
2. Create a Serverless cluster
3. Connect via the connection string — copy it into `MYSQL_URL` or fill the individual `SQL_*` vars
4. Run the same `CREATE TABLE` SQL above in the TiDB SQL editor

---

### Step 5 — Set Up MongoDB

**Atlas (recommended):**

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free **M0** cluster
3. Whitelist your IP (or `0.0.0.0/0` for dev)
4. Create a database user and copy the connection string into `MONGODB_URI`

Collections (`chats`, `contracts`, `cases`, `summaries`) are created automatically by Mongoose on first write.

---

### Step 6 — Start the Development Server

```bash
npm run dev
```

This starts the server with `nodemon` — it auto-restarts on any file change.

**Expected output:**
```
[MongoDB] Connected to Atlas ✅
[MySQL]   TiDB Cloud pool ready ✅
[Server]  Listening on http://localhost:5000
```

---

### Step 7 — Verify

```bash
curl http://localhost:5000/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'
```

Expected: `201` response with `accessToken` and `refreshToken`.

---

## Render Deployment

LegalSmiths backend is deployed on **Render** as a Web Service.

### Deployment Steps

1. Push your code to GitHub (ensure `.env` is in `.gitignore`)

2. Go to [render.com](https://render.com) → **New Web Service**

3. Connect your GitHub repository

4. Configure the service:

| Setting | Value |
|---------|-------|
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Node Version** | `18` or `20` (set via `NODE_VERSION` env var) |

5. Add all environment variables from the [Environment Variables](#environment-variables) table in the **Render dashboard** → Environment tab

6. For MongoDB Atlas: add the Render outbound IP addresses to your Atlas IP whitelist (or temporarily use `0.0.0.0/0`)

7. For TiDB Cloud: use the full `MYSQL_URL` with SSL (`rejectUnauthorized: true`)

8. Click **Deploy**

### Render-Specific Notes

- Render free tier spins down after 15 minutes of inactivity — first request after sleep may take ~30s (cold start)
- Use **Render's Secret Files** feature for `.env` if you prefer file-based config over env vars
- Health check endpoint: consider adding `GET /health` → `{ status: "ok" }` for Render's uptime monitoring

---

## Authentication Flow

```
                        ┌──────────────┐
                        │   Register   │
                        │POST /auth/register
                        └──────┬───────┘
                               │
                    ┌──────────▼───────────┐
                    │  Hash password with  │
                    │  bcryptjs (10 rounds)│
                    │  Store in MySQL      │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Sign Access Token   │  ← expires in 15 min
                    │  Sign Refresh Token  │  ← expires in 7 days
                    └──────────┬───────────┘
                               │
                        ┌──────▼───────┐
                        │  Return both │
                        │  tokens to   │
                        │  client      │
                        └──────────────┘


                     ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

                     Normal Request Flow:

   Client                               Server
     │                                     │
     │── GET /chats ──────────────────────►│
     │   Authorization: Bearer <15m token> │
     │                                     │── auth.middleware.js verifies token
     │                                     │── Attaches req.user = { id, email }
     │                                     │── Controller queries MongoDB
     │◄── 200 OK + data ──────────────────│


                     ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

                     Token Refresh Flow:

   Client                               Server
     │                                     │
     │── POST /auth/refresh ──────────────►│
     │   { refreshToken: "..." }           │
     │                                     │── Verify with REFRESH_TOKEN_SECRET
     │                                     │── If valid, sign new access token
     │◄── 200 OK + { accessToken } ───────│
```

**Token Storage Recommendation (Frontend):**
- Store `accessToken` in memory (React state/context)
- Store `refreshToken` in an `httpOnly` cookie or `localStorage` (tradeoff: XSS vs CSRF)
- Implement a silent refresh: intercept `401` responses and call `/auth/refresh` automatically

---

## Security Considerations

### Authentication

| Measure | Implementation |
|---------|---------------|
| **Short-lived access tokens** | 15-minute expiry limits the window if a token is stolen |
| **Separate refresh token secret** | `REFRESH_TOKEN_SECRET` ≠ `ACCESS_TOKEN_SECRET` — compromise of one doesn't affect the other |
| **bcrypt with salt rounds = 10** | ~100ms hash time — renders brute-force attacks computationally expensive |
| **No plaintext passwords** | Passwords never stored or logged; only the bcrypt hash persists in MySQL |

### Transport

- **HTTPS only in production** — Render provides TLS automatically; never serve over plain HTTP in prod
- **TiDB Cloud TLS** — `ssl: { rejectUnauthorized: true }` enforced in the MySQL pool config
- **MongoDB Atlas TLS** — Atlas enforces TLS on all connections by default

### Input Validation

- Validate all request bodies before hitting the database (consider `joi` or `zod` for schema validation)
- Sanitize MongoDB query inputs to prevent NoSQL injection
- Use parameterized queries via `mysql2` prepared statements to prevent SQL injection

### File Uploads

- **Multer file type filtering** — Restrict to allowed MIME types (e.g., `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- **File size limits** — Set `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB) in Multer config
- **Filename sanitisation** — Never use the original filename as a filesystem path without sanitisation

### CORS

- **Whitelist specific origins** in `src/app.js` — do not use `cors({ origin: '*' })` in production
- Example: `cors({ origin: ['https://legalSmiths.onrender.com', 'http://localhost:5173'] })`

### Secrets Management

- Never commit `.env` to source control — ensure `.env` is in `.gitignore`
- Rotate `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` periodically
- Use Render's Environment tab (or Secret Files) rather than hardcoding values

### Rate Limiting (Recommended Addition)

Consider adding `express-rate-limit` to the auth routes to prevent brute-force attacks:

```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window per IP
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/auth', authLimiter);
```

---

## npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon server.js` | Development server with hot reload |
| `start` | `node server.js` | Production server (used by Render) |

---

## Contributing

1. Branch from `main`: `git checkout -b feature/your-feature`
2. Follow the existing controller/route/model pattern
3. Keep controllers thin — business logic should be extractable to service files
4. Never log sensitive data (`password`, tokens, raw DB credentials)
5. Open a pull request with a clear description of changes

---

*LegalSmiths Backend — built with Express 5 · Mongoose 8 · MySQL2 · TiDB Cloud · MongoDB Atlas*
