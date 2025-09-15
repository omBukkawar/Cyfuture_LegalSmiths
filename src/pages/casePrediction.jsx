import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import "../styles/casePrediction.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";

const CasePrediction = () => {
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

  // Sample Data
  const [showCases, setShowCases] = useState(false);

  // Handle valid files
  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      [".pdf", ".docx", ".doc", ".txt"].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  // Drag & Drop Handlers
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

  // File Input Change
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
      handleFileUpload(e.target.files[0]);
    }
  };

  // Upload to backend
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post("http://localhost:5000/upload-case", formData, {
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
    <div className="case-prediction" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <div className="top-bar">
        <Link to="/" className="brand">LegalSmiths</Link>
        <Link to="/login" className="login-link">Logout</Link>
      </div>

      <div className="case-container">
        <h1 className="title">Case Predictor</h1>
        <p className="description">
          Leverage AI to forecast your winning probability, uncover red flags with explanations,
          and receive data-driven strategy suggestions.
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
            <p>Drag & Drop or <span className="choose-file">Choose a File</span></p>
            <p className="supported-formats">Supported formats: .pdf, .docx, .txt</p>
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

        {/* Case Report */}
        <h2 className="section-title">Case Prediction Report</h2>
        <div className="grid-layout">
          <div className="grid-item grid-win">
            <h2>Winning Probability</h2>
            <div className="winning-chart">
              <span className="percentage">77%</span>
            </div>
            <pre className="key">Case Timeline 18-24 Months</pre>
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
            <h2>Likely Outcome</h2>
            {cards.slice(12,14).map((card,index) => (
                <ul>
                    <li>{card.description}</li>  
                </ul>
              ))}
          </div>

          <div className="grid-item grid-strategies">
            <h2>Strategy Suggestions</h2>
            {cards.slice(7,9).map((card,index) => (
                <ul>
                    <li>{card.description}</li>  
                </ul>
              ))}
          </div>

          <div className="grid-item grid-red">
            <h2>Detected Red Flags</h2>
            {cards.slice(7,9).map((card,index) => (
                <ul>
                    <li>{card.description}</li>  
                </ul>
              ))}
          </div>

          <div className="grid-item grid-feedback">
            <h2>Final Feedback</h2>
             {cards.slice(12,13).map((card,index) => (
                <p> {card.description}</p>  
                
              ))}
          </div>
        </div>

        {/* Similar Cases */}
        <div className="previous-cases">
          <span className="see-cases" onClick={() => setShowCases(!showCases)}>
            See similar cases
          </span>
          {showCases && (

            <div className="cases-list">
              {cards.slice(0,5).map((card,index) => (
                <div key={card.id} className="case-tag">
                  <p>[case{index+1}] {card.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback */}
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