const express = require("express");
const router = express.Router();

const {
  uploadContract,
  getContracts,
  getContractById,
  updateContract,
  saveContractAnalysis,
  saveCompleteAudit,
  deleteContract,
  downloadContract,
} = require("../controllers/contract.controller.js");
const upload = require("../middlewares/upload.middleware.js");

// Aliasing Middleware: Top 5 High-Risk Contracts
function aliasHighRiskContracts(req, res, next) {
  req.query["analysis.risk_level"] = "High";
  req.query.sort = "-createdAt";
  req.query.limit = "5";
  next();
}

// Aliasing Middleware: 5 Most Recent Contracts
function aliasRecentContracts(req, res, next) {
  req.query.sort = "-createdAt";
  req.query.limit = "5";
  next();
}

// Aliased Routes
router.get("/contracts/high-risk", aliasHighRiskContracts, getContracts);
router.get("/contracts/recent", aliasRecentContracts, getContracts);

// Create (File Upload or Text)
router.post("/upload-contract", upload.single("file"), uploadContract);
router.post("/contracts", upload.single("file"), uploadContract);

// Save complete audit report (analysis + contract text)
router.post("/contracts/save-audit", saveCompleteAudit);

// Read All (with filtering, sorting, field limiting, search & pagination)
router.get("/contracts", getContracts);

// Read One
router.get("/contracts/:id", getContractById);

// Update
router.patch("/contracts/:id", updateContract);
router.patch("/contracts/:id/analysis", saveContractAnalysis);

// Delete
router.delete("/contracts/:id", deleteContract);

// Download / Stream File
router.get("/contracts/:id/download", downloadContract);

module.exports = router;
