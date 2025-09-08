import React from "react";
import "../styles/casePrediction.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";

const CasePrediction = () => {
  const navigate=useNavigate();
  return (
    <div className="case-prediction" style={{ backgroundImage: `url(${backgroundImg})` }}>
     <div className="top-bar">
            <Link to="/" className="brand">
              LegalSmiths
            </Link>
            <Link to="/login" className="login-link">
              Logout
            </Link>
          </div>
          
      <div className="case-container">
        <h1 className="title">Case Predictor</h1>
        <p className="description">
          Leverage AI to forecast your winning probability, uncover red flags with explanations, 
          and receive data-driven strategy suggestions.
        </p>
        <hr className="hr" />
        <div className="upload-section">
          <div className="file-drop">
            <p>Drag & Drop or <a href="#">Choose a File</a></p>
            <p className="supported-formats">Supported formats: .pdf, .docx, .txt</p>
          </div>
          <div className="progress-bar">
            <div className="progress" style={{ width: "100%" }}></div>
            <div className="progress-text">100%...done</div>
          </div>
          <p className="progress-info">
            The analysis is taking longer than expected. You will be emailed when the report is ready.
          </p>
        </div>

        <h2 className="section-title">Case Prediction Report</h2>

        <div className="grid-layout">
          <div className="grid-item grid-win">
            <h2>Winning Probability</h2>
            <div className="winning-chart">
              <span className="percentage">77%</span>
            </div>
            <pre className="key">Case Timeline        18-24 Months</pre>
          </div>

          <div className="grid-item grid-case-type">
            <h2>Case Type</h2>
            <p className="key">Contract Dispute</p>
          </div>

          <div className="grid-item grid-court">
            <h2>Suggested Court</h2>
            <p className="key">Superior Court</p>
          </div>

          <div className="grid-item grid-sentiment">
            <h2>Sentiment</h2>
            <p className="key">Positive</p>
          </div>

          <div className="grid-item grid-reasons">
            <h2>Key Reasons Influencing Prediction</h2>
            <ul>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et .</li>
              <li>semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo.</li>
              <li>Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. Phasellus consequat rutrum leo eu vulputate. Se</li>
            </ul>
          </div>

          <div className="grid-item grid-strategies">
            <h2>Strategy Suggestions</h2>
            <ul>
              <li>semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. </li>
              <li>Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. Phasellus consequat rutrum leo eu vulputate. Se</li>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et </li>
              <li>semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. </li>
              <li>Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. Phasellus consequat rutrum leo eu vulputate. Se</li>
            </ul>
          </div>

          <div className="grid-item grid-red">
            <h2>Detected Red Flags</h2>
            <ul>
              <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et semper viverra,</li>
              <li>sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. Donec ac euismod lectus, vitae venenatis </li>
            </ul>
          </div>
        </div>

        <div className="feedback-section">
          <label>Rate prediction accuracy</label>
          <textarea placeholder="Enter your suggestions"></textarea>
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default CasePrediction;
