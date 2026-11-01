import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/contact.css";
import Footer from "../components/Footer";
import { isAuthenticated, logout } from "../utils/auth";

const Contact = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(() => isAuthenticated());
  const [formData, setFormData] = useState({ name: "", email: "", question: "", agreed: false });

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Please agree to the privacy policy before submitting.");
      return;
    }
    setSubmitted(true);
    alert("Thank you! Your inquiry has been received. Our legal team will get in touch shortly.");
    setFormData({ name: "", email: "", question: "", agreed: false });
  };

  return (
    <div className="contact">
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {loggedIn ? (
            <>
              <Link to="/services" className="login-link">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="login-link"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
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
      </div>

      <section className="forms">
        <h1>Contact LegalSmiths</h1>
        <p>Connect with us for AI-powered legal analysis and advice.</p>

        {submitted && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "16px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "6px",
              border: "1px solid #c3e6cb",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Thank you! Your inquiry has been received. Our legal team will get in touch shortly.
          </div>
        )}

        <form className="inputFields" onSubmit={handleSubmit}>
          <label htmlFor="name">Name*</label>
          <input
            type="text"
            id="name"
            placeholder="Name..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <label htmlFor="email">Email Address*</label>
          <input
            type="email"
            id="email"
            placeholder="Email Address..."
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <label htmlFor="question">Your Question*</label>
          <textarea
            id="question"
            placeholder="Your Question..."
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
          />

          <div className="privacy">
            <input
              type="checkbox"
              id="privacy"
              checked={formData.agreed}
              onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
              required
            />
            <label htmlFor="privacy">I agree to the privacy policy</label>
          </div>

          <button type="submit">Submit</button>
        </form>
      </section>

      <section className="questions">
        <h3>FAQs</h3>
        <hr />
        <div>
          <h4>Why choose LegalSmiths for legal analysis?</h4>
          <p>LegalSmiths offers AI-powered solutions for accessible legal advice and analysis, ensuring accurate and informed decisions.</p>
        </div>
        <hr />
        <div>
          <h4>How can I access the AI Legal Assistant?</h4>
          <p>Register or login to LegalSmiths to access the AI Legal Assistant for instant legal answers.</p>
        </div>
        <hr />
        <div>
          <h4>Can I upload multiple case documents for analysis?</h4>
          <p>Yes, you can upload multiple case documents for analysis using the Case Outcome Prediction tool.</p>
        </div>
      </section>
      <button className="back" onClick={() => navigate(-1)}>Back</button>
      <Footer />
    </div>
  );
};

export default Contact;
