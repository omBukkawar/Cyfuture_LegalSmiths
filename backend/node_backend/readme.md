# LegalSmiths — Node.js & Express Backend

A robust, modular, and production-ready RESTful backend API for **Cyfuture LegalSmiths**, built with **Node.js, Express, MongoDB Atlas, and TiDB Cloud (MySQL)**.

---

## 🌐 Live Production Deployment

The backend is deployed as a containerized web service on **Render**:
* **Live Base URL:** [https://legalsmiths-node.onrender.com](https://legalsmiths-node.onrender.com)
* **Health Check:** [https://legalsmiths-node.onrender.com/health](https://legalsmiths-node.onrender.com/health)
* **Hosting:** Render Web Service (Docker Runtime)
* **Region:** Singapore (`ap-southeast-1`) — Optimized for sub-50ms latency across India.
* **CI/CD:** Automated verification and gated webhook deployment via GitHub Actions.

---

## 🌟 Key Features

- **JWT Authentication:** Dual-token architecture (short-lived Access Tokens + rotating Refresh Tokens) with `bcryptjs` and database token revocation.
- **Modular MVC Architecture:** Strict separation of concerns across `controllers/`, `routes/`, `models/`, `middlewares/`, `db/`, and `utils/`.
- **Polyglot Persistence Strategy:**
  - **TiDB Cloud (MySQL 8.0 Serverless):** Relational user account storage and authentication configured with mandatory TLS 1.2+ encryption (`ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true }`).
  - **MongoDB Atlas:** Scalable document store for contracts, case files, legal summaries, and chat history.
- **Advanced Query Engine (`APIFeatures`):**
  - **Filtering:** Exact matching and MongoDB comparison operators (`[gte]`, `[lte]`, `[gt]`, `[lt]`, `[in]`).
  - **Keyword Search:** Global case-insensitive regex search across titles and file names.
  - **Sorting:** Multi-field ascending/descending sorting (`?sort=-createdAt,fileSize`).
  - **Field Limiting:** Custom projection to optimize network payload (`?fields=originalName,status`).
  - **Pagination:** Standardized metadata (`total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`).
- **Optimized Document Streaming:** Base64 binary file data is excluded from default queries (`select: false`) and streamed on-demand via dedicated download endpoints.
- **Enterprise Security:** ReDoS-protected Multer file handling with 10MB limits, CORS configuration, and centralized error handling.

---

## 📂 Project Structure

```text
backend/node_backend/
├── Dockerfile                # Production Alpine Node.js 20 container
├── .dockerignore             # Docker build context exclusions
├── .env.example              # Environment variables template
├── package.json              # Backend dependencies and scripts
├── server.js                 # App entrypoint & DB initialization
└── src/
    ├── app.js                # Express app setup, middlewares, and route mounting
    ├── db/
    │   ├── mongodb.js        # MongoDB Atlas connection handler
    │   └── sqldb.js          # TiDB Cloud MySQL pool with explicit TLS 1.2+
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

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in `backend/node_backend/`:

```bash
cp .env.example .env
```

### Production `.env` Template
```env
# TiDB Cloud MySQL (Explicit TLS 1.2+)
MYSQL_URL=mysql://<user>:<password>@<host>:4000/users?ssl={"rejectUnauthorized":true}

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.vsfoj91.mongodb.net/legalData

# JWT Configuration
ACCESS_TOKEN_SECRET=your_super_secure_access_token_secret_key_2026
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_key_2026
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

PORT=5000
```

---

## 🚀 Running Locally

```bash
cd backend/node_backend
npm install
npm start
```
* API Server: `http://localhost:5000`
* Health Check: `http://localhost:5000/health`

---

## 🐳 Docker Deployment

The application includes an optimized, production-grade `Dockerfile`:

```bash
# Build Docker image
docker build -t legalsmiths-node .

# Run Docker container
docker run -p 5000:5000 --env-file .env legalsmiths-node
```
