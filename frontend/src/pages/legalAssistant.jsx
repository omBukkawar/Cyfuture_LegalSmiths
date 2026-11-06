import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "../styles/legalAssistant.module.css";
import { NODE_API_URL, AI_API_URL, getAuthHeaders } from "../config/api";
import { getUser, logout } from "../utils/auth";
import gptImgLogo from "../assets/chatgptLogo.svg";
import userIcon from "../assets/user-icon.png";
import sendBtn from "../assets/send.svg";

const PRESET_QUERIES = [
  {
    title: "Rights of an Arrested Person",
    desc: "Mandatory safeguards and bail rights under BNSS 2023.",
    query: "What are the mandatory rights of an arrested person under the Bharatiya Nagarik Suraksha Sanhita (BNSS) in India?",
  },
  {
    title: "Cheque Bounce (Sec 138 NI Act)",
    desc: "Statutory legal notice and 15-day timeline requirements.",
    query: "What is the procedure and legal notice timeline under Section 138 of the Negotiable Instruments Act for cheque bounce?",
  },
  {
    title: "Tenant Arbitrary Eviction",
    desc: "Statutory protections under Indian Rent Control laws.",
    query: "What legal protections do residential tenants have against arbitrary eviction without due process under Indian law?",
  },
  {
    title: "RERA Delay in Flat Possession",
    desc: "Remedies and refund with statutory interest for delays.",
    query: "What remedies and interest compensation exist under RERA when a real estate builder delays possession of a flat?",
  },
];

