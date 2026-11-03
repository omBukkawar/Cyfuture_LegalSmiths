# LegalSmiths — Frontend (Vite & React)

The modern, responsive web application for **LegalSmiths**, built with **React 18, Vite, and React Router**.

---

## 🌐 Live Production Deployment

The frontend is deployed globally as a **Render Static Site**:
* **Live URL:** [https://legalsmiths.onrender.com](https://legalsmiths.onrender.com)
* **Hosting:** Render Static Site (Global Edge CDN)
* **Single Page Application (SPA) Routing:** Rewrites `/*` to `/index.html` (HTTP 200) to ensure zero 404 errors on browser page reloads.
* **CI/CD:** Automated linting, Vite building, and deployment triggered on git push via GitHub Actions.

---

## 🌟 Key Features

* **AI Legal Assistant:** Interactive chat interface with preset Indian legal query suggestions, real-time message auto-scrolling, statutory citation highlights, and conversation persistence.
* **Smart Contract Analyzer:** Multi-format document upload (`.pdf`, `.docx`, `.txt`) supporting operational clause breakdown, liability auditing, risk level scoring (`Low`/`Medium`/`High`), and actionable amendment recommendations.
* **Case Outcome Predictor:** Structured court-style advisory interface displaying predicted win probabilities, legal precedents, and procedural strategies.
* **Modern Auth Flow:** Secure JWT token storage (`accessToken` & `refreshToken`), password show/hide visibility toggle, "Remember Me" email persistence, and protected routes (`ProtectedRoute`).
* **Dynamic Navigation:** Responsive navigation bar that auto-switches between "Login/Register" and "Dashboard/Logout" based on real-time user authentication state.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the `frontend/` directory:

```bash
cp .env.example .env
```

### Development Configuration
```env
VITE_NODE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

### Production Configuration (Render)
```env
VITE_NODE_API_URL=https://legalsmiths-node.onrender.com
VITE_AI_API_URL=https://legalsmiths-ai.onrender.com
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will be accessible at: [http://localhost:5173](http://localhost:5173)

### 3. Production Build & Linting
```bash
# Check code quality with ESLint (0 errors)
npx eslint src

# Create production build
npm run build
```
The optimized production bundle will be generated in `dist/`.

---

## 🚢 Render Static Site Settings Reference

| Setting | Value |
|---|---|
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Rewrite Rule** | `/*` ➔ `/index.html` (Rewrite / 200) |
