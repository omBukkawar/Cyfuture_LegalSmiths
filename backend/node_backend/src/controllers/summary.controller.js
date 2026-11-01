const Summary = require("../models/summary.model.js");
const APIFeatures = require("../utils/apiFeatures.js");

// 1. CREATE: Add a Summary
async function addSummary(req, res) {
  try {
    const { text, title, tags } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Summary text is required" });
    }

    const userId = req.user?.id || req.body?.userId || "anonymous";

    const summary = new Summary({
      userId: String(userId),
      title: title || "Untitled Summary",
      text,
      tags: tags || [],
    });

    await summary.save();
    return res.status(201).json({ success: true, message: "Summary saved successfully", summary });
  } catch (err) {
    console.error("Add summary error:", err);
    return res.status(500).json({ success: false, message: "Error saving summary" });
  }
}

// 2. READ ALL: Get Summaries with Filtering, Sorting, Search & Pagination
async function getSummaries(req, res) {
  try {
    const queryString = { ...req.query };
    if (req.user?.id && !queryString.userId) {
      queryString.userId = String(req.user.id);
    }

    const features = new APIFeatures(Summary.find(), queryString)
      .filter()
      .sort()
      .limitFields();

    const total = await Summary.countDocuments(features.filterQuery);

    features.paginate();
    const summaries = await features.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      count: summaries.length,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: summaries,
    });
  } catch (err) {
    console.error("Get summaries error:", err);
    return res.status(500).json({ success: false, message: "Error fetching summaries" });
  }
}

// 3. READ ONE: Get Summary By ID
async function getSummaryById(req, res) {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, message: "Summary not found" });
    }
    return res.json({ success: true, summary });
  } catch (err) {
    console.error("Get summary by ID error:", err);
    return res.status(500).json({ success: false, message: "Error fetching summary" });
  }
}

// 4. UPDATE: Update Summary
async function updateSummary(req, res) {
  try {
    const { title, text, tags } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (text !== undefined) updates.text = text;
    if (tags !== undefined) updates.tags = tags;

    const summary = await Summary.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!summary) {
      return res.status(404).json({ success: false, message: "Summary not found" });
    }

    return res.json({ success: true, message: "Summary updated successfully", summary });
  } catch (err) {
    console.error("Update summary error:", err);
    return res.status(500).json({ success: false, message: "Error updating summary" });
  }
}

// 5. DELETE: Delete Summary
async function deleteSummary(req, res) {
  try {
    const summary = await Summary.findByIdAndDelete(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, message: "Summary not found" });
    }
    return res.json({ success: true, message: "Summary deleted successfully" });
  } catch (err) {
    console.error("Delete summary error:", err);
    return res.status(500).json({ success: false, message: "Error deleting summary" });
  }
}

module.exports = {
  addSummary,
  getSummaries,
  getSummaryById,
  updateSummary,
  deleteSummary,
};
