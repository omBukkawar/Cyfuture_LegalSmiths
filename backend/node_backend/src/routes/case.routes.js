const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware.js");

const {
  uploadCase,
  getCases,
  getCaseById,
  updateCase,
  saveCasePrediction,
  deleteCase,
  downloadCase,
} = require("../controllers/case.controller.js");
const upload = require("../middlewares/upload.middleware.js");

// Aliasing Middleware: Recent Cases
function aliasRecentCases(req, res, next) {
  req.query.sort = "-createdAt";
  req.query.limit = "5";
  next();
}

// Aliasing Middleware: Completed Cases
function aliasCompletedCases(req, res, next) {
  req.query.status = "completed";
  req.query.sort = "-createdAt";
  next();
}

// Aliased Routes
router.get("/cases/recent", verifyToken, aliasRecentCases, getCases);
router.get("/cases/completed", verifyToken, aliasCompletedCases, getCases);

// Create
router.post("/upload-case", verifyToken, upload.single("file"), uploadCase);
router.post("/cases", verifyToken, upload.single("file"), uploadCase);

// Read All (with filtering, sorting, field limiting, search & pagination)
router.get("/cases", verifyToken, getCases);

// Read One
router.get("/cases/:id", verifyToken, getCaseById);

// Update
router.patch("/cases/:id", verifyToken, updateCase);
router.patch("/cases/:id/prediction", verifyToken, saveCasePrediction);
router.post("/cases/save-prediction", verifyToken, saveCasePrediction);

// Delete
router.delete("/cases/:id", verifyToken, deleteCase);

// Download
router.get("/cases/:id/download", verifyToken, downloadCase);

module.exports = router;
