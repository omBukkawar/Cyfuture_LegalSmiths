const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware.js");

const {
  addSummary,
  getSummaries,
  getSummaryById,
  updateSummary,
  deleteSummary,
} = require("../controllers/summary.controller.js");

// Create
router.post("/add-summary", verifyToken, addSummary);
router.post("/summaries", verifyToken, addSummary);

// Read All (with filtering, sorting, field limiting, search & pagination)
router.get("/summaries", verifyToken, getSummaries);

// Read One
router.get("/summaries/:id", verifyToken, getSummaryById);

// Update
router.patch("/summaries/:id", verifyToken, updateSummary);

// Delete
router.delete("/summaries/:id", verifyToken, deleteSummary);

module.exports = router;
