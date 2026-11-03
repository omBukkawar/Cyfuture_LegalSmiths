import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/legalAssistant.module.css";
import { AI_API_URL } from "../config/api";
import { logout } from "../utils/auth";

import msgIcon from "../assets/message.svg";
import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
import gptImgLogo from "../assets/chatgptLogo.svg";

const DEFAULT_WELCOME = {
  sender: "bot",
  text: "Hello! I am your AI Legal Assistant powered by LegalSmiths.\n\nI can assist you with Indian statutory provisions (Bharatiya Nyaya Sanhita, BNSS, Indian Contract Act, Consumer Protection Act), procedural guidance, and landmark case precedents.",
};

const PRESET_QUERIES = [
  "What are the rights of an arrested person under BNSS in India?",
  "What is Section 138 of the Negotiable Instruments Act for cheque bounce?",
  "What are tenant rights against arbitrary eviction under Rent Control laws?",
  "What remedies exist under RERA when a builder delays flat possession?",
];

const LegalAssistant = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle sending a message
  const handleSend = async (textToSend) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    // Add user message to chat
    const updatedMessages = [...messages, { sender: "user", text: question }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${AI_API_URL}/legalassistant`, {
        questions: [question],
      });

      const botAnswer =
        response.data?.answers?.[0] ||
        "I could not retrieve an answer for this query. Please consult a qualified legal professional.";

      setMessages((prev) => [...prev, { sender: "bot", text: botAnswer }]);
    } catch (err) {
      console.error("Legal assistant query error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            "⚠️ Unable to connect to the Legal Assistant service. Please ensure the backend is active.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleNewChat = () => {
    setMessages([DEFAULT_WELCOME]);
    setInput("");
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render formatted text with citations and bolding
  const renderMessageContent = (text) => {
    if (!text) return null;

    // Detect trailing statutory citations in brackets e.g. [Act, Year, Section]
    const citationRegex = /\[(.*?)\]\s*$/;
    const match = text.match(citationRegex);
    let mainText = text;
    let citation = null;
    if (match) {
      mainText = text.substring(0, match.index).trim();
      citation = match[1];
    }

    const paragraphs = mainText.split("\n").filter((p) => p.trim());

    return (
      <div style={{ width: "100%" }}>
        {paragraphs.map((p, idx) => {
          const parts = p.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} style={{ marginBottom: "8px", lineHeight: "1.6" }}>
              {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        })}

        {citation && (
          <div
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              background: "#eef2ff",
              color: "#3730a3",
              border: "1px solid #c7d2fe",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: "600",
              display: "inline-block",
            }}
          >
            📜 Statutory Authority: {citation}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.legalAssistant}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.brand}>
          LegalSmiths
        </Link>
        <button
          onClick={() => logout(navigate)}
          className={styles.loginLink}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div className={styles.container}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.upperSide}>
            <button className={styles.midBtn} onClick={handleNewChat}>
              + New Consultation
            </button>

            {/* Suggested Legal Queries */}
            <div className={styles.upperSiderBottom}>
              <p style={{ fontSize: "0.8rem", color: "#bbb", marginBottom: "0.5rem" }}>
                Suggested Indian Law Inquiries:
              </p>
              {PRESET_QUERIES.map((queryText, index) => (
                <button
                  key={index}
                  className={styles.query}
                  onClick={() => handleSend(queryText)}
                  disabled={loading}
                >
                  <img src={msgIcon} alt="Query" />
                  <span style={{ textAlign: "left", fontSize: "0.75rem" }}>
                    {queryText}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className={styles.back} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {/* Main Chat Interface */}
        <div className={styles.main}>
          <div className={styles.title}>
            <h5>AI Legal Assistant</h5>
          </div>

          {/* Messages Scroll Area */}
          <div className={styles.chats}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.chat} ${msg.sender === "bot" ? styles.bot : ""}`}
              >
                <img
                  className={styles.chatImg}
                  src={msg.sender === "bot" ? gptImgLogo : userIcon}
                  alt={msg.sender === "bot" ? "AI Assistant" : "User"}
                />
                <div style={{ flex: 1 }}>
                  {renderMessageContent(msg.text)}
                  {msg.sender === "bot" && index > 0 && (
                    <button
                      onClick={() => handleCopy(msg.text, index)}
                      style={{
                        background: "none",
                        border: "1px solid #aaa",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "0.7rem",
                        color: "#555",
                        cursor: "pointer",
                        marginTop: "6px",
                      }}
                      title="Copy Advisory"
                    >
                      {copiedIndex === index ? "✓ Copied" : "📋 Copy Advisory"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Loading / Thinking Indicator */}
            {loading && (
              <div className={`${styles.chat} ${styles.bot}`}>
                <img className={styles.chatImg} src={gptImgLogo} alt="AI" />
                <div style={{ fontStyle: "italic", color: "#555" }}>
                  <p>Searching official statutes and synthesizing legal advisory...</p>
                  <small style={{ fontSize: "0.7rem", color: "#888" }}>
                    Checking BNS, BNSS, and Indian judicial precedent
                  </small>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Footer */}
          <div className={styles.chatFooter}>
            <form className={styles.inp} onSubmit={handleFormSubmit}>
              <input
                type="text"
                placeholder="Ask any question about Indian law or legal procedures..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className={styles.send} disabled={loading || !input.trim()}>
                <img src={sendBtn} alt="Send" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAssistant;
