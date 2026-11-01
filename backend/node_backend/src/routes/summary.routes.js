const express = require("express");
const router = express.Router();

const {
  addSummary,
  getSummaries,
  getSummaryById,
  updateSummary,
  deleteSummary,
} = require("../controllers/summary.controller.js");

// Create
router.post("/add-summary", addSummary);
router.post("/summaries", addSummary);

// Read All (with filtering, sorting, field limiting, search & pagination)
router.get("/summaries", getSummaries);

// Read One
router.get("/summaries/:id", getSummaryById);

// Update
router.patch("/summaries/:id", updateSummary);

// Delete
router.delete("/summaries/:id", deleteSummary);

module.exports = router;
