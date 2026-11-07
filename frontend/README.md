# LegalSmiths — Frontend

> **AI-Powered Indian Legal Intelligence Platform** — High-performance React 18 + Vite SPA delivering a Legal Assistant, Contract Risk Auditor, and Adversarial Case Outcome Predictor with zero-framework custom CSS and Poppins typography.

---

## Table of Contents

1. [Overview](#overview)
2. [Live Application](#live-application)
3. [Direct AI Microservice Routing](#direct-ai-microservice-routing)
4. [Tech Stack & Rationale](#tech-stack--rationale)
5. [Design System](#design-system)
6. [Pages & Features](#pages--features)
   - [1. Homepage](#1-homepage)
   - [2. Authentication (Login & Register)](#2-authentication-login--register)
   - [3. Services Hub](#3-services-hub)
   - [4. Legal Assistant](#4-legal-assistant)
   - [5. Contract Analyzer](#5-contract-analyzer)
   - [6. Case Outcome Predictor](#6-case-outcome-predictor)
   - [7. Contact](#7-contact)
7. [Authentication Architecture](#authentication-architecture)
8. [File Structure](#file-structure)
9. [Environment Variables](#environment-variables)
10. [Local Development](#local-development)
11. [Production Build & Optimization](#production-build--optimization)
12. [Deployment (Render)](#deployment-render)
13. [Contributing](#contributing)
14. [License](#license)

---

## Overview

**LegalSmiths** is a full-stack, AI-driven legal intelligence platform engineered specifically for the Indian legal ecosystem. The frontend is a single-page application built on React 18 and Vite.

### Core Capabilities
- **Legal Assistant (`/legalAssistant`)**: Interactive conversational AI for Indian statutory queries, court procedures, and legal research with persistent session history.
- **Contract Analyzer (`/contractAnalyzer`)**: Complete commercial contract risk auditing supporting PDF/DOCX/TXT upload or direct text paste. Features a 5-tab analysis dashboard, 4-quadrant Risk Rubric, verbatim evidence quoting, and formatted PDF memorandum export.
- **Case Outcome Predictor (`/casePrediction`)**: Adversarial simulation pitting claimant legal briefs against defence statements before an impartial judicial evaluator to project outcome likelihood and strategic action steps.

---

## Live Application

- **Production URL**: [https://legalsmiths.onrender.com](https://legalsmiths.onrender.com)
- **Node Backend Gateway**: [https://legalsmiths-node.onrender.com](https://legalsmiths-node.onrender.com)
- **Python AI Microservice Docs**: [https://legalsmiths-ai.onrender.com/docs](https://legalsmiths-ai.onrender.com/docs)

---

## Direct AI Microservice Routing

The frontend architecture uses a **dual-backend model**:

```
                              REACT FRONTEND
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     Node.js Express Backend   │               │     Python FastAPI AI Backend │
│        (VITE_NODE_API_URL)    │               │        (VITE_AI_API_URL)      │
├───────────────────────────────┤               ├───────────────────────────────┤
│ • User Registration & Login   │               │ • Legal Assistant Synthesis   │
│ • JWT Cookie Management       │               │ • Contract Risk Audit Pipeline│
│ • Chat Session Persistence    │               │ • Adversarial Case Outcome    │
│ • Contract Vault Storage      │               │   Prediction Pipeline         │
│ • Case Prediction History     │               │ • Live Google Search (Serper) │
└───────────────────────────────┘               └───────────────────────────────┘
```

- **Inference calls**: Sent **directly** from the browser to `VITE_AI_API_URL` (`POST /legalassistant`, `POST /contractanalyzer`, `POST /caseoutcomeprediction`). Node.js does not proxy these heavy AI workflows.
- **Persistence calls**: Sent to `VITE_NODE_API_URL` (`/api/auth/*`, `/api/chats/*`, `/api/contracts/*`, `/api/cases/*`, `/api/summaries/*`) to store, list, and delete user-owned records.

---

## Tech Stack & Rationale

| Technology | Version | Role | Why Chosen |
|---|---|---|---|
| **React** | `18.2.0` | UI Library | Component-driven architecture, concurrent rendering, and hook-based local state management. |
| **Vite** | `^7.1.2` | Build Tool & Dev Server | Lightning-fast Hot Module Replacement (HMR) using native browser ES modules, drastically reducing dev startup times compared to Webpack/CRA. |
| **React Router** | `^7.18.5` | Client-Side Routing | Declarative nested routing, clean programmatic navigation, and route protection HOC patterns. |
| **Axios** | `^1.6.7` | HTTP Client | Request/response interceptors, automated CSRF cookie transmission (`withCredentials`), and uniform error handling. |
| **Custom CSS** | Pure CSS | Design & Styling | Zero runtime overhead; full aesthetic freedom without the bundle weight, style collisions, or configuration bloat of Tailwind or MUI. |
| **ESLint** | `^10.14.0` | Code Quality | Enforces modern React hooks safety (`eslint-plugin-react-hooks`) and strict variable usage in CI/CD pipelines. |

---

## Design System

LegalSmiths adheres to a clean, authoritative legal design language optimized for readability and accessibility.

### Typography
- **Primary Typeface**: `Poppins`, sans-serif (all weights self-hosted locally in `src/assets/Poppins/`)
- **Body Size**: `16px` base, line-height `1.6`
- **Headings**: Semibold & Bold (`600`, `700`)

### Brand & Interface Palette

| Color Token | Hex Code | Application |
|---|---|---|
| **Sidebar Neutral** | `#727374` | Left persistent navigation sidebar on Legal Assistant & Contract Analyzer |
| **Primary Brand CTA** | `#3437C2` | Primary action buttons, tabs, interactive accents, focus rings |
| **Workspace Card** | `#FFFFFF` | Container cards, analysis modules, document viewer backgrounds |
| **Canvas Background** | `#F8FAFC` | Page body background |
| **Text Primary** | `#0F172A` | Main body text and high-contrast headings |
| **Text Muted** | `#64748B` | Subheadings, metadata, section references, clause numbers |

### Risk Severity Colors

| Severity Level | Hex Code | Badge / Card Border Style |
|---|---|---|
| **Critical** | `#DC2626` | Red border, `#FEE2E2` background tint |
| **High** | `#F59E0B` | Amber border, `#FEF3C7` background tint |
| **Medium** | `#EAB308` | Yellow border, `#FEFCE8` background tint |
| **Low** | `#22C55E` | Green border, `#F0FDF4` background tint |

---

## Pages & Features

### 1. Homepage (`/`)
- **Access**: Public
- **Features**: Hero presentation, value propositions, interactive feature preview cards for the 3 core tools, and quick authentication triggers.

### 2. Authentication (`/login` & `/register`)
- **Access**: Public (auto-redirects if already authenticated)
- **Features**: Clean login and signup forms with real-time error handling. Sets `httpOnly` session cookies and persists local fallback tokens via `auth.js`.

### 3. Services Hub (`/services`)
- **Access**: Protected
- **Features**: Central navigation dashboard routing verified users to Legal Assistant, Contract Analyzer, or Case Predictor.

---

### 4. Legal Assistant (`/legalAssistant`)
- **Access**: Protected
- **Layout**: 2-Column Responsive Workspace (Sidebar + Chat Area)

```
+---------------------------+--------------------------------------------------------+
|     SESSION SIDEBAR       |                     CHAT WORKSPACE                     |
|                           |                                                        |
|  [+ New Legal Chat]       |  +--------------------------------------------------+  |
|                           |  |  User Query: Anticipatory bail under CrPC 438    |  |
|  Past Conversations:      |  +--------------------------------------------------+  |
|  - Property Dispute 2024  |  +--------------------------------------------------+  |
|  - Cheque Bounce Case     |  |  LegalSmiths AI: Statutory Analysis & Citations  |  |
|  - Employment Agreement   |  +--------------------------------------------------+  |
|                           |                                                        |
|  (Load or Delete sessions)|  [ Type your legal question...             ] [ Send ]  |
+---------------------------+--------------------------------------------------------+
```

#### Features:
- **Session Sidebar**: Fetches user history from MongoDB. Click to load past conversations or permanently delete old threads.
- **Markdown & Legal Formatting**: Renders statutory citations, court cases, bullet points, and section references cleanly.
- **Auto-Scroll & Keyboard Shortcuts**: Auto-scrolls on new answers; supports `Enter` to submit and `Shift + Enter` for multi-line inputs.

---

### 5. Contract Analyzer (`/contractAnalyzer`)
- **Access**: Protected
- **Layout**: 2-Column Workspace with Contract Vault Sidebar

```
+---------------------------+--------------------------------------------------------+
|      CONTRACT VAULT       |                   AUDIT WORKSPACE                      |
|                           |                                                        |
|  [+ New Contract Audit]   |  [ Upload File (PDF/DOCX/TXT) ]  or  [ Paste Text ]    |
|                           |                                                        |
|  Saved Audits:            |  +--------------------------------------------------+  |
|  - Master Service Agrmt   |  | Drag & drop agreement or paste clauses here...   |  |
|  - NDA Vendor 2024        |  +--------------------------------------------------+  |
|  - Software License       |  [ Run AI Audit ]                                      |
|                           |                                                        |
|                           |  [ Red Flags (3) ] [ Missing Protections ] [ Key Terms ]|
|                           |  +--------------------------------------------------+  |
|                           |  | #1 Uncapped Indemnification (Section 13)         |  |
|                           |  |    Evidence: "Neither party's liability..."      |  |
|                           |  |    Impact: Uncapped financial exposure           |  |
|                           |  |    Recommendation: Insert aggregate super-cap    |  |
|                           |  +--------------------------------------------------+  |
|                           |  [ Download PDF Report ]   [ Export JSON ]              |
+---------------------------+--------------------------------------------------------+
```

#### Key Capabilities:
- **Dual Input Modes**: Upload contracts (`.pdf`, `.docx`, `.doc`, `.txt` up to 20MB) or paste raw text.
- **Automatic Output Reset**: Selecting a new file or switching modes automatically clears stale results.
- **5-Tab Analysis Dashboard**:
  1. **Red Flags**: Severity-coded cards with exact verbatim evidence quotes from the contract, identified clause numbers, legal impact, and suggested negotiation amendments.
  2. **Missing Protections**: Standard protective clauses absent from the agreement (e.g. mutual indemnity, audit rights).
  3. **Key Terms**: Operational clauses (Parties, Effective Dates, Payment Terms, Termination Triggers, Key Obligations).
  4. **Drafting Ambiguities**: Vague wording, subjective metrics, or contradictory provisions.
  5. **Recommendations**: Prioritized, actionable roadmap for legal counsel before contract execution.
- **4-Quadrant Risk Rubric**: Visual assessment across Financial Exposure, Dispute Probability, Clause Symmetry, and Cross-Clause Interactions.
- **Professional PDF Export**: Generates a clean, multi-section legal memorandum print window without raw JSON formatting.
- **Contract Vault**: Past audits are automatically persisted in MongoDB, allowing counsel to reload or delete prior reviews.

---

### 6. Case Outcome Predictor (`/casePrediction`)
- **Access**: Protected
- **Features**: Input case facts, jurisdiction, and legal domains to trigger the LangGraph adversarial simulation. Displays Claimant Legal Brief, Defence Written Statement, and the Judicial Verdict Scorecard with calculated win probability.

### 7. Contact (`/contact`)
- **Access**: Public
- **Features**: Direct support and inquiry form.

---

## Authentication Architecture

LegalSmiths employs an enterprise dual-token model:

```
               User Submits Credentials (/login or /register)
                                    │
                                    ▼
                          Node.js Backend Authenticates
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
   httpOnly Cookie (Primary)                    Response JSON Body (Fallback)
   • accessToken (15 min)                      • accessToken
   • refreshToken (7 d, /api/auth)             • refreshToken
            │                                               │
            └───────────────────────┬───────────────────────┘
                                    │
                                    ▼
     Browser sends cookies automatically + getAuthHeaders() injects Bearer header
                                    │
                                    ▼
         ProtectedRoute.jsx validates active token before rendering routes
```

---

## File Structure

```
frontend/
├── .env.example                       # Reference environment variables
├── eslint.config.js                   # ESLint flat configuration for React Hooks & Refresh
├── index.html                         # Vite HTML template with Poppins font preloads
├── package-lock.json                  # Pinned frontend dependency tree
├── package.json                       # Frontend dependencies and npm scripts
├── README.md                          # Frontend documentation
├── vite.config.js                     # Vite build configuration with React plugin
│
└── src/
    ├── App.css                        # App-level styling
    ├── App.jsx                        # Route definitions and ProtectedRoute wrapping
    ├── index.css                      # Global resets, root design tokens, typography
    ├── main.jsx                       # Application entry point; mounts BrowserRouter
    │
    ├── assets/                        # Local images, SVG icons, and font archives
    │   ├── ChatGPT_Clone_assets.zip   # Legacy design asset archive
    │   ├── Poppins.zip                # Backup font archive
    │   ├── Poppins/                   # Extracted Poppins font files (Black, Bold, Regular, etc.)
    │   └── ...                        # Backgrounds, service images, and icons
    │
    ├── components/
    │   ├── Footer.jsx                 # Global footer component
    │   └── ProtectedRoute.jsx         # Guard component redirecting unauthenticated users to /login
    │
    ├── config/
    │   └── api.js                     # Base API endpoints (AI_API_URL, NODE_API_URL) & getAuthHeaders()
    │
    ├── pages/
    │   ├── casePrediction.jsx         # Adversarial case outcome simulation view
    │   ├── contact.jsx                # Contact and support form
    │   ├── contractAnalyzer.jsx       # Complete contract risk audit dashboard & vault
    │   ├── homepage.jsx               # Landing page with feature showcases
    │   ├── legalAssistant.jsx         # Chat assistant with conversation history
    │   ├── login.jsx                  # User login page
    │   ├── register.jsx               # New user signup page
    │   └── services.jsx               # Service selection hub
    │
    ├── styles/
    │   ├── auth.css                   # Authentication form styling (login & register)
    │   ├── casePrediction.css         # Case prediction styling
    │   ├── contact.css                # Contact form styling
    │   ├── contractAnalyzer.css       # Complete contract audit & vault styling
    │   ├── homepage.css               # Landing page styling
    │   ├── legalAssistant.module.css  # Assistant chat interface styling (modular CSS)
    │   └── services.css               # Hub styling
    │
    └── utils/
        └── auth.js                    # Auth token helpers (getUser, logout, token extraction)
```

---

## Environment Variables

Create `.env` in the `frontend/` directory (see `.env.example`):

```env
# Node.js Express Backend URL
VITE_NODE_API_URL=http://localhost:5000

# Python FastAPI AI Backend URL
VITE_AI_API_URL=http://localhost:8000
```

### Production Values (Render)
```env
VITE_NODE_API_URL=https://legalsmiths-node.onrender.com
VITE_AI_API_URL=https://legalsmiths-ai.onrender.com
```

> **Note**: All Vite environment variables must begin with the `VITE_` prefix to be embedded in client-side bundles during build time. Never store private API secrets in frontend env files.

---

## Local Development

### Prerequisites
- Node.js `18.x` or higher
- npm or pnpm

### Setup Steps

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Verify VITE_NODE_API_URL and VITE_AI_API_URL point to local backend instances

# 4. Start Vite development server with HMR
npm run dev

# Application will be accessible at: http://localhost:5173
```

---

## Production Build & Optimization

To compile the production distribution bundle:

```bash
npm run build
```

Vite outputs production assets into `frontend/dist/`:
- **Tree-Shaking**: Strips unused dependencies.
- **Chunk Splitting**: Splits third-party vendor code from application logic for optimal browser caching.
- **Asset Fingerprinting**: Hashes filenames (`index-[hash].js`, `index-[hash].css`) to ensure automatic cache busting on updates.

To preview the production bundle locally:
```bash
npm run preview
```

---

## Deployment (Render)

The frontend is deployed as a **Render Static Site**:
- **Runtime**: `Static Site`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule**: In Render dashboard -> Redirects/Rewrites:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`
  This ensures client-side React Router navigation resolves correctly upon browser page refreshes.

Automated deployments are triggered via GitHub Actions (`.github/workflows/ci.yml`) using the `RENDER_DEPLOY_HOOK_FRONTEND` webhook secret.

---

## Contributing

1. Fork the repository and create your feature branch: `git checkout -b feature/ui-improvement`
2. Ensure ESLint passes cleanly: `npm run lint`
3. Verify production build succeeds: `npm run build`
4. Submit a Pull Request describing your changes.

---

## License

MIT License — Copyright (c) 2026 LegalSmiths.
