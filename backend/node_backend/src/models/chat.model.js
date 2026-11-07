const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: [20000, "Message text cannot exceed 20,000 characters"],
    trim: true,
  },
  category: {
    type: String,
    enum: ["qa", "legaltext", "mixed"],
    default: "qa",
  },
  references: {
    type: [String],
    validate: {
      validator: (arr) => arr.length <= 20,
      message: "References cannot exceed 20 items",
    },
  },
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Legal Consultation",
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    messages: {
      type: [MessageSchema],
      validate: {
        validator: (arr) => arr.length <= 500,
        message: "A session cannot exceed 500 messages",
      },
    },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", ChatSessionSchema, "chat_sessions");
