# ⚖️ LegalSmiths — Frontend

> **AI-powered Indian legal intelligence platform** — React 18 + Vite SPA delivering a Legal Assistant, Contract Analyzer, and Case Outcome Predictor in a unified, accessible interface.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Live Demo & Screenshots](#live-demo--screenshots)
3. [Tech Stack & Rationale](#tech-stack--rationale)
4. [Design System](#design-system)
5. [Pages & Features](#pages--features)
   - [Homepage](#homepage-)
   - [Register & Login](#register--login-)
   - [Services](#services-)
   - [Legal Assistant](#legal-assistant-)
   - [Contract Analyzer](#contract-analyzer-)
   - [Case Outcome Predictor](#case-outcome-predictor-)
   - [Contact](#contact-)
6. [Authentication Flow](#authentication-flow)
7. [File Structure](#file-structure)
8. [Environment Variables](#environment-variables)
9. [Local Development](#local-development)
10. [Building for Production](#building-for-production)
11. [Deployment](#deployment)
12. [Contributing](#contributing)

---

## Overview

**LegalSmiths** is a full-stack, AI-driven legal intelligence platform tailored for the Indian legal ecosystem. The frontend is a performant React 18 Single Page Application (SPA) built with Vite, exposing three core AI-powered tools:

| Tool | Description |
|------|-------------|
| **Legal Assistant** | Conversational AI chat with persistent session history for Indian law queries |
| **Contract Analyzer** | Upload or paste contracts to receive a structured risk audit with severity-coded red flags, missing protections, ambiguities, and actionable recommendations |
| **Case Outcome Predictor** | Provide case facts to receive an adversarial brief (claimant + defence) and a judicial verdict with win probability percentage |

All AI features are gated behind JWT authentication. Public-facing pages (Homepage, Register, Login, Contact) are freely accessible.

---

## Live Demo & Screenshots

> 🚀 **Live:** [https://legalsmiths.vercel.app](https://legalsmiths.vercel.app) *(update with production URL)*

| Page | Preview |
|------|---------|
| Homepage | *[Screenshot placeholder]* |
| Legal Assistant | *[Screenshot placeholder]* |
| Contract Analyzer | *[Screenshot placeholder]* |
| Case Predictor | *[Screenshot placeholder]* |

---

## Tech Stack & Rationale

| Technology | Version | Role | Why |
|---|---|---|---|
| **React** | 18 | UI framework | Hooks-based component model, concurrent features, wide ecosystem |
| **Vite** | Latest | Build tool & dev server | Sub-second HMR, ES module-native, dramatically faster than CRA/Webpack for development |
| **React Router** | v7 | Client-side routing | Declarative route definitions, nested routes, programmatic navigation, v7 future-flags |
| **Axios** | Latest | HTTP client | Interceptor support for auth headers, clean promise API, consistent error handling |
| **Custom CSS** | — | Styling | Zero-dependency approach; Poppins font, CSS custom properties, module-scoped stylesheets — no Tailwind or MUI overhead |
| **ESLint** | Latest | Code quality | `react-hooks` plugin enforces Rules of Hooks; `react-refresh` ensures HMR compatibility |

### Why Vite over CRA?

Vite leverages native ES modules in development — only the files the browser actually requests are transformed, giving instant startup regardless of project size. Production builds use Rollup under the hood for optimal tree-shaking and chunk splitting.

---

## Design System

LegalSmiths uses a bespoke design language with no utility-class framework dependency.

### Typography

| Token | Value |
|---|---|
| Font family | `'Poppins', sans-serif` (self-hosted, all weights) |
| Base size | `16px` |

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Sidebar background | `#727374` | Left sidebar in Legal Assistant & Contract Analyzer |
| CTA / Primary action | `#3437C2` | Buttons, links, interactive highlights |
| Card background | `#ffffff` | Main content area cards |
| Risk — Critical | `#dc2626` | Contract red flags: Critical severity |
| Risk — High | `#f59e0b` | Contract red flags: High severity |
| Risk — Medium | `#eab308` | Contract red flags: Medium severity |
| Risk — Low | `#22c55e` | Contract red flags: Low severity |

### Layout Patterns

- **2-column layout** (`sidebar + main`): Used in Legal Assistant and Contract Analyzer for consistent spatial organization.
- **Uniform sidebar**: `#727374` background across all protected pages for visual consistency.
- **Card-based content**: White cards on a light background for content sections.

### CSS Architecture

- Global resets and variables in `src/index.css` and `src/App.css`
- Page-level stylesheets in `src/styles/` (e.g., `contractAnalyzer.css`, `legalAssistant.css`)
- CSS custom properties (`--var`) for theming tokens

---

## Pages & Features

### Homepage `/`

**Access:** Public

The entry point to the platform. Features:

- **Hero section** — Headline, sub-headline, and primary CTA directing visitors to register or explore features.
- **Feature cards** — Visual overview of Legal Assistant, Contract Analyzer, and Case Predictor with iconography and brief descriptions.
- **Call to action** — Secondary CTA prompting sign-up or login.

---

### Register & Login `/register` `/login`

**Access:** Public

Standard authentication pages:

- **Register** — Email + password form. On success, stores `accessToken` and `refreshToken` in `localStorage` and redirects to the dashboard/services page.
- **Login** — Email + password JWT authentication. Same token storage behaviour as register.
- Both pages redirect authenticated users away to prevent re-auth.

---

### Services `/services`

**Access:** 🔒 Protected

An authenticated landing/hub page that presents all available AI-powered services with navigation cards linking to each tool.

---

### Legal Assistant `/legalAssistant`

**Access:** 🔒 Protected

A full-featured conversational AI chat interface for Indian legal queries.

#### Layout

```
┌─────────────────┬────────────────────────────────┐
│   Session       │                                │
│   Sidebar       │        Chat Area               │
│                 │                                │
│  [New Chat]     │  ┌──────────────────────────┐  │
│                 │  │  User message bubble     │  │
│  Past Session 1 │  └──────────────────────────┘  │
│  Past Session 2 │  ┌──────────────────────────┐  │
│  Past Session 3 │  │  AI response (formatted) │  │
│  ...            │  └──────────────────────────┘  │
│                 │  [────────── Input ──────────]  │
└─────────────────┴────────────────────────────────┘
```

#### Key Features

- **Session sidebar** — Lists all past sessions retrieved from MongoDB. Each entry supports:
  - **Load** — Restores the full message history for that session into the chat area.
  - **Delete** — Permanently removes the session from the database.
  - **New Chat** — Clears the current view and starts a fresh session.
- **Chat area** — Renders message bubbles with distinct styles for user vs. AI messages. AI responses support markdown-style formatting: section headers, bullet points, bold text.
- **Auto-scroll** — Automatically scrolls the chat window to the latest message after every AI response.
- **Submit on Enter** — Keyboard-friendly input (Shift+Enter for newlines).
- **Session persistence** — Each conversation is saved to MongoDB via the Node.js backend, keyed by user ID.

---

### Contract Analyzer `/contractAnalyzer`

**Access:** 🔒 Protected

The most feature-rich page on the platform — a comprehensive contract risk audit tool.

#### Layout

```
┌─────────────────┬────────────────────────────────┐
│   Contract      │                                │
│   Vault         │      Analysis Workspace        │
│   Sidebar       │                                │
│                 │  [Upload / Paste Toggle]        │
│  [+ New Audit]  │                                │
│                 │  ┌──────────────────────────┐  │
│  Contract 1     │  │  Drag & Drop / Paste     │  │
│  Contract 2     │  └──────────────────────────┘  │
│  Contract 3     │                                │
│  ...            │  [Analyze] button              │
│                 │                                │
│                 │  ┌── Tab Bar ───────────────┐  │
│                 │  │ Red Flags | Missing | ... │  │
│                 │  └──────────────────────────┘  │
│                 │                                │
│                 │  [Analysis Results]            │
└─────────────────┴────────────────────────────────┘
```

#### Input Modes

| Mode | Description |
|------|-------------|
| **File Upload** | Drag-and-drop or browse for `.pdf`, `.docx`, `.txt` files. Auto-clears previous analysis when a new file is selected. |
| **Text Paste** | Paste raw contract text directly into a textarea for instant analysis. |

#### Analysis Tabs

| Tab | Content |
|-----|---------|
| **Red Flags** | Severity-coded risk cards (see below) |
| **Missing Protections** | Clauses or provisions absent from the contract that industry standards recommend |
| **Key Terms** | Extracted important defined terms, dates, obligations, and parties |
| **Ambiguities** | Vague or legally unclear language that could lead to disputes |
| **Recommendations** | Actionable legal suggestions to strengthen the contract |

#### Red Flag Severity Cards

Each flagged risk is rendered as a card colour-coded by severity:

| Severity | Colour | Hex |
|----------|--------|-----|
| Critical | 🔴 Red | `#dc2626` |
| High | 🟠 Amber | `#f59e0b` |
| Medium | 🟡 Yellow | `#eab308` |
| Low | 🟢 Green | `#22c55e` |

Each card includes:
- **Evidence quote block** — Verbatim clause text from the contract
- **Clause reference** — Section/clause identifier
- **Legal impact** — Plain-English explanation of the legal risk
- **Recommendation** — Suggested fix or alternative wording

#### Risk Rubric Matrix

A 4-quadrant visual display assessing the contract across four dimensions:

| Quadrant | Description |
|----------|-------------|
| **Financial Exposure** | Monetary risk and liability exposure |
| **Dispute Probability** | Likelihood of contractual disputes |
| **Clause Symmetry** | Balance of obligations between parties |
| **Cross-Clause Interaction** | Conflicts or dependencies between clauses |

#### Export Options

| Export | Behaviour |
|--------|-----------|
| **PDF Export** | Opens the browser print dialog with a structured HTML legal memorandum. Sections: Executive Summary → Red Flags → Missing Protections → Ambiguities → Recommendations → Operational Clauses table |
| **JSON Export** | Downloads the raw analysis JSON for integration with other systems |

#### Contract Vault

Past analyses are saved to MongoDB (keyed by user). The sidebar vault allows:
- **Load** — Restore a previous analysis into the workspace
- **Delete** — Remove from the vault

---

### Case Outcome Predictor `/casePrediction`

**Access:** 🔒 Protected

An adversarial AI pipeline that simulates both sides of a legal case and delivers a judicial verdict.

#### Input Form

| Field | Description |
|-------|-------------|
| Case Facts | Narrative description of the case |
| Parties | Claimant and defendant details |
| Legal Domain | Area of law (e.g., Contract Law, Family Law, Property Law) |

#### Output

| Section | Description |
|---------|-------------|
| **Claimant's Brief** | AI-generated legal argument from the claimant's perspective |
| **Defence Brief** | AI-generated counter-arguments from the defendant's perspective |
| **Judicial Verdict** | Simulated judgment with win probability percentage and reasoning |

> ⚠️ **Note:** The adversarial pipeline typically takes **60–120 seconds** to complete. Animated loading states keep the user informed throughout.

---

### Contact `/contact`

**Access:** Public

Standard contact form or information page for enquiries and support.

---

## Authentication Flow

```
                    ┌──────────┐
                    │ Register │
                    │  /Login  │
                    └────┬─────┘
                         │  POST /auth/register OR /auth/login
                         ▼
                   Node.js Backend
                         │
              ┌──────────┴──────────┐
              │                     │
        accessToken (15m)   refreshToken (7d)
              │                     │
              └──────────┬──────────┘
                         │  Stored in localStorage
                         ▼
              ┌──────────────────────┐
              │  getAuthHeaders()    │  — injects Authorization: Bearer <token>
              │  in api.js config    │  — adds x-user-id header
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   ProtectedRoute     │  — checks token presence
              │   HOC                │  — redirects to /login if absent
              └──────────────────────┘
                         │
                         ▼
              Protected Pages
         (/services, /legalAssistant,
          /contractAnalyzer, /casePrediction)
```

| Token | Expiry | Storage |
|-------|--------|---------|
| `accessToken` | 15 minutes | `localStorage` |
| `refreshToken` | 7 days | `localStorage` |

**Key utilities:**

- **`src/config/api.js`** — Exports `AI_API_URL`, `NODE_API_URL`, and `getAuthHeaders()` for use across all API calls.
- **`src/utils/auth.js`** — Exports `getUser()`, `logout()`, and token helper functions.
- **`src/components/ProtectedRoute.jsx`** — HOC that wraps protected routes; reads token from localStorage and redirects unauthenticated users to `/login`.

---

## File Structure

```
frontend/
├── index.html                     # Vite HTML entrypoint
├── vite.config.js                 # Vite configuration
├── package.json                   # Dependencies & scripts
├── eslint.config.js               # ESLint rules (react-hooks, react-refresh)
├── vercel.json                    # SPA rewrite rule for client-side routing
├── .env                           # Local environment variables (gitignored)
├── .env.example                   # Environment variable template
└── src/
    ├── main.jsx                   # React DOM root; wraps app in BrowserRouter
    ├── App.jsx                    # Route definitions; ProtectedRoute applied to guarded routes
    ├── App.css                    # Global app-level styles
    ├── index.css                  # CSS reset, font imports, custom properties
    │
    ├── config/
    │   └── api.js                 # AI_API_URL, NODE_API_URL, getAuthHeaders()
    │
    ├── utils/
    │   └── auth.js                # getUser(), logout(), token helpers
    │
    ├── components/
    │   └── ProtectedRoute.jsx     # Auth guard HOC — redirects to /login if unauthenticated
    │
    ├── pages/
    │   ├── homepage.jsx           # /  — Hero, feature cards, CTA
    │   ├── register.jsx           # /register — Email/password signup
    │   ├── login.jsx              # /login — JWT login
    │   ├── services.jsx           # /services — Protected service hub
    │   ├── legalAssistant.jsx     # /legalAssistant — Chat + session sidebar
    │   ├── contractAnalyzer.jsx   # /contractAnalyzer — Full contract audit tool
    │   ├── casePrediction.jsx     # /casePrediction — Adversarial case predictor
    │   └── contact.jsx            # /contact — Contact page
    │
    └── styles/
        ├── homepage.css
        ├── legalAssistant.css
        ├── contractAnalyzer.css
        ├── casePrediction.css
        └── ...                    # Additional page-scoped stylesheets
```

---

## Environment Variables

Create a `.env` file in the `frontend/` directory (copy from `.env.example`):

```env
VITE_NODE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

| Variable | Description | Local Value | Production Value |
|---|---|---|---|
| `VITE_NODE_API_URL` | Base URL for the Node.js REST API (auth, sessions, vault) | `http://localhost:5000` | `https://legalsmiths-node.onrender.com` |
| `VITE_AI_API_URL` | Base URL for the Python AI API (chat, analysis, prediction) | `http://localhost:8000` | `https://legalsmiths-ai.onrender.com` |

> **Note:** All Vite environment variables **must** be prefixed with `VITE_` to be exposed to the browser bundle. Never store secrets in frontend env files.

---

## Local Development

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18.x or higher |
| npm | 9.x or higher |
| Git | Any recent version |

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/legalsmiths.git
cd legalsmiths/frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env to point to your local backend URLs

# 4. Start the Vite development server
npm run dev
```

The dev server starts at **http://localhost:5173** with Hot Module Replacement (HMR) enabled.

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development server | `npm run dev` | Starts Vite HMR dev server on port 5173 |
| Production build | `npm run build` | Compiles & bundles to `dist/` |
| Preview build | `npm run preview` | Serves the production `dist/` locally for testing |
| Lint | `npm run lint` | Runs ESLint across all source files |

---

## Building for Production

```bash
# Generate optimised production bundle
npm run build

# Output directory: frontend/dist/
# Vite performs:
#   - Tree-shaking (removes unused exports)
#   - Code splitting (vendor / page chunks)
#   - Asset fingerprinting for cache busting
#   - Minification (esbuild)

# Optionally preview the build before deploying
npm run preview
```

The `dist/` directory is the deployment artifact. It contains a single `index.html` with hashed asset filenames.

---

## Deployment

### Vercel (Recommended)

The repository includes a [`vercel.json`](./vercel.json) with an SPA rewrite rule that redirects all unknown paths to `index.html`, enabling React Router to handle client-side navigation correctly.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Steps:**

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Set **Framework Preset** to `Vite`.
3. Set **Root Directory** to `frontend`.
4. Add environment variables (`VITE_NODE_API_URL`, `VITE_AI_API_URL`) in Project Settings → Environment Variables.
5. Deploy. Auto-deploys trigger on every push to `main`.

### Render (Static Site)

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |
| **Root Directory** | `frontend` |

Add the same environment variables in the Render dashboard under Environment.

> **SPA routing on Render:** Add a redirect rule — Source: `/*`, Destination: `/index.html`, HTTP Status: `200` — to handle client-side routes on page refresh.

### Manual / Other Hosts

Upload the contents of `dist/` to any static hosting service (S3 + CloudFront, GitHub Pages, Netlify, etc.). Ensure your host is configured to serve `index.html` for all routes (SPA fallback).

---

## Contributing

Contributions are welcome! Please follow these guidelines to keep the codebase consistent.

### Branch Strategy

```
main          ← production-ready code, protected
dev           ← integration branch for features
feature/*     ← individual feature branches
fix/*         ← bug fix branches
```

### Development Workflow

```bash
# 1. Fork the repo and create a feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and verify linting passes
npm run lint

# 3. Test your changes in both dev and production build modes
npm run dev
npm run build && npm run preview

# 4. Commit using Conventional Commits
git commit -m "feat(contractAnalyzer): add clause severity filter"

# 5. Push and open a Pull Request against `dev`
git push origin feature/your-feature-name
```

### Conventional Commit Types

| Prefix | Usage |
|--------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `style` | CSS/visual-only changes |
| `refactor` | Code restructuring without behaviour change |
| `docs` | Documentation updates |
| `chore` | Build/tooling/config changes |

### Code Style

- **Components** — Functional components with hooks only; no class components.
- **File naming** — `camelCase.jsx` for pages and components (matches existing convention).
- **CSS** — Add page-scoped stylesheets in `src/styles/`; use CSS custom properties for colour tokens rather than hardcoded hex values.
- **API calls** — Always use `getAuthHeaders()` from `src/config/api.js` for authenticated requests.
- **No external UI libraries** — Maintain the custom-CSS-only design system; do not introduce Tailwind, MUI, or similar.

### Pull Request Checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully
- [ ] New routes are added to `App.jsx` with correct `ProtectedRoute` wrapping
- [ ] Environment variable usage follows the `VITE_` prefix convention
- [ ] No `console.log` statements left in production code
- [ ] PR description explains the change and links any relevant issue

---

## License

This project is proprietary software developed for Cyfuture / LegalSmiths. All rights reserved.

---

<div align="center">
  <strong>Built with ⚖️ for the Indian legal ecosystem</strong><br/>
  React 18 · Vite · React Router v7 · Custom CSS · Poppins
</div>
