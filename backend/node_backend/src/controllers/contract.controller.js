const Contract = require("../models/contract.model.js");
const APIFeatures = require("../utils/apiFeatures.js");

// 1. CREATE: Upload a Contract
async function uploadContract(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No contract file uploaded" });
    }

    const userId = req.user?.id || req.body?.userId || "anonymous";

    const contract = new Contract({
      userId: String(userId),
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "application/pdf",
      fileSize: req.file.size,
      fileData: req.file.buffer.toString("base64"),
      status: "uploaded",
    });

    await contract.save();

    const responseDoc = contract.toObject();
    delete responseDoc.fileData;

    return res.status(201).json({
      success: true,
      message: "Contract uploaded successfully",
      doc: responseDoc,
    });
  } catch (err) {
    console.error("Contract upload error:", err);
    return res.status(500).json({ success: false, message: "Server error during contract upload" });
  }
}

// 2. READ ALL: Get Contracts with Filtering, Sorting, Field Limiting & Pagination
async function getContracts(req, res) {
  try {
    // If a user token exists, restrict query to that user unless user requests specific userId
    const queryString = { ...req.query };
    if (req.user?.id && !queryString.userId) {
      queryString.userId = String(req.user.id);
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

// 4. UPDATE: Update Contract Metadata (e.g. status, originalName)
async function updateContract(req, res) {
  try {
    const allowedUpdates = ["originalName", "status", "analysis"];
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

// 5. UPDATE: Save AI Analysis Result (Specialized update)
async function saveContractAnalysis(req, res) {
  try {
    const { analysis } = req.body;
    if (!analysis) {
      return res.status(400).json({ success: false, message: "Analysis data required" });
    }

    const doc = await Contract.findByIdAndUpdate(
      req.params.id,
      { analysis, status: "analyzed" },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    return res.json({ success: true, message: "Contract analysis saved", doc });
  } catch (err) {
    console.error("Save analysis error:", err);
    return res.status(500).json({ success: false, message: "Error saving contract analysis" });
  }
}

// 6. DELETE: Delete Contract Record
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

// 7. DOWNLOAD / STREAM FILE
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
  deleteContract,
  downloadContract,
};
