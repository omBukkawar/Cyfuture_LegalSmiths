import React, { useState } from "react";
import axios from "axios";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import highRisk from "../assets/risk-graph.webp";

const CasePrediction = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post("http://localhost:5000/upload-contract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "File uploaded successfully");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    } finally {
      setUploading(false);
    }
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
          <div
            className="file-drop"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p>
              Drag & Drop or <span style={{ color: "blue", cursor: "pointer" }}>Choose a File</span>
            </p>
            <p className="supported-formats">
              Supported formats: .pdf, .docx, .txt
            </p>
            <input
              id="fileInput"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {uploading && (
            <div className="progress-bar">
              <div className="progress"></div>
              <div className="progress-text">Uploading...</div>
            </div>
          )}

          {message && <p className="progress-info">{message}</p>}
        </div>

        {/* keep your existing analysis report here */}
        <h2 className="section-title">Analysis Report</h2>
        {/* ... */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

export default CasePrediction;
