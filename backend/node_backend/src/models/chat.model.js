const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "assistant", "bot"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  category: {
    type: String, // 'qa' | 'legaltext' | 'mixed'
  },
  references: [String], // [e.g. "IPC Section 302", "Contract Act Sec 10"]
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Legal Consultation",
      trim: true,
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", ChatSessionSchema, "chat_sessions");
