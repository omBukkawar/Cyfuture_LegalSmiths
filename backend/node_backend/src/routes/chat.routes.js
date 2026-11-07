const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware.js");

const {
  createChatSession,
  getChatSessions,
  getChatSessionById,
  addMessageToSession,
  updateChatSessionTitle,
  deleteChatSession,
} = require("../controllers/chat.controller.js");

// Chat Session Routes
router.post("/sessions", verifyToken, createChatSession);
router.get("/sessions", verifyToken, getChatSessions);
router.get("/sessions/:sessionId", verifyToken, getChatSessionById);
router.post("/sessions/:sessionId/messages", verifyToken, addMessageToSession);
router.patch("/sessions/:sessionId/title", verifyToken, updateChatSessionTitle);
router.put("/sessions/:sessionId/title", verifyToken, updateChatSessionTitle);
router.delete("/sessions/:sessionId", verifyToken, deleteChatSession);

module.exports = router;
