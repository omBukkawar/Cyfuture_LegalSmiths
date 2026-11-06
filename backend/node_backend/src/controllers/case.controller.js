const Case = require("../models/casePredictor.model.js");
const APIFeatures = require("../utils/apiFeatures.js");
const jwt = require("jsonwebtoken");

// Helper to safely extract userId from verified token, header, or query
function extractUserId(req) {
  if (req.user?.id) return String(req.user.id);
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);
      if (decoded?.id) return String(decoded.id);
      if (decoded?.email) return String(decoded.email);
    } catch (err) {
      // Ignore token decode failure
    }
  }
  return (
    req.headers["x-user-id"] ||
    req.query?.userId ||
    req.body?.userId ||
    "anonymous"
  );
}

// 1. CREATE: Upload Case Document or Submit Case Facts
async function uploadCase(req, res) {
  try {
    const userId = extractUserId(req);
    const title = req.body?.title || "Legal Case Advisory";
    const caseFacts = req.body?.caseFacts || "";

    const caseData = {
      userId: String(userId),
      title,
      caseFacts,
      status: "pending",
    };

    if (req.file) {
      caseData.originalName = req.file.originalname;
      caseData.mimeType = req.file.mimetype || "application/pdf";
      caseData.fileSize = req.file.size;
      caseData.fileData = req.file.buffer.toString("base64");
    }

    const doc = new Case(caseData);
    await doc.save();

    const responseDoc = doc.toObject();
    delete responseDoc.fileData;

    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      doc: responseDoc,
    });
  } catch (err) {
    console.error("Case upload error:", err);
    return res.status(500).json({ success: false, message: "Server error during case upload" });
  }
}

// 2. READ ALL: Get Cases with Filtering, Sorting, Field Limiting & Pagination
async function getCases(req, res) {
  try {
    const userId = extractUserId(req);
    const queryString = { ...req.query };
    if (!queryString.userId && userId && userId !== "anonymous") {
      queryString.userId = String(userId);
    }
    if (!queryString.sort) {
      queryString.sort = "-createdAt";
    }

    const features = new APIFeatures(Case.find(), queryString)
      .filter()
      .sort()
      .limitFields();

    const total = await Case.countDocuments(features.filterQuery);

    features.paginate();
    const docs = await features.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      count: docs.length,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: docs,
    });
  } catch (err) {
    console.error("Fetch cases error:", err);
    return res.status(500).json({ success: false, message: "Error fetching cases" });
  }
}

// 3. READ ONE: Get Case By ID
async function getCaseById(req, res) {
  try {
    const doc = await Case.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }
    return res.json({ success: true, doc });
  } catch (err) {
    console.error("Fetch case by ID error:", err);
    return res.status(500).json({ success: false, message: "Error fetching case details" });
  }
}

// 4. UPDATE: Update Case Metadata (title, caseFacts, status)
async function updateCase(req, res) {
  try {
    const allowedUpdates = ["title", "caseFacts", "status", "prediction"];
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const doc = await Case.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    return res.json({ success: true, message: "Case updated successfully", doc });
  } catch (err) {
    console.error("Update case error:", err);
    return res.status(500).json({ success: false, message: "Error updating case" });
  }
}

// 5. UPDATE: Save Case Prediction Results (supports both existing ID or creating new from body)
async function saveCasePrediction(req, res) {
  try {
    const userId = extractUserId(req);
    const { prediction, caseFacts, title } = req.body;
    if (!prediction) {
      return res.status(400).json({ success: false, message: "Prediction data required" });
    }

    let doc;
    if (req.params.id && req.params.id !== "undefined") {
      doc = await Case.findByIdAndUpdate(
        req.params.id,
        {
          prediction,
          status: "completed",
          ...(caseFacts ? { caseFacts } : {}),
          ...(title ? { title } : {}),
        },
        { new: true }
      );
    }

    if (!doc) {
      const caseTitle = title || prediction.title || (caseFacts ? caseFacts.slice(0, 50) + "..." : "Legal Case Outcome Assessment");
      doc = new Case({
        userId: String(userId),
        title: caseTitle,
        caseFacts: caseFacts || "",
        status: "completed",
        prediction,
      });
      await doc.save();
    }

    return res.json({ success: true, message: "Case prediction saved", doc });
  } catch (err) {
    console.error("Save prediction error:", err);
    return res.status(500).json({ success: false, message: "Error saving case prediction" });
  }
}

// 6. DELETE: Delete a Case
async function deleteCase(req, res) {
  try {
    const doc = await Case.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }
    return res.json({ success: true, message: "Case deleted successfully" });
  } catch (err) {
    console.error("Delete case error:", err);
    return res.status(500).json({ success: false, message: "Error deleting case" });
  }
}

// 7. DOWNLOAD / STREAM Case File
async function downloadCase(req, res) {
  try {
    const doc = await Case.findById(req.params.id).select("+fileData");
    if (!doc || !doc.fileData) {
      return res.status(404).json({ success: false, message: "File content not found" });
    }

    const fileBuffer = Buffer.from(doc.fileData, "base64");
    res.setHeader("Content-Type", doc.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", fileBuffer.length);

    return res.send(fileBuffer);
  } catch (err) {
    console.error("Download case error:", err);
    return res.status(500).json({ success: false, message: "Error downloading case file" });
  }
}

module.exports = {
  uploadCase,
  getCases,
  getCaseById,
  updateCase,
  saveCasePrediction,
  deleteCase,
  downloadCase,
};
