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
    // Structured insights returned by Gemini AI
    analysis: {
      title: String,
      parties: String,
      dates: String,
      payment_terms: String,
      obligations: String,
      termination: String,
      mistakes_ambiguities: String,
      red_flags: [String],
      plain_summary: String,
      risk_level: {
        type: String,
        enum: ["Low", "Medium", "High", "Unknown", null],
        default: null,
      },
      recommendations: String,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index for fast user dashboard queries
ContractSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Contract", ContractSchema, "contracts");