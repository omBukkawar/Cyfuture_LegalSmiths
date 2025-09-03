import React, { useState } from "react";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import highRisk from "../assets/risk-graph.webp";

const CasePrediction = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("keyTerms"); // 'keyTerms', 'redFlags', 'mistakes'

  // Function to get color based on selection
  const getColor = () => {
    if (selectedTab === "redFlags") return "red";
    if (selectedTab === "mistakes") return "orange";
    return "inherit";
  };

  return (
    <div
      className="case-prediction"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <Link to="/login" className="login-link">
          Logout
        </Link>
      </div>

      <div className="case-container">
        <h1 className="title">Smart Contract Analyzer</h1>
        <p className="description">
          Leverage AI to forecast your winning probability, uncover red flags
          with explanations, and receive data-driven strategy suggestions.
        </p>
        <hr />
        <div className="upload-section">
          <div className="file-drop">
            <p>
              Drag & Drop or <a href="#">Choose a File</a>
            </p>
            <p className="supported-formats">
              Supported formats: .pdf, .docx, .txt
            </p>
          </div>
          <div className="progress-bar">
            <div className="progress"></div>
            <div className="progress-text">100%...done</div>
          </div>
          <p className="progress-info">
            The analysis is taking longer than expected. You will be emailed
            when the report is ready.
          </p>
        </div>

        <h2 className="section-title">Analysis Report</h2>

        <div className="report">
          <div className="component grid-summary">
            <h2>Summary</h2>
            <p className="key">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
              ultricies, urna et semper viverra, sem metus suscipit justo, ac
              tincidunt nunc enim sit amet justo.
            </p>
          </div>

          <div className="quickies">
            <div className="component riskScore">
              <h2>Risk Score</h2>
              <div className="risk-chart">
                <img className="value" src={highRisk} alt="Risk Chart" />
              </div>
            </div>
            <div className="component flagsFound">
              <h2>Red Flags Found</h2>
              <div className="value">5</div>
            </div>

            <div className="component mistakes">
              <h2>Mistakes Detected</h2>
              <div className="value">3</div>
            </div>
          </div>

          <div className="points">
            <h3
              className={selectedTab === "keyTerms" ? "active-tab" : ""}
              onClick={() => setSelectedTab("keyTerms")}
            >
              Key Terms
            </h3>
            <h3
              className={selectedTab === "redFlags" ? "active-tab" : ""}
              onClick={() => setSelectedTab("redFlags")}
            >
              Red Flags
            </h3>
            <h3
              className={selectedTab === "mistakes" ? "active-tab" : ""}
              onClick={() => setSelectedTab("mistakes")}
            >
              Mistakes
            </h3>
          </div>
          <hr />

          {/* Conditional Rendering of Components */}
          <div style={{ color: getColor() }}>
            {selectedTab === "keyTerms" && (
              <>
                <div className="component keyTerms">
                  <h2>Exclusive License</h2>
                  <p>Key term details go here.</p>
                </div>
                <div className="component keyTerms">
                  <h2>Non-Compete Clause</h2>
                  <p>Key term details go here.</p>
                </div>
                <div className="component keyTerms">
                  <h2>Termination Policy</h2>
                  <p>Key term details go here.</p>
                </div>
              </>
            )}

            {selectedTab === "redFlags" && (
              <>
                <div className="component redFlags">
                  <h2>Payment Delay Risk</h2>
                  <p>This clause may cause delayed payments.</p>
                </div>
                <div className="component redFlags">
                  <h2>Ambiguous Liability</h2>
                  <p>Ambiguous responsibility clauses found.</p>
                </div>
                <div className="component redFlags">
                  <h2>Unilateral Termination</h2>
                  <p>Only one party has termination rights.</p>
                </div>
              </>
            )}

            {selectedTab === "mistakes" && (
              <>
                <div className="component mistakes">
                  <h2>Grammar Error</h2>
                  <p>Typographical issue found in clause 2.</p>
                </div>
                <div className="component mistakes">
                  <h2>Incorrect Reference</h2>
                  <p>Clause refers to a non-existent section.</p>
                </div>
                <div className="component mistakes">
                  <h2>Redundant Clause</h2>
                  <p>Duplicated section detected.</p>
                </div>
              </>
            )}
          </div>
        </div>

        <h2 className="ques">Was this analysis helpful?</h2>
        <div className="feedback">
          <div className="like">
            {/* Like/Dislike SVGs */}
          </div>
          <textarea placeholder="Enter your suggestions"></textarea>
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

export default CasePrediction;
