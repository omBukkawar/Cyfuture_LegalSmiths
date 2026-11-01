# LegalSmiths — Frontend (Vite & React)

The modern, responsive web application for **LegalSmiths**, built with **React, Vite, and React Router**.

---

## 🌟 Features

* **AI Legal Assistant:** Interactive chat interface with preset Indian legal query suggestions, real-time message auto-scrolling, and citation formatting.
* **Smart Contract Analyzer:** Drag-and-drop document upload (`.pdf`, `.docx`, `.txt`) supporting operational clause breakdown, liability auditing, and actionable amendment recommendations.
* **Case Outcome Predictor:** Structured court-style advisory interface displaying predicted win probabilities, legal precedents, and strategy suggestions.
* **Modern Auth Flow:** Secure JWT token storage (`accessToken` & `refreshToken`), password show/hide visibility toggle, "Remember Me" email persistence, and protected routes (`ProtectedRoute`).

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the `frontend/` directory:

```bash
cp .env.example .env
```

Set the backend API endpoints:
```env
VITE_NODE_API_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
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

The application will be accessible at:
* **Local:** [http://localhost:5173](http://localhost:5173)

### 3. Production Build & Linting
```bash
# Check code quality with ESLint
npx eslint src

# Create production build
npm run build
```
The optimized production bundle will be generated in `dist/`.

