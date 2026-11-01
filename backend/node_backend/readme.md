# LegalSmiths — Node.js & Express Backend

A robust, modular, and production-ready RESTful backend API for **Cyfuture LegalSmiths**, built with **Node.js, Express, MongoDB Atlas, and MySQL**.

---

## 🌟 Key Features

- **JWT Authentication:** Dual-token architecture (short-lived Access Tokens + rotating Refresh Tokens) with `bcryptjs` and database token revocation.
- **Modular MVC Architecture:** Strict separation of concerns across `controllers/`, `routes/`, `models/`, `middlewares/`, `db/`, and `utils/`.
- **Dual Database Strategy:**
  - **MySQL:** Fast relational user account storage and authentication.
  - **MongoDB Atlas:** Scalable document store for contracts, case files, legal summaries, and chat history.
- **Advanced Query Features (`APIFeatures`):**
  - **Filtering:** Exact matching and MongoDB comparison operators (`[gte]`, `[lte]`, `[gt]`, `[lt]`, `[in]`).
  - **Keyword Search:** Global case-insensitive regex search across titles and file names.
  - **Sorting:** Multi-field ascending/descending sorting (`?sort=-createdAt,fileSize`).
  - **Field Limiting:** Custom projection to optimize network payload (`?fields=originalName,status`).
  - **Pagination:** Standardized metadata (`total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`).
  - **Route Aliasing:** Pre-configured shortcuts (`/contracts/high-risk`, `/cases/recent`).
- **Optimized Document Streaming:** Base64 binary file data is excluded from default queries (`select: false`) and streamed on-demand via dedicated download endpoints.
- **Enterprise Security:** ReDoS-protected Multer file handling with 10MB limits, CORS configuration, and centralized error handling.

---

## 📂 Project Structure

```text
backend/node_backend/
├── .env.example              # Environment variables template
├── package.json              # Backend dependencies and scripts
├── server.js                 # App entrypoint & DB initialization
└── src/
    ├── app.js                # Express app setup, middlewares, and route mounting
    ├── db/
    │   ├── mongodb.js        # MongoDB Atlas connection handler
    │   └── sqldb.js          # MySQL connection pool (mysql2/promise)
    ├── models/
    │   ├── contract.model.js # Contract metadata, binary, and AI analysis schema
    │   ├── casePredictor.model.js # Case facts, files, and court advisory schema
    │   ├── chat.model.js     # Legal assistant chat sessions & message history
    │   └── summary.model.js  # User legal notes & summaries schema
    ├── controllers/
    │   ├── auth.controller.js     # Registration, login, token refresh, logout, profile
    │   ├── contract.controller.js # Full CRUD, file download, and AI analysis updates
    │   ├── case.controller.js     # Full CRUD, case file streaming, and prediction updates
    │   ├── chat.controller.js     # Chat session management and message appending
    │   └── summary.controller.js  # Notes & summaries CRUD
    ├── routes/
    │   ├── auth.routes.js         # /api/auth routes
    │   ├── contract.routes.js     # /api/contracts routes
    │   ├── case.routes.js         # /api/cases routes
    │   ├── chat.routes.js         # /api/chats routes
    │   └── summary.routes.js      # /api/summaries routes
    ├── middlewares/
    │   ├── auth.middleware.js     # JWT Bearer token verification
    │   └── upload.middleware.js   # Multer memory storage & size validation
    └── utils/
        └── apiFeatures.js         # Reusable filtering, sorting, field limiting & pagination engine
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in `backend/node_backend/`:

```env
# Server
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# MySQL
SQL_HOST=127.0.0.1
SQL_USER=root
SQL_PASSWORD=your_mysql_password
SQL_DATABASE=users

# JWT Authentication
ACCESS_TOKEN_SECRET=your_super_secret_access_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend/node_backend
npm install
```

### 2. MySQL Database Setup
```sql
CREATE DATABASE users;
USE users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    refresh_token TEXT
);
```

### 3. Run Server
```bash
# Development (with nodemon auto-restart)
npm run dev

