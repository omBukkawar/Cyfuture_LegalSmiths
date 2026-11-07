const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth.routes.js");
const contractRoutes = require("./routes/contract.routes.js");
const caseRoutes = require("./routes/case.routes.js");
const summaryRoutes = require("./routes/summary.routes.js");
const chatRoutes = require("./routes/chat.routes.js");

const app = express();

// ── Rate Limiters ────────────────────────────────────────────
// Auth endpoints: 20 attempts per 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts. Please try again in 15 minutes." },
});

// AI proxy endpoints: 30 requests per 15 min per user
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: "Request limit reached. Please wait 15 minutes before trying again." },
});

// General API: 200 requests per 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

// ── Global Middleware ────────────────────────────────────────
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").map(o => o.trim()),
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(generalLimiter);

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/contracts", aiLimiter, contractRoutes);
app.use("/api/cases", aiLimiter, caseRoutes);
app.use("/api/summaries", generalLimiter, summaryRoutes);
app.use("/api/chats", generalLimiter, chatRoutes);

// ── Health check (tests DB connectivity) ────────────────────
app.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  // 0=disconnected 1=connected 2=connecting 3=disconnecting
  const mongoStatus = ["disconnected", "connected", "connecting", "disconnecting"][mongoState] || "unknown";
  const healthy = mongoState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    mongodb: mongoStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
