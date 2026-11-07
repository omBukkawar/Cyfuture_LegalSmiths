const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema(
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
      default: "Untitled Summary",
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    text: {
      type: String,
      required: [true, "Summary text is required"],
      maxlength: [50000, "Summary text cannot exceed 50,000 characters"],
    },
    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: "Tags cannot exceed 20 items",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Summary", SummarySchema, "summaries");