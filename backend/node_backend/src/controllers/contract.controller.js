const Contract = require("../models/contract.model.js");
const APIFeatures = require("../utils/apiFeatures.js");

// Extract userId from verified token only (set by verifyToken middleware)
function extractUserId(req) {
  return req.user?.id ? String(req.user.id) : "anonymous";
}

// 1. CREATE / UPLOAD: Upload a Contract (file or pasted text)
async function uploadContract(req, res) {
  try {
    const userId = extractUserId(req);
    const pastedText = req.body?.contractText || req.body?.text || req.body?.pastedText;

    if (!req.file && (!pastedText || !pastedText.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide either a contract file or contract text",
      });
    }

    let originalName = "Pasted Contract";
    let mimeType = "text/plain";
    let fileSize = 0;
    let fileDataBase64 = null;

    if (req.file) {
      originalName = req.file.originalname;
      mimeType = req.file.mimetype || "application/pdf";
      fileSize = req.file.size;
      fileDataBase64 = req.file.buffer ? req.file.buffer.toString("base64") : null;
    } else if (pastedText) {
      originalName = req.body?.title || `Contract Audit (${new Date().toLocaleDateString()})`;
      fileSize = Buffer.byteLength(pastedText, "utf8");
    }

    // Parse analysis if supplied in payload
    let parsedAnalysis = null;
    if (req.body?.analysis) {
      try {
        parsedAnalysis = typeof req.body.analysis === "string" ? JSON.parse(req.body.analysis) : req.body.analysis;
      } catch (e) {
        parsedAnalysis = req.body.analysis;
      }
    }

    const contract = new Contract({
      userId: String(userId),
      originalName,
      mimeType,
      fileSize,
      contractText: pastedText || "",
      fileData: fileDataBase64,
      status: parsedAnalysis ? "analyzed" : "uploaded",
      analysis: parsedAnalysis || null,
    });

    await contract.save();

    const responseDoc = contract.toObject();
    delete responseDoc.fileData;

    return res.status(201).json({
      success: true,
      message: "Contract saved successfully",
      doc: responseDoc,
    });
  } catch (err) {
    console.error("Contract upload error:", err);
    return res.status(500).json({ success: false, message: "Server error during contract upload" });
  }
}

// 2. READ ALL: Get Contracts for current user with Filtering, Sorting, Field Limiting & Pagination
async function getContracts(req, res) {
  try {
    const userId = extractUserId(req);
    const queryString = { ...req.query };

    // Default to current user's contracts
    if (!queryString.userId && userId && userId !== "anonymous") {
      queryString.userId = String(userId);
    }

    // Default sort by newest
    if (!queryString.sort) {
      queryString.sort = "-createdAt";
    }

    // Execute query with APIFeatures
    const features = new APIFeatures(Contract.find(), queryString)
      .filter()
      .sort()
      .limitFields();

    // Total count for pagination metadata
    const total = await Contract.countDocuments(features.filterQuery);

    // Apply pagination
    features.paginate();
    const docs = await features.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
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
    console.error("Fetch contracts error:", err);
    return res.status(500).json({ success: false, message: "Error fetching contracts" });
  }
}

// 3. READ ONE: Get Contract By ID
async function getContractById(req, res) {
  try {
    const doc = await Contract.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }
    return res.json({ success: true, doc });
  } catch (err) {
    console.error("Fetch contract by ID error:", err);
    return res.status(500).json({ success: false, message: "Error fetching contract details" });
  }
}

// 4. UPDATE: Update Contract Metadata
async function updateContract(req, res) {
  try {
    const allowedUpdates = ["originalName", "status", "analysis", "contractText"];
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const doc = await Contract.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    return res.json({ success: true, message: "Contract updated successfully", doc });
  } catch (err) {
    console.error("Update contract error:", err);
    return res.status(500).json({ success: false, message: "Error updating contract" });
  }
}

// 5. UPDATE / SAVE: Save AI Analysis Result to contract record
async function saveContractAnalysis(req, res) {
  try {
    const { analysis, contractText, originalName } = req.body;
    if (!analysis) {
      return res.status(400).json({ success: false, message: "Analysis data required" });
    }

    const updates = { analysis, status: "analyzed" };
    if (contractText) updates.contractText = contractText;
    if (originalName) updates.originalName = originalName;

    const doc = await Contract.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    return res.json({ success: true, message: "Contract analysis saved successfully", doc });
  } catch (err) {
    console.error("Save analysis error:", err);
    return res.status(500).json({ success: false, message: "Error saving contract analysis" });
  }
}

// 6. SAVE COMPLETE AUDIT: Save or update full audit report
async function saveCompleteAudit(req, res) {
  try {
    const userId = extractUserId(req);
    const { contractId, originalName, contractText, analysis } = req.body;

    if (!analysis) {
      return res.status(400).json({ success: false, message: "Analysis data is required" });
    }

    let doc;
    if (contractId) {
      doc = await Contract.findByIdAndUpdate(
        contractId,
        {
          analysis,
          contractText: contractText || "",
          status: "analyzed",
          ...(originalName ? { originalName } : {}),
        },
        { new: true }
      );
    }

    if (!doc) {
      doc = new Contract({
        userId: String(userId),
        originalName: originalName || analysis.title || `Contract Audit (${new Date().toLocaleDateString()})`,
        mimeType: "text/plain",
        contractText: contractText || "",
        status: "analyzed",
        analysis,
      });
      await doc.save();
    }

    return res.status(200).json({
      success: true,
      message: "Audit report saved to vault",
      doc,
    });
  } catch (err) {
    console.error("Save complete audit error:", err);
    return res.status(500).json({ success: false, message: "Error saving audit report" });
  }
}

// 7. DELETE: Delete Contract Record
async function deleteContract(req, res) {
  try {
    const doc = await Contract.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }
    return res.json({ success: true, message: "Contract deleted successfully" });
  } catch (err) {
    console.error("Delete contract error:", err);
    return res.status(500).json({ success: false, message: "Error deleting contract" });
  }
}

// 8. DOWNLOAD / STREAM FILE
async function downloadContract(req, res) {
  try {
    const doc = await Contract.findById(req.params.id).select("+fileData");
    if (!doc || !doc.fileData) {
      return res.status(404).json({ success: false, message: "File content not found" });
    }

    const fileBuffer = Buffer.from(doc.fileData, "base64");
    res.setHeader("Content-Type", doc.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalName}"`);
    res.setHeader("Content-Length", fileBuffer.length);

    return res.send(fileBuffer);
  } catch (err) {
    console.error("Download contract error:", err);
    return res.status(500).json({ success: false, message: "Error downloading file" });
  }
}

module.exports = {
  uploadContract,
  getContracts,
  getContractById,
  updateContract,
  saveContractAnalysis,
  saveCompleteAudit,
  deleteContract,
  downloadContract,
};
