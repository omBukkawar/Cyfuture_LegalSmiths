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
    // Structured prediction returned by Gemini AI
    prediction: {
      title: String,
      petitioner: String,
      respondent: String,
      successProbability: String, // e.g., "75%"
      likelyOutcome: String,
      strongPoints: [String],
      weakPoints: [String],
      legalPrecedents: [LegalPrecedentSchema],
      strategies: [String],
      penalties: [String],
      finalAdvisory: String,
    },
  },
  {
    timestamps: true,
  }
);

CaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Case", CaseSchema, "cases");