# Production
npm start
```

---

## 📚 API Endpoints

> **Note:** All endpoints support both root URLs (e.g. `/login`, `/contracts`) for backwards compatibility and namespaced REST paths (e.g. `/api/auth/login`, `/api/contracts`).

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register new user; returns user info + access & refresh tokens |
| `POST` | `/login` | Public | Authenticate user; returns tokens |
| `POST` | `/refresh-token` | Public | Exchange valid refresh token for fresh token pair |
| `POST` | `/logout` | Protected | Invalidate refresh token |
| `GET` | `/me` | Protected | Fetch authenticated user profile |

---

### 2. Contract Management (`/api/contracts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/contracts` *(or `/upload-contract`)* | Public/Auth | Upload contract PDF/DOCX (Multer memory) |
| `GET` | `/contracts` | Public/Auth | List contracts with filtering, sorting, search & pagination |
| `GET` | `/contracts/high-risk` | Public/Auth | **Aliased:** Top 5 high-risk contracts |
| `GET` | `/contracts/recent` | Public/Auth | **Aliased:** 5 most recently uploaded contracts |
| `GET` | `/contracts/:id` | Public/Auth | Get contract metadata and analysis by ID |
| `GET` | `/contracts/:id/download` | Public/Auth | Download/stream original file buffer |
| `PATCH` | `/contracts/:id` | Public/Auth | Update contract details (name, status) |
| `PATCH` | `/contracts/:id/analysis` | Public/Auth | Save Gemini AI structured analysis JSON |
| `DELETE` | `/contracts/:id` | Public/Auth | Delete contract record |

---

### 3. Case Outcome Prediction (`/api/cases`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/cases` *(or `/upload-case`)* | Public/Auth | Submit case text facts or upload case document |
| `GET` | `/cases` | Public/Auth | List cases with filtering, sorting, and pagination |
| `GET` | `/cases/recent` | Public/Auth | **Aliased:** 5 most recent case advisories |
| `GET` | `/cases/completed` | Public/Auth | **Aliased:** Cases with completed predictions |
| `GET` | `/cases/:id` | Public/Auth | Get case details and court prediction |
| `GET` | `/cases/:id/download` | Public/Auth | Download case document |
| `PATCH` | `/cases/:id` | Public/Auth | Update case details |
| `PATCH` | `/cases/:id/prediction` | Public/Auth | Save Gemini AI court advisory prediction JSON |
| `DELETE` | `/cases/:id` | Public/Auth | Delete case record |

---

### 4. Legal Assistant Chat History (`/api/chats`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sessions` | Public/Auth | Start a new legal consultation session |
| `GET` | `/sessions` | Public/Auth | List chat sessions for user sidebar |
| `GET` | `/sessions/:sessionId` | Public/Auth | Retrieve session message history |
| `POST` | `/sessions/:sessionId/messages` | Public/Auth | Append user query or Gemini response |
| `DELETE` | `/sessions/:sessionId` | Public/Auth | Delete chat session |

---

### 5. Legal Summaries & Notes (`/api/summaries`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/summaries` *(or `/add-summary`)* | Public/Auth | Create a legal summary or research note |
| `GET` | `/summaries` | Public/Auth | List summaries with search & pagination |
| `GET` | `/summaries/:id` | Public/Auth | Get summary by ID |
| `PATCH` | `/summaries/:id` | Public/Auth | Update summary text or tags |
| `DELETE` | `/summaries/:id` | Public/Auth | Delete summary |

---

## 🔍 Advanced Query Features Guide

### 1. Advanced Filtering
Filter records by status, file size, or nested analysis results:
```http
GET /api/contracts?status=analyzed
GET /api/contracts?fileSize[gte]=500000
GET /api/contracts?analysis.risk_level=High
```

### 2. Keyword Search
Search across multiple fields simultaneously:
```http
GET /api/contracts?search=employment
GET /api/cases?search=arbitration
```

### 3. Dynamic Sorting
Sort ascending or descending by any field:
```http
GET /api/contracts?sort=-createdAt          # Newest first (Default)
GET /api/contracts?sort=fileSize,-createdAt # Smallest file first, then newest
```

### 4. Field Limiting (Projection)
Reduce network payload by selecting specific fields:
```http
GET /api/contracts?fields=originalName,status,fileSize,createdAt
```

### 5. Pagination
Paginate large datasets with standard pagination metadata:
```http
GET /api/contracts?page=2&limit=10
```

**Standardized Response:**
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "total": 45,
    "page": 2,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  },
  "data": [ ... ]
}
```

---

## 🛡️ Health & Monitoring

Check API status and server time:
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-11-01T02:15:00.000Z"
}
```
