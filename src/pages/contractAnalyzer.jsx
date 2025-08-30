import React from "react";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import highRisk from "../assets/risk-graph.webp";

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
        <h1 className="title">Smart Contract Analyzer</h1>
        <p className="description">
          Leverage AI to forecast your winning probability, uncover red flags with explanations, 
          and receive data-driven strategy suggestions.
        </p>
        <hr />
        <div className="upload-section">
          <div className="file-drop">
            <p>Drag & Drop or <a href="#">Choose a File</a></p>
            <p className="supported-formats">Supported formats: .pdf, .docx, .txt</p>
          </div>
          <div className="progress-bar">
            <div className="progress"></div>
            <div className="progress-text">100%...done</div>
          </div>
          <p className="progress-info">
            The analysis is taking longer than expected. You will be emailed when the report is ready.
          </p>
        </div>

        <h2 className="section-title">Analysis Report</h2>

        <div className="report">
          <div className="component grid-summary">
            <h2>Summary</h2>
            <p className="key">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. Phasellus consequat rutrum leo eu vulputate. Sed sed turpis mollis, accumsan dui in, ornare nulla. Pellentesque at rhoncus ex. Etiam at massa vehicula, fermentum mauris id, lacinia tortor. Proin ut porttitor enim. Aliquam nec auctor ex. Donec odio nisl, volutpat sed tortor sit amet, luctus pretium orci. Nulla vel justo nec eros tempor porttitor imperdiet nec felis. Phasellus ornare maximus tortor ut vehicula. Curabitur nec nibh sed diam placerat mattis. Nulla ac orci aliquam, congue lectus nec, bibendum lacus. Nulla sollicitudin nisi dolor, sed lacinia est interdum vel.</p>
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
          <h3>Key Terms</h3>
          <span className="select"></span>
          <h3>Red Flags</h3>
          <span className="select"></span>
          <h3>Mistakes</h3>
          <span className="select"></span>
        </div>
        <hr />
          <div className="component keyTerms">
            <h2>Exclusive License</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. </p>
          </div>

          <div className="component keyTerms">
            <h2>Exclusive License</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. </p>
          </div>

          <div className="component keyTerms">
            <h2>Exclusive License</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies, urna et semper viverra, sem metus suscipit justo, ac tincidunt nunc enim sit amet justo. Donec ac euismod lectus, vitae venenatis sem. Praesent ut nisl risus. </p>
          </div>
        </div>

        <h2 className="ques">Was this analysis helpful?</h2>
        <div className="feedback">
          <div className="like">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-840h440v520L400-40l-50-50q-7-7-11.5-19t-4.5-23v-14l44-174H120q-32 0-56-24t-24-56v-80q0-7 2-15t4-15l120-282q9-20 30-34t44-14Zm360 80H240L120-480v80h360l-54 220 174-174v-406Zm0 406v-406 406Zm80 34v-80h120v-360H680v-80h200v520H680Z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
          </div>
          <textarea placeholder="Enter your suggestions"></textarea>
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default CasePrediction;