const LegalAssistant = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const currentUser = getUser();

  // Chat sessions & active state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [input]);

  // 1. Fetch user's chat sessions
  const fetchSessions = useCallback(async () => {
    try {
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };

      const res = await axios.get(`${NODE_API_URL}/sessions`, { headers });
      if (res.data?.success && Array.isArray(res.data.sessions)) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.warn("Could not refresh sessions from Node backend:", err.message);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      try {
        const headers = {
          ...getAuthHeaders(),
          "x-user-id": currentUser?.id || "anonymous",
        };

        const res = await axios.get(`${NODE_API_URL}/sessions`, { headers });
        if (isMounted && res.data?.success && Array.isArray(res.data.sessions)) {
          setSessions(res.data.sessions);
        }
      } catch (err) {
        console.warn("Could not fetch sessions from Node backend; trying local cache:", err.message);
        const cached = localStorage.getItem(`legalsmiths_sessions_${currentUser?.id || "anonymous"}`);
        if (cached && isMounted) {
          try {
            setSessions(JSON.parse(cached));
          } catch (_parseErr) {
            console.warn("Cache parse error:", _parseErr);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingSessions(false);
        }
      }
    };

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // 2. Select and load a past chat session
  const handleSelectSession = async (sessionId) => {
    if (loading || activeSessionId === sessionId) return;

    setActiveSessionId(sessionId);
    setSidebarOpen(false); // close mobile sidebar if opened

    try {
      setLoading(true);
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };

      const res = await axios.get(`${NODE_API_URL}/sessions/${sessionId}`, { headers });
      if (res.data?.success && res.data.session) {
        const history = res.data.session.messages.map((m) => ({
          sender: m.sender === "user" ? "user" : "bot",
          text: m.text,
          createdAt: m.createdAt,
        }));
        setMessages(history);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Start a fresh new chat
  const handleNewChat = () => {
    if (loading) return;
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 4. Delete a chat session
  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this consultation?")) return;

    try {
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };

      await axios.delete(`${NODE_API_URL}/sessions/${sessionId}`, { headers });

      setSessions((prev) => prev.filter((s) => s._id !== sessionId));

      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Could not delete session. Please check backend connection.");
    }
  };

  // 5. Send message & sync to session
  const handleSend = async (textToSend) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    const userMsg = { sender: "user", text: question, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let currentSessionId = activeSessionId;
    const headers = {
      ...getAuthHeaders(),
      "x-user-id": currentUser?.id || "anonymous",
    };

    // A) If starting a fresh chat without a sessionId, create one first
    if (!currentSessionId) {
      try {
        const titleSnippet = question.length > 38 ? question.slice(0, 35) + "..." : question;
        const sessionRes = await axios.post(
          `${NODE_API_URL}/sessions`,
          {
            title: titleSnippet,
            userId: currentUser?.id || "anonymous",
          },
          { headers }
        );

        if (sessionRes.data?.success && sessionRes.data.session) {
          currentSessionId = sessionRes.data.session._id;
          setActiveSessionId(currentSessionId);
        }
      } catch (sessionErr) {
        console.warn("Session creation failed, continuing without session sync:", sessionErr.message);
      }
    }

    // B) Save user message to backend session
    if (currentSessionId) {
      axios
        .post(
          `${NODE_API_URL}/sessions/${currentSessionId}/messages`,
          { sender: "user", text: question },
          { headers }
        )
        .catch((e) => console.warn("Could not save user message to backend:", e.message));
    }

    // C) Invoke the AI Legal Assistant pipeline (Python backend)
    try {
      const aiRes = await axios.post(`${AI_API_URL}/legalassistant`, {
        questions: [question],
      });

      const botAnswer =
        aiRes.data?.answers?.[0] ||
        "I could not retrieve an answer for this query. Please consult a qualified legal professional.";

      const botMsg = {
        sender: "bot",
        text: botAnswer,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // D) Save bot response to backend session
      if (currentSessionId) {
        axios
          .post(
            `${NODE_API_URL}/sessions/${currentSessionId}/messages`,
            { sender: "assistant", text: botAnswer },
            { headers }
          )
          .then(() => fetchSessions()) // Refresh sidebar sessions list
          .catch((e) => console.warn("Could not save bot message to backend:", e.message));
      }
    } catch (aiErr) {
      console.error("Legal assistant query error:", aiErr);
      const errorMsg = {
        sender: "bot",
        text: "⚠️ Unable to connect to the Legal Assistant service. Please ensure the backend is active.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render markdown bolding & statutory citation tags
  const renderMessageContent = (text) => {
    if (!text) return null;

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
      <div>
        {paragraphs.map((p, idx) => {
          const parts = p.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx}>
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
          <div className={styles.statutePill}>
            <span>📜</span> Statutory Authority: {citation}
          </div>
        )}
      </div>
    );
  };

  // Current session title
  const currentSession = sessions.find((s) => s._id === activeSessionId);
  const currentTitle = currentSession?.title || (messages.length > 0 ? "Legal Consultation" : "AI Legal Assistant");

  return (
    <div className={styles.legalAssistant}>
      {/* -------------------------------------------------------------
          TOP NAVIGATION BAR (White text on background.jpeg)
         ------------------------------------------------------------- */}
      <nav className={styles.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            className={styles.navLink}
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="Go back"
          >
            ← Back
          </button>
          <Link to="/" className={styles.brand}>
            ⚖️ LegalSmiths
          </Link>
        </div>

        <div className={styles.topBarNav}>
          <Link to="/services" className={styles.navLink}>
            Services
          </Link>
          <button onClick={() => logout(navigate)} className={styles.navLink}>
            Logout
          </button>
        </div>
      </nav>

      {/* -------------------------------------------------------------
          MAIN CONTAINER (White card over background.jpeg)
         ------------------------------------------------------------- */}
      <div className={styles.container}>
        {/* -----------------------------------------------------------
            SIDEBAR (#727374 App Color, ChatGPT-style past chats)
           ----------------------------------------------------------- */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          {/* New Consultation Button (#3437C2) */}
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span>
            <span>New Consultation</span>
          </button>

          {/* Past Consultations Header */}
          <div className={styles.sessionSectionHeader}>
            <span className={styles.sectionTitle}>Past Consultations</span>
            <span className={styles.sessionBadge}>{sessions.length}</span>
          </div>

          {/* Scrollable Sessions List */}
          <div className={styles.sessionList}>
            {loadingSessions ? (
              <div className={styles.emptySessions}>Loading consultations...</div>
            ) : sessions.length === 0 ? (
              <div className={styles.emptySessions}>
                No saved consultations yet.
                <br />
                Ask a question to begin!
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s._id === activeSessionId;
                return (
                  <div
                    key={s._id}
                    className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}
                    onClick={() => handleSelectSession(s._id)}
                    title={s.title}
                  >
                    <div className={styles.sessionTitleWrapper}>
                      <span className={styles.sessionIcon}>💬</span>
                      <span className={styles.sessionTitleText}>{s.title || "Legal Consultation"}</span>
                    </div>

                    <button
                      className={styles.sessionDeleteBtn}
                      onClick={(e) => handleDeleteSession(s._id, e)}
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* User Profile & Back to Services */}
          <div className={styles.sidebarFooter}>
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>
                {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{currentUser?.name || "Legal User"}</span>
                <span className={styles.userRole}>{currentUser?.email || "Signed in"}</span>
              </div>
            </div>

            <button className={styles.backBtn} onClick={() => navigate("/services")}>
              ← Back to Services
            </button>
          </div>
        </aside>

        {/* -----------------------------------------------------------
            MAIN CHAT AREA (White background, light grey bot / #3437C2 user)
           ----------------------------------------------------------- */}
        <main className={styles.main}>
          {/* Header */}
          <header className={styles.chatHeader}>
            <div className={styles.headerTitleGroup}>
              <button
                className={styles.mobileMenuBtn}
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle history menu"
              >
                ☰
              </button>
              <button
                onClick={() => navigate(-1)}
                className={styles.headerBtn}
                title="Go back"
              >
                ← Back
              </button>
              <h2 className={styles.chatTitle}>{currentTitle}</h2>
              <span className={styles.chatSubtitle}>Powered by LegalSmiths AI</span>
            </div>

            <div className={styles.headerActions}>
              <button className={styles.headerBtn} onClick={handleNewChat}>
                <span>+</span> New Chat
              </button>
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div className={styles.chats}>
            {messages.length === 0 ? (
              /* Welcome Screen with Preset Inquiries */
              <div className={styles.welcomeContainer}>
                <div className={styles.welcomeIcon}>⚖️</div>
                <h1 className={styles.welcomeHeading}>AI Legal Assistant</h1>
                <p className={styles.welcomeDesc}>
                  Ask queries about Indian statutory provisions (Bharatiya Nyaya Sanhita, BNSS, Indian Contract
                  Act, Consumer Protection Act, RERA), legal procedural safeguards, and landmark judicial
                  precedents.
                </p>

                <div className={styles.presetGrid}>
                  {PRESET_QUERIES.map((preset, idx) => (
                    <div
                      key={idx}
                      className={styles.presetCard}
                      onClick={() => handleSend(preset.query)}
                    >
                      <span className={styles.presetTitle}>
                        <span>📌</span> {preset.title}
                      </span>
                      <span className={styles.presetDesc}>{preset.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Stream */
              messages.map((msg, index) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={index}
                    className={`${styles.chat} ${isUser ? styles.chatUser : styles.chatBot}`}
                  >
                    {!isUser && (
                      <img className={styles.chatImg} src={gptImgLogo} alt="AI Assistant" />
                    )}

                    <div className={isUser ? styles.userBubble : styles.botBubble}>
                      {renderMessageContent(msg.text)}

                      {!isUser && (
                        <div className={styles.bubbleFooter}>
                          <span className={styles.verifiedBadge}>Verified Statutory Synthesis</span>
                          <button
                            className={styles.copyBtn}
                            onClick={() => handleCopy(msg.text, index)}
                          >
                            {copiedIndex === index ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <img className={styles.chatImg} src={userIcon} alt="User" />
                    )}
                  </div>
                );
              })
            )}

            {/* Thinking / Researching indicator */}
            {loading && (
              <div className={`${styles.chat} ${styles.chatBot}`}>
                <img className={styles.chatImg} src={gptImgLogo} alt="AI Assistant" />
                <div className={`${styles.botBubble} ${styles.loadingBox}`}>
                  <div className={styles.pulseDot} />
                  <span className={styles.loadingText}>
                    Researching Indian statutes, provisions & judicial precedents...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <footer className={styles.chatFooter}>
            <div className={styles.inp}>
              <textarea
                ref={textareaRef}
                placeholder="Ask any question about Indian law or legal procedures... (Press Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className={styles.send}
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Send query"
              >
                <img src={sendBtn} alt="Send" />
              </button>
            </div>

            <p className={styles.disclaimer}>
              LegalSmiths AI provides informational legal research and statutory synthesis. It does not
              constitute formal legal representation. Always verify with a certified advocate.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default LegalAssistant;
