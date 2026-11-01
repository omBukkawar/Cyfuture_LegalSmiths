const express = require("express");
const router = express.Router();

const {
  createChatSession,
  getChatSessions,
  getChatSessionById,
  addMessageToSession,
  deleteChatSession,
} = require("../controllers/chat.controller.js");

// Chat Session Routes
router.post("/sessions", createChatSession);
router.get("/sessions", getChatSessions);
router.get("/sessions/:sessionId", getChatSessionById);
router.post("/sessions/:sessionId/messages", addMessageToSession);
router.delete("/sessions/:sessionId", deleteChatSession);

module.exports = router;

