const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    // Raw contract text (useful for pasted text or extracted document text)
    contractText: {
      type: String,
      default: "",
    },
    // Excluded from default queries so GET /contracts stays super fast
    fileData: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ["uploaded", "analyzing", "analyzed", "failed"],
      default: "uploaded",
    },
    // Complete structured legal audit returned by the AI pipeline
    // Uses Mixed to store rich evidence-backed red flags, missing protections, and rubric matrix
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index for fast user dashboard queries
ContractSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Contract", ContractSchema, "contracts");
