const mongoose = require("mongoose");

const SummarySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Untitled Summary",
    },
    text: {
      type: String,
      required: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Summary", SummarySchema, "summaries");