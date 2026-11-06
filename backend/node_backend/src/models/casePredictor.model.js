const mongoose = require("mongoose");

const LegalPrecedentSchema = new mongoose.Schema({
  case: String,
  citation: String,
  explanation: String,
});

const CaseSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Legal Case Advisory",
    },
    caseFacts: {
      type: String, // Text facts submitted by user
    },
    originalName: {
      type: String, // If an attachment/document was uploaded
    },
    mimeType: String,
    fileSize: Number,
    fileData: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    // Structured prediction returned by the AI pipeline (stores full prediction object)
    prediction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

CaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Case", CaseSchema, "cases");