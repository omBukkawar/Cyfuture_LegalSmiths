const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes.js");
const contractRoutes = require("./routes/contract.routes.js");
const caseRoutes = require("./routes/case.routes.js");
const summaryRoutes = require("./routes/summary.routes.js");
const chatRoutes = require("./routes/chat.routes.js");

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// --- Root Routes (Ensures 100% backward compatibility with existing frontend) ---
app.use("/", authRoutes);
app.use("/", contractRoutes);
app.use("/", caseRoutes);
app.use("/", summaryRoutes);
app.use("/", chatRoutes);

// --- Namespaced API Routes (Best practice for modern REST architecture) ---
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/chats", chatRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
