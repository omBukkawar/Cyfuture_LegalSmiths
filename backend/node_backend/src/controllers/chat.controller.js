const ChatSession = require("../models/chat.model.js");

// 1. Create a New Chat Session
async function createChatSession(req, res) {
  try {
    const userId = req.user?.id || req.body?.userId || "anonymous";
    const title = req.body?.title || "New Legal Consultation";

    const session = new ChatSession({
      userId: String(userId),
      title,
      messages: [],
    });

    await session.save();

    return res.status(201).json({
      success: true,
      message: "Chat session created",
      session,
    });
  } catch (err) {
    console.error("Create chat session error:", err);
    return res.status(500).json({ success: false, message: "Error creating chat session" });
  }
}

// 2. Get All Chat Sessions for User
async function getChatSessions(req, res) {
  try {
    const userId = req.user?.id || req.query?.userId || "anonymous";

    const sessions = await ChatSession.find({ userId: String(userId) })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.json({ success: true, sessions });
  } catch (err) {
    console.error("Get chat sessions error:", err);
    return res.status(500).json({ success: false, message: "Error fetching chat sessions" });
  }
}

// 3. Get Chat Session by ID (with full message history)
async function getChatSessionById(req, res) {
  try {
    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    return res.json({ success: true, session });
  } catch (err) {
    console.error("Get chat session by ID error:", err);
    return res.status(500).json({ success: false, message: "Error fetching session messages" });
  }
}

// 4. Add a Message to Session (User query or AI response)
async function addMessageToSession(req, res) {
  try {
    const { sender, text, category, references } = req.body;

    if (!sender || !text) {
      return res.status(400).json({ success: false, message: "sender ('user'|'assistant') and text are required" });
    }

    const message = {
      sender,
      text,
      category: category || "qa",
      references: references || [],
      createdAt: new Date(),
    };

    const session = await ChatSession.findByIdAndUpdate(
      req.params.sessionId,
      { $push: { messages: message } },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    return res.json({ success: true, message: "Message added", session });
  } catch (err) {
    console.error("Add message error:", err);
    return res.status(500).json({ success: false, message: "Error adding message to chat session" });
  }
}

// 5. Delete Chat Session
async function deleteChatSession(req, res) {
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }
    return res.json({ success: true, message: "Chat session deleted" });
  } catch (err) {
    console.error("Delete chat session error:", err);
    return res.status(500).json({ success: false, message: "Error deleting chat session" });
  }
}

module.exports = {
  createChatSession,
  getChatSessions,
  getChatSessionById,
  addMessageToSession,
  deleteChatSession,
};

