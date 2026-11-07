const mongoose = require("mongoose");

const LegalPrecedentSchema = new mongoose.Schema({
  case: { type: String, maxlength: [500, "Case name too long"] },
  citation: { type: String, maxlength: [300, "Citation too long"] },
  explanation: { type: String, maxlength: [2000, "Explanation too long"] },
});

const CaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Legal Case Advisory",
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    caseFacts: {
      type: String,
      maxlength: [20000, "Case facts cannot exceed 20,000 characters"],
    },
    originalName: {
      type: String,
      maxlength: [500, "File name cannot exceed 500 characters"],
    },
    mimeType: { type: String },
    fileSize: {
      type: Number,
      min: [0, "File size cannot be negative"],
      max: [20 * 1024 * 1024, "File size cannot exceed 20 MB"],
    },
    fileData: { type: String, select: false },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed"],
        message: "Invalid status: {VALUE}",
      },
      default: "pending",
    },
    // Structured prediction returned by the AI pipeline (stores full prediction object)
    prediction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      validate: {
        validator: (v) => v === null || (typeof v === "object" && !Array.isArray(v)),
        message: "Prediction must be a plain object or null",
      },
    },
  },
  { timestamps: true }
);

CaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Case", CaseSchema, "cases");