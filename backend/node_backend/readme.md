# LegalSmiths — Node.js Express Backend

> **Identity & Persistence Gateway**: A hardened Express 5 microservice managing authentication, user state, and AI session history across MySQL (TiDB Cloud) and MongoDB Atlas with multi-tier rate limiting and httpOnly cookie security.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack & Rationale](#tech-stack--rationale)
4. [File Structure](#file-structure)
5. [Security & Authentication](#security--authentication)
6. [Database Schema Design](#database-schema-design)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)
9. [Local Setup](#local-setup)
10. [Render Deployment](#render-deployment)
11. [Contributing](#contributing)
12. [License](#license)

---

## Overview

The Node.js backend serves as the **central data gateway** and **authentication authority** for the LegalSmiths platform. It manages user credentials, discussion sessions, contract vault storage, and case records.

> **Direct AI Microservice Routing**: The React frontend communicates **directly** with the Python FastAPI backend (`VITE_AI_API_URL`) for all inference tasks (Legal Assistant research, Contract Analyzer risk audit, Case Predictor adversarial debate). The Node.js backend (`VITE_NODE_API_URL`) is utilized strictly for identity management, session storage, and audit history.

### Core Responsibilities
- **Authentication**: JWT-based session management using dual-token architecture (`accessToken` 15 min, `refreshToken` 7 days) stored in secure `httpOnly` cookies with `Bearer` header fallback.
- **Relational Identity Store**: MySQL (via TiDB Cloud Serverless) for strict ACID user identity and password verification.
- **Document & History Store**: MongoDB Atlas for persistence of legal chat sessions, contract audit reports, case predictions, and text summaries.
- **Protective Rate Limiting**: 3-tier sliding window rate limiting via `express-rate-limit` protecting against brute-force attacks and resource exhaustion.
- **Payload Sanitization & Streaming**: Strict 2MB body parser limits and Multer streaming file validators (PDF, DOCX, DOC, TXT up to 20MB).

---

## Architecture

```
                                 REACT FRONTEND (Vite / Port 5173)
                                                │
                                                ▼  HTTPS + httpOnly Cookies
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXPRESS 5 BACKEND (Port 5000)                               │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│  Middleware Pipeline:                                                                     │
│  ├── CORS (Restricted origin whitelist, credentials: true)                                │
│  ├── express.json({ limit: "2mb" })                                                       │
│  ├── cookie-parser (Extracts encrypted httpOnly JWTs)                                     │
│  ├── generalLimiter (200 requests / 15 min window)                                        │
│  └── verifyToken Middleware (Cookie-first with Authorization Bearer header fallback)      │
├───────────────────────────────────────┬───────────────────────────────────────────────────┤
│  Route Handlers:                      │  Target Store:                                    │
│  ├── /api/auth (authLimiter: 20/15m)  │  ──► MySQL / TiDB Cloud (users table)             │
│  ├── /api/chats (generalLimiter)      │  ──► MongoDB Atlas (chats collection)             │
│  ├── /api/contracts (aiLimiter: 30/15m)──► MongoDB Atlas (contracts collection)         │
│  ├── /api/cases (aiLimiter: 30/15m)   │  ──► MongoDB Atlas (cases collection)             │
│  └── /api/summaries (generalLimiter)  │  ──► MongoDB Atlas (summaries collection)         │
│                                       │                                                   │
│  Health Check:                        │                                                   │
│  └── GET /health                      │  ──► Checks MongoDB mongoose.connection.readyState│
└───────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## Tech Stack & Rationale

| Package | Version | Why Chosen |
|---|---|---|
| **express** | `^5.1.0` | Next-generation Express framework with native async error handling, eliminating unhandled promise rejections without external wrappers. |
| **express-rate-limit** | `^7.5.0` | Lightweight in-memory sliding window rate limiter enforcing multi-tier abuse protection. |
| **cookie-parser** | `^1.4.7` | Parses signed and unsigned cookies, enabling secure `httpOnly` XSS-resilient token storage. |
| **jsonwebtoken** | `^9.0.2` | Implements RFC 7519 JSON Web Tokens for stateless, cryptographically signed authentication. |
| **bcryptjs** | `^3.0.3` | Optimized pure-JavaScript implementation of bcrypt password hashing using 10 salt rounds. |
| **mongoose** | `^8.18.0` | Strict object data modeling (ODM) for MongoDB with schema validations, casting, and query building. |
| **mysql2** | `^3.14.3` | High-performance MySQL driver supporting connection pooling, prepared statements, and TLS encryption for TiDB Cloud. |
| **multer** | `^2.5.0` | Middleware for handling `multipart/form-data` file uploads with strict file size and MIME-type filters. |
| **cors** | `^2.8.5` | Configurable Cross-Origin Resource Sharing middleware enabling secure cross-domain cookie transmission. |
| **dotenv** | `^16.4.7` | Zero-dependency module that loads environment variables from `.env` into `process.env`. |

---

## File Structure

```
backend/node_backend/
├── .dockerignore                      # Docker build exclusions
├── .env.example                       # Reference environment variables
├── Dockerfile                         # Container build specification
├── package-lock.json                  # Pinned dependency tree
├── package.json                       # Node dependencies and execution scripts
├── readme.md                          # Service documentation
├── server.js                          # Application entry point: DB initialization & HTTP listen
│
└── src/
    ├── app.js                         # Express configuration, global middleware, rate limiters, route mounting
    │
    ├── controllers/
    │   ├── auth.controller.js         # User registration, login, token refresh, logout, profile
    │   ├── chat.controller.js         # Legal Assistant conversation persistence (create, list, delete)
    │   ├── contract.controller.js     # Contract vault CRUD (save-audit, list, fetch, delete)
    │   ├── case.controller.js         # Case Outcome Predictor history management
    │   └── summary.controller.js      # Legal document summary storage
    │
    ├── middlewares/
    │   ├── auth.middleware.js         # verifyToken: validates JWTs from httpOnly cookie or Bearer header
    │   └── upload.middleware.js       # Multer configuration with MIME-type and 20MB file limits
    │
    ├── models/
    │   ├── chat.model.js              # MongoDB Schema: chat sessions with 20k char limits & role enums
    │   ├── contract.model.js          # MongoDB Schema: contract text & Mixed AI risk analysis reports
    │   ├── casePredictor.model.js     # MongoDB Schema: dispute facts & adversarial verdicts
    │   └── summary.model.js           # MongoDB Schema: document summaries & categorization tags
    │
    ├── routes/
    │   ├── auth.routes.js             # Routes: /api/auth (register, login, refresh-token, logout, me)
    │   ├── chat.routes.js             # Routes: /api/chats (/sessions, /sessions/:sessionId, etc.)
    │   ├── contract.routes.js         # Routes: /api/contracts (/contracts, /save-audit, etc.)
    │   ├── case.routes.js             # Routes: /api/cases (/cases, /save-prediction, etc.)
    │   └── summary.routes.js          # Routes: /api/summaries (/summaries, /add-summary, etc.)
    │
    ├── db/
    │   ├── mongodb.js                 # Mongoose connection manager with reconnection logic
    │   └── sqldb.js                   # MySQL2 connection pool configured for TiDB Cloud SSL
    │
    └── utils/
        └── apiFeatures.js             # Reusable pagination, sorting, and field-limiting query utilities
```

---

## Security & Authentication

### 1. Dual-Token Architecture with httpOnly Cookies
- **Access Token**: Short-lived (15 minutes). Signed with `ACCESS_TOKEN_SECRET`.
- **Refresh Token**: Long-lived (7 days). Signed with `REFRESH_TOKEN_SECRET` and scoped to `/api/auth`.
- **Storage**: Set in `httpOnly`, `SameSite=Strict` cookies to completely neutralize Cross-Site Scripting (XSS) token extraction attacks.
- **Client Fallback**: Also returned in response payloads for backward compatibility with mobile apps and local storage clients.

### 2. Multi-Tier Rate Limiting (`express-rate-limit`)

| Tier | Window | Max Requests | Key Target | Purpose |
|---|---|---|---|---|
| **Auth Limiter** | 15 minutes | 20 attempts | IP address | Thwarts brute-force password cracking on `/api/auth/*` |
| **AI Audits Limiter (iLimiter)** | 15 minutes | 30 requests | User ID (or IP) | Protects contract and case audit endpoints from rapid submissions |
| **General API Limiter**| 15 minutes | 200 requests| IP address | Protects standard CRUD endpoints from scraping/flooding |

### 3. Database-Level Protections
- **NoSQL Injection Defense**: All MongoDB queries use Mongoose schema definitions with explicit casting and sanitization.
- **SQL Injection Defense**: User queries executed via `mysql2` execute as parameterized queries with prepared statements.
- **Payload Capping**: Body parser is strictly capped at `2mb` to thwart large-payload Denial of Service attacks.

---

## Database Schema Design

### 1. MySQL / TiDB Cloud — User Authentication (`users`)

```sql
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255)        NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password       VARCHAR(255)        NOT NULL,
  phone_number   VARCHAR(50)         NOT NULL,
  refresh_token  TEXT                NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. MongoDB Atlas Collections

#### `chats` (Legal Assistant Sessions)
```javascript
{
  userId:    { type: String, required: true, index: true },
  title:     { type: String, trim: true, default: "Legal Inquiry" },
  messages:  [
    {
      role:      { type: String, enum: ["user", "assistant", "system"], required: true },
      content:   { type: String, required: true, maxlength: 20000 },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  category:  { type: String, enum: ["general", "contract", "criminal", "civil", "mixed"], default: "general" },
  createdAt: { type: Date, default: Date.now }
}
```

#### `contracts` (Contract Vault & Audit History)
```javascript
{
  userId:       { type: String, required: true, index: true },
  originalName: { type: String, trim: true },
  mimeType:     { type: String, enum: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/msword"] },
  fileSize:     { type: Number, min: 0, max: 20971520 }, // 20 MB max
  contractText: { type: String, maxlength: 500000 },
  analysis:     { type: mongoose.Schema.Types.Mixed, default: null }, // Full agentic audit JSON
  createdAt:    { type: Date, default: Date.now }
}
```

#### `cases` (Case Prediction Vault)
```javascript
{
  userId:     { type: String, required: true, index: true },
  title:      { type: String, trim: true, maxlength: 300 },
  caseFacts:  { type: String, required: true, maxlength: 20000 },
  status:     { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  prediction: { type: mongoose.Schema.Types.Mixed, default: null }, // Adversarial debate verdict JSON
  createdAt:  { type: Date, default: Date.now }
}
```

#### `summaries` (Legal Summaries)
```javascript
{
  userId:    { type: String, required: true, index: true },
  title:     { type: String, required: true, maxlength: 300 },
  text:      { type: String, required: true, maxlength: 50000 },
  tags:      [{ type: String }], // Max 20 tags
  createdAt: { type: Date, default: Date.now }
}
```

---

## API Reference

All protected routes require either an `accessToken` cookie or an `Authorization: Bearer <token>` header.

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user; saves password hash & phone_number; returns tokens and sets cookies |
| `POST` | `/api/auth/login` | Public | Authenticate user; returns tokens and sets httpOnly cookies |
| `POST` | `/api/auth/refresh-token` | Public | Exchanges valid refresh token for a newly signed access token |
| `POST` | `/api/auth/logout` | Protected | Clears authentication cookies |
| `GET` | `/api/auth/me` | Protected | Retrieves current authenticated user profile |

---

### Chat Sessions Endpoints (`/api/chats`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chats/sessions` | Create a new legal chat session |
| `GET` | `/api/chats/sessions` | List all chat sessions for the authenticated user |
| `GET` | `/api/chats/sessions/:sessionId` | Retrieve full message thread for a session |
| `POST` | `/api/chats/sessions/:sessionId/messages` | Append user/assistant message to a session |
| `PATCH` | `/api/chats/sessions/:sessionId/title` | Update session title |
| `DELETE` | `/api/chats/sessions/:sessionId` | Permanently delete a chat session |

---

### Contract Vault Endpoints (`/api/contracts`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/contracts/contracts` | List all uploaded contracts and audit records |
| `POST` | `/api/contracts/contracts/save-audit` | Save full contract text and complete AI risk analysis report |
| `GET` | `/api/contracts/contracts/:id` | Fetch complete risk audit report, red flags, and extracted clauses |
| `DELETE` | `/api/contracts/contracts/:id` | Permanently delete contract record from MongoDB |
| `GET` | `/api/contracts/contracts/high-risk` | Query top 5 high-risk contracts |
| `GET` | `/api/contracts/contracts/recent` | Query 5 most recent contract audits |

---

### Case Outcome Endpoints (`/api/cases`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases/cases` | List all case predictions for the authenticated user |
| `POST` | `/api/cases/cases` | Store dispute facts and prediction outcome |
| `POST` | `/api/cases/cases/save-prediction`| Store case analysis via direct prediction endpoint |
| `GET` | `/api/cases/cases/:id` | Fetch complete adversarial brief and judicial verdict scorecard |
| `DELETE` | `/api/cases/cases/:id` | Delete case outcome record |
| `GET` | `/api/cases/cases/recent` | Query 5 most recent case predictions |
| `GET` | `/api/cases/cases/completed` | Query completed case predictions |

---

### Summaries Endpoints (`/api/summaries`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/summaries/summaries` | List all summaries for authenticated user |
| `POST` | `/api/summaries/summaries` | Create a new legal summary |
| `POST` | `/api/summaries/add-summary` | Alternate endpoint to save a summary |
| `GET` | `/api/summaries/summaries/:id` | Retrieve single summary by ID |
| `PATCH` | `/api/summaries/summaries/:id` | Update summary title, text, or tags |
| `DELETE` | `/api/summaries/summaries/:id` | Delete summary record |

---

### System Diagnostics

#### `GET /health`
Validates MongoDB database connectivity (`mongoose.connection.readyState`).
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "timestamp": "2026-11-07T10:30:00.000Z"
}
```

---

## Environment Variables

Create `.env` in `backend/node_backend/` (reference `.env.example`):

```env
# Runtime Environment
NODE_ENV=production

# Server Port
PORT=5000

# Client Origins for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://legalsmiths.onrender.com

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/legalData?retryWrites=true&w=majority

# TiDB Cloud MySQL Connection URL
MYSQL_URL=mysql://<user>:<password>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/users?ssl={"rejectUnauthorized":true}

# JWT Signing Secrets (Generate using crypto.randomBytes(64).toString('hex'))
ACCESS_TOKEN_SECRET=your_super_secret_64_character_hex_access_token_key
REFRESH_TOKEN_SECRET=your_super_secret_64_character_hex_refresh_token_key

# Token Lifespans
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

## Local Setup

### Prerequisites
- Node.js `18.x` or higher
- npm or pnpm
- Running MySQL instance (or free TiDB Cloud account)
- MongoDB Atlas cluster (M0 free tier)

### Installation Steps

```bash
# 1. Navigate to Node backend directory
cd backend/node_backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas and TiDB Cloud credentials

# 4. Start server in development mode (with hot-reload)
npm run dev

# Server will run on: http://localhost:5000
# Verify health: http://localhost:5000/health
```

---

## Render Deployment

Deploy as a **Web Service** on Render:

| Field | Configuration |
|---|---|
| **Environment** | `Node` |
| **Root Directory** | `backend/node_backend` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Health Check Path**| `/health` |

Ensure all environment variables (`MONGODB_URI`, `MYSQL_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ALLOWED_ORIGINS`) are entered in **Render Dashboard -> Environment**.

---

## License

MIT License — Copyright (c) 2026 LegalSmiths.
