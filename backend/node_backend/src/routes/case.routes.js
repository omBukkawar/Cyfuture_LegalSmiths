const express = require("express");
const router = express.Router();

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
router.get("/cases/recent", aliasRecentCases, getCases);
router.get("/cases/completed", aliasCompletedCases, getCases);

// Create
router.post("/upload-case", upload.single("file"), uploadCase);
router.post("/cases", upload.single("file"), uploadCase);

// Read All (with filtering, sorting, field limiting, search & pagination)
router.get("/cases", getCases);

// Read One
router.get("/cases/:id", getCaseById);

// Update
router.patch("/cases/:id", updateCase);
router.patch("/cases/:id/prediction", saveCasePrediction);
router.post("/cases/save-prediction", saveCasePrediction);

// Delete
router.delete("/cases/:id", deleteCase);

// Download
router.get("/cases/:id/download", downloadCase);

module.exports = router;
