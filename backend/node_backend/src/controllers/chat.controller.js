const ChatSession = require("../models/chat.model.js");

// Extract userId from verified token only (set by verifyToken middleware)
function extractUserId(req) {
  return req.user?.id ? String(req.user.id) : "anonymous";
}

// 1. Create a New Chat Session
async function createChatSession(req, res) {
  try {
    const userId = extractUserId(req);
    const title = req.body?.title || "New Legal Consultation";
    const initialMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

    const session = new ChatSession({
      userId: String(userId),
      title,
      messages: initialMessages,
    });

    await session.save();

    return res.status(201).json({
      success: true,
      message: "Chat session created",
      session,
    });
  } catch (err) {
    console.error("Create chat session error:", err);
    return res.status(500).json({ success: false, message: "Error creating chat session", error: err.message });
  }
}

// 2. Get All Chat Sessions for User
async function getChatSessions(req, res) {
  try {
    const userId = extractUserId(req);

    const sessions = await ChatSession.find({ userId: String(userId) })
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    // Format list with preview and message count
    const formattedSessions = sessions.map((s) => {
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null;
      return {
        _id: s._id,
        title: s.title || "Legal Consultation",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: s.messages ? s.messages.length : 0,
        preview: lastMsg ? lastMsg.text.slice(0, 60) + "..." : "",
      };
    });

    return res.json({ success: true, sessions: formattedSessions });
  } catch (err) {
    console.error("Get chat sessions error:", err);
    return res.status(500).json({ success: false, message: "Error fetching chat sessions", error: err.message });
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
    return res.status(500).json({ success: false, message: "Error fetching session messages", error: err.message });
  }
}

// 4. Add a Message to Session (User query or AI response)
async function addMessageToSession(req, res) {
  try {
    const { sender, text, category, references } = req.body;

    if (!sender || !text) {
      return res.status(400).json({
        success: false,
        message: "sender ('user'|'assistant'|'bot') and text are required",
      });
    }

    const normalizedSender = (sender === "bot" || sender === "assistant") ? "assistant" : "user";

    const message = {
      sender: normalizedSender,
      text,
      category: category || "qa",
      references: references || [],
      createdAt: new Date(),
    };

    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Auto-update session title if it's currently the default title and user sends first message
    const isDefaultTitle = !session.title || session.title === "New Legal Consultation" || session.title === "New Legal Query";
    if (isDefaultTitle && normalizedSender === "user") {
      const cleanText = text.replace(/\s+/g, " ").trim();
      session.title = cleanText.length > 45 ? cleanText.slice(0, 42) + "..." : cleanText;
    }

    session.messages.push(message);
    await session.save();

    return res.json({ success: true, message: "Message added", session });
  } catch (err) {
    console.error("Add message error:", err);
    return res.status(500).json({ success: false, message: "Error adding message to chat session", error: err.message });
  }
}

// 5. Update Chat Session Title
async function updateChatSessionTitle(req, res) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const session = await ChatSession.findByIdAndUpdate(
      req.params.sessionId,
      { title: title.trim() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    return res.json({ success: true, message: "Chat title updated", session });
  } catch (err) {
    console.error("Update title error:", err);
    return res.status(500).json({ success: false, message: "Error updating chat session title", error: err.message });
  }
}

// 6. Delete Chat Session
async function deleteChatSession(req, res) {
  try {
    const session = await ChatSession.findByIdAndDelete(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }
    return res.json({ success: true, message: "Chat session deleted" });
  } catch (err) {
    console.error("Delete chat session error:", err);
    return res.status(500).json({ success: false, message: "Error deleting chat session", error: err.message });
  }
}

module.exports = {
  createChatSession,
  getChatSessions,
  getChatSessionById,
  addMessageToSession,
  updateChatSessionTitle,
  deleteChatSession,
};
