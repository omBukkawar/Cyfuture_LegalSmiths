import React, { useState } from "react";
import "../styles/casePrediction.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const CasePrediction = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please choose a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setMessage("");

      const res = await axios.post("http://localhost:5000/upload-case", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "File uploaded successfully: " + res.data.doc.originalName);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Try again.");
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
        <Link to="/" className="brand">LegalSmiths</Link>
        <Link to="/login" className="login-link">Logout</Link>
      </div>

      <div className="case-container">
        <h1 className="title">Case Predictor</h1>
        <p className="description">
          Upload your case document for AI-based analysis.
        </p>

        <hr />

        {/* Upload Section */}

        <hr className="hr" />

        <div className="upload-section">
          <div
            className="file-drop"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <p>
              Drag & Drop or <span style={{ color: "blue", cursor: "pointer" }}>Choose a File</span>
            </p>
            <p className="supported-formats">Supported formats: .pdf, .docx, .txt</p>
            <input
              id="fileInput"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {message && <p className="progress-info">{message}</p>}
        </div>

        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default CasePrediction;
