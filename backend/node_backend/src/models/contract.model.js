const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },
    originalName: {
      type: String,
      required: [true, "originalName is required"],
      trim: true,
      maxlength: [500, "File name cannot exceed 500 characters"],
    },
    mimeType: {
      type: String,
      default: "application/pdf",
      enum: {
        values: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"],
        message: "Unsupported file type: {VALUE}",
      },
    },
    fileSize: {
      type: Number,
      default: 0,
      min: [0, "File size cannot be negative"],
      max: [20 * 1024 * 1024, "File size cannot exceed 20 MB"],
    },
    contractText: {
      type: String,
      default: "",
      maxlength: [500000, "Contract text cannot exceed 500,000 characters"],
    },
    fileData: { type: String, select: false },
    status: {
      type: String,
      enum: {
        values: ["uploaded", "analyzing", "analyzed", "failed"],
        message: "Invalid status: {VALUE}",
      },
      default: "uploaded",
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      validate: {
        validator: function (v) {
          if (v === null) return true;
          return typeof v === "object" && !Array.isArray(v);
        },
        message: "Analysis must be a plain object or null",
      },
    },
  },
  { timestamps: true }
);

ContractSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Contract", ContractSchema, "contracts");
