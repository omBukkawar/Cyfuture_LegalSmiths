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
  text: "Hello! I am your AI Legal Assistant powered by LegalSmiths. How can I assist you with Indian laws, statutory provisions, or legal queries today?",
};

const PRESET_QUERIES = [
  "What is Section 138 of the Negotiable Instruments Act?",
  "What are tenant rights against arbitrary eviction under Rent Control laws?",
  "What is the procedure to file a consumer dispute in India?",
];

const LegalAssistant = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([DEFAULT_WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
            "⚠️ Unable to connect to the Legal Assistant server. Please ensure the Python backend is running on port 8000.",
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

  const handleLogout = () => { logout(navigate); };

  return (
    <div className={styles.legalAssistant}>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.brand}>
          LegalSmiths
        </Link>
        <button
          onClick={handleLogout}
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
                Suggested Inquiries:
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
                <p className={styles.txt} style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </p>
              </div>
            ))}

            {/* Loading / Thinking Indicator */}
            {loading && (
              <div className={`${styles.chat} ${styles.bot}`}>
                <img className={styles.chatImg} src={gptImgLogo} alt="AI" />
                <p className={styles.txt} style={{ fontStyle: "italic", color: "#555" }}>
                  Analyzing legal context and generating advisory...
                </p>
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
