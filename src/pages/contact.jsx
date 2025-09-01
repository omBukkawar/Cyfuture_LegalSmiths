import React from "react";
import { Link } from "react-router-dom";
import "../styles/contact.css";
import Footer from "../components/Footer";

const Contact = () => {
  return (
    <div className="contact">
      <div className="top-bar">
              <Link to="/" className="brand">
                LegalSmiths
              </Link>
              <Link to="/login" className="login-link">
                Login
              </Link>
            </div>

      <section className="forms">
        <h1>Contact LegalSmiths</h1>
        <p>Connect with us for AI-powered legal analysis and advice.</p>

        <form className="inputFields">
          <label htmlFor="name">Name*</label>
          <input type="text" id="name" placeholder="Name..." />

          <label htmlFor="email">Email Address*</label>
          <input type="email" id="email" placeholder="Email Address..." />

          <label htmlFor="question">Your Question*</label>
          <textarea id="question" placeholder="Your Question..." />

          <div className="privacy">
            <input type="checkbox" id="privacy" />
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
