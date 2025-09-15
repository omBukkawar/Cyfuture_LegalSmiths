import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import highRisk from "../assets/risk-graph.webp";

const contractAnalyzer = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([])
  
    useEffect(() => {
      fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(json => setCards(json))
    }, [])

  // File handling
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Tabs
  const [selectedTab, setSelectedTab] = useState("keyTerms");

  const getColor = () => {
    if (selectedTab === "redFlags") return "red";
    if (selectedTab === "mistakes") return "orange";
    return "inherit";
  };

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      [".pdf", ".docx", ".doc", ".txt"].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      handleFileUpload(e.dataTransfer.files[0]); // auto upload first file
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      handleFileUpload(e.target.files[0]);
    }
  };

  // Backend upload
  const handleFileUpload = async (selectedFile) => {
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
        <hr className="hr" />

        {/* Upload Section */}
        <div className="upload-section">
          <div
            className={`file-drop ${isDragging ? "dragging" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <p>
              Drag & Drop or <span className="choose-file">Choose a File</span>
            </p>
            <p className="supported-formats">
              Supported formats: .pdf, .docx, .txt
            </p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Show uploaded files */}
          {files.length > 0 && (
            <div className="uploaded-files">
              <h4>Uploaded Files:</h4>
              <ul>
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload status */}
          {uploading && (
            <div className="progress-bar">
              <div className="progress"></div>
              <div className="progress-text">Uploading...</div>
            </div>
          )}
          {message && <p className="progress-info">{message}</p>}
        </div>

        {/* Report */}
        <h2 className="section-title">Analysis Report</h2>
        <div className="report">
          <div className="component grid-summary">
            <h2>Summary</h2>
            {cards.slice(5,10).map((card,index) => (
                <span className="key">           
                  {card.description}
                </span>
              ))}
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
          <hr className="hr1" />

          <div style={{ color: getColor() }}>
            {selectedTab === "keyTerms" && (
              <>
                {cards.slice(0,5).map((card,index) => (
                <div key={card.id} className="component keyTerms">
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              ))}
              </>
            )}

            {selectedTab === "redFlags" && (
              <>
                {cards.slice(0,5).map((card,index) => (
                <div key={card.id} className="component keyTerms">
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              ))}
              </>
            )}

            {selectedTab === "mistakes" && (
              <>
                {cards.slice(0,5).map((card,index) => (
                <div key={card.id} className="component keyTerms">
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </div>
              ))}
              </>
            )}
          </div>
        </div>

        <h2 className="ques">Was this analysis helpful?</h2>
        <div className="feedback">
          <div className="like"></div>
          <textarea placeholder="Enter your suggestions"></textarea>
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

export default contractAnalyzer;