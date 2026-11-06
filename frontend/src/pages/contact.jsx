import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/contact.css";
import Footer from "../components/Footer";
import { isAuthenticated, logout } from "../utils/auth";

const FAQ_LIST = [
  {
    q: "Why choose LegalSmiths for legal analysis?",
    a: "LegalSmiths combines automated legal research with strict statutory verification, helping advocates, researchers, and citizens evaluate Indian legal provisions and court precedents quickly and reliably.",
  },
  {
    q: "How can I access the AI Legal Assistant?",
    a: "Log in or register on LegalSmiths to access the AI Legal Assistant. You can ask queries regarding BNS, BNSS, Indian Contract Act, RERA, and consumer dispute resolution.",
  },
  {
    q: "Can I upload multiple case documents for prediction?",
    a: "Yes, you can upload multiple case pleadings, FIR copies, or trial judgments using the Case Outcome Prediction tool to compute dispute probabilities and statutory risk scores.",
  },
  {
    q: "How does the Smart Contract Analyzer protect against risks?",
    a: "It parses contracts across key liability clauses—such as uncapped indemnities, IP assignment, dispute resolution, and non-compete terms—to flag operational and financial red flags.",
  },
];

const Contact = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [formData, setFormData] = useState({ name: "", email: "", question: "", agreed: false });

  const handleLogout = () => {
    logout(navigate);
    setLoggedIn(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Please agree to the privacy policy before submitting.");
      return;
    }
    setSubmitted(true);
    setFormData({ name: "", email: "", question: "", agreed: false });
  };

  return (
    <div className="contact">
      {/* -------------------------------------------------------------
          TOP BAR NAVIGATION
         ------------------------------------------------------------- */}
      <nav className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            className="login-link"
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Go back"
          >
            ← Back
          </button>
          <Link to="/" className="brand">
            ⚖️ LegalSmiths
          </Link>
        </div>
        <div className="nav-links">
          {loggedIn ? (
            <>
              <Link to="/services" className="login-link">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="login-link"
                style={{
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-link">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* -------------------------------------------------------------
          HERO BANNER
         ------------------------------------------------------------- */}
      <header className="contact-hero">
        <div className="hero-content">
          <h1>Contact LegalSmiths</h1>
          <p>
            Connect with our team for inquiries, enterprise AI legal solutions,
            technical partnerships, or client assistance.
          </p>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN CONTACT CONTAINER (Info + Form)
         ------------------------------------------------------------- */}
      <main className="contact-container">
        {/* Left Column: Direct Contact Info (Dummy) */}
        <div className="contact-info-panel">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <div className="info-text">
              <h3>Office</h3>
              <p>
                123 Legal Avenue, Suite 100
                <br />
                City, State 00000
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">✉️</div>
            <div className="info-text">
              <h3>Email</h3>
              <p>
                General: <a href="mailto:info@example.com">info@example.com</a>
                <br />
                Support: <a href="mailto:support@example.com">support@example.com</a>
              </p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📞</div>
            <div className="info-text">
              <h3>Phone</h3>
              <p>
                +1 (555) 000-0000
                <br />
                <span style={{ fontSize: "0.8rem", color: "#888" }}>
                  Monday – Friday: 9:00 AM – 5:00 PM
                </span>
              </p>
            </div>
          </div>

          <div className="support-highlight-card">
            <h3>Need Instant Statutory Advice?</h3>
            <p>
              Our automated AI Legal Assistant is available 24/7 to analyze Indian
              legal provisions, court precedents, and rights under BNS/BNSS.
            </p>
            <button
              className="assistant-btn"
              onClick={() => navigate("/legalAssistant")}
            >
              <span>⚖️</span> Launch Legal Assistant
            </button>
          </div>
        </div>

        {/* Right Column: Contact Inquiry Form */}
        <div className="form-card">
          <div className="form-header">
            <h2>Send Us a Message</h2>
            <p>Fill out the form below and our team will get back to you within 24 hours.</p>
          </div>

          {submitted && (
            <div className="success-alert">
              <span>✓</span> Thank you! Your inquiry has been received. Our team will get in touch shortly.
            </div>
          )}

          <form className="inputFields" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Full Name*</label>
              <input
                type="text"
                id="name"
                placeholder="Your name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="question">Your Inquiry or Question*</label>
              <textarea
                id="question"
                placeholder="Your message or inquiry..."
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            <div className="privacy-check">
              <input
                type="checkbox"
                id="privacy"
                checked={formData.agreed}
                onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                required
              />
              <label htmlFor="privacy">
                I agree to the LegalSmiths Privacy Policy and Terms of Service.
              </label>
            </div>

            <button type="submit" className="submit-btn">
              Submit Inquiry →
            </button>
          </form>
        </div>
      </main>

      {/* -------------------------------------------------------------
          FAQS SECTION
         ------------------------------------------------------------- */}
      <section className="questions-section">
        <h2>Frequently Asked Questions</h2>
        <p className="faq-subtitle">
          Everything you need to know about LegalSmiths AI legal services.
        </p>

        <div className="faq-grid">
          {FAQ_LIST.map((faq, idx) => (
            <div key={idx} className="faq-card">
              <h4>
                <span>⚖️</span> {faq.q}
              </h4>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          BOTTOM ACTION
         ------------------------------------------------------------- */}
      <div className="bottom-actions">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {/* -------------------------------------------------------------
          FOOTER
         ------------------------------------------------------------- */}
      <Footer />
    </div>
  );
};

export default Contact;
