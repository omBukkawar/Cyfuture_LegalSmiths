import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import Footer from "../components/Footer";
import "../styles/services.css";

import img1 from "../assets/services_img1.jpg";
import img2 from "../assets/services_img2.jpg";
import img3 from "../assets/services_img3.webp";
import img4 from "../assets/services_img4.jpeg";


const Services = () => {
  const navigate = useNavigate();
  return (
    <div className="services">
        
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <Link to="/login" className="login-link">
          Logout
        </Link>
      </div>
      <main>

      <section className="intro">
        <h1>AI Legal Solutions</h1>
        <p className="intro_text">
          LegalSmiths offers AI Legal Assistant for legal queries, Case Outcome Prediction for predicting case results, and Smart Contract Analyzer for contract analysis.
        </p>
        <img src={img1} alt="Legal services overview" />
        
      </section>

      <div className="container">
        <p className="cont_text">
          LegalSmiths provides AI Legal Assistant, Case Outcome Prediction, and
          Smart Contract Analyzer services to offer accessible legal advice,
          informed decision-making, and error-free contract analysis.
        </p>
        <div className="cards">
          <img src={img2} alt="AI Legal Assistant" />
          <h3>AI Legal Assistant</h3>
          <p>
            The AI Legal Assistant provides instant answers to legal queries,
            enhancing accessibility and convenience for users.
          </p>
          <button onClick={() => navigate("/legalAssistant")}>AI Legal Assistant</button>
        </div>

        <div className="cards">
          <img src={img3} alt="Case Outcome Prediction" />
          <h3>Case Outcome Prediction</h3>
          <p>
            Predict case outcomes, identify risks, and view related cases to
            make informed decisions with the Case Outcome Prediction tool.
          </p>
          <button onClick={() => navigate("/casePrediction")}>Case Outcome Prediction</button>
        </div>

        <div className="cards">
          <img src={img4} alt="Smart Contract Analyzer" />
          <h3>Smart Contract Analyzer</h3>
          <p>
            Analyze contracts for errors, red flags, and risks to ensure legal
            documents are accurate and compliant with the Smart Contract
            Analyzer.
          </p>
          <button onClick={() => navigate("/contractAnalyzer")}>Smart Contract Analyzer</button>
        </div>
      </div>

      <Link to="/contact">
        <button className="contact-btn">Contact Us</button>
      </Link>

      </main>
      <Footer />
    </div>
  );
};

export default Services;
