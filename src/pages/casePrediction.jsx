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
  const [caseinput, setCaseInput] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const getfromFastAPI = async () => {
    try {
      setIsLoading(true);
      
      if (!caseinput.trim()) {
        alert("Please enter case details first!");
        return;
      }
      
      const response = await axios.post(
        "https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction",
        {
          questions: [caseinput]
        },
        { headers: { "Content-Type": "application/json" } }
      );
      
      const json_data = response.data;
      console.log("Json data:", json_data);
      console.log("First answer:", json_data.answers[0]);
      setPredictionResult(json_data.answers[0]);
      
      //Optional
     /* const blob = new Blob([JSON.stringify(json_data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "caseoutcomeprediction.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);*/
    } catch (error) {
      console.error("Error:", error);
     alert("Failed to analyze case. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Results view when prediction is available
  if (predictionResult) {
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
          <h1 className="title">Case Analysis Results</h1>
          
          <div style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '20px', 
            borderRadius: '8px',
            margin: '20px 0',
            maxHeight: '70vh',
            overflowY: 'auto',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <div style={{ marginBottom: '30px' }}>
              {/* Title Section */}
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '2px solid #3498db'
              }}>
                <h2 style={{ color: '#2c3e50', margin: '0', textAlign: 'center', fontSize: '18px', fontWeight: 'normal', fontFamily: 'inherit' }}>
                  {predictionResult.title || "Legal Case Analysis"}
                </h2>
              </div>

              {/* Case Parties */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1, padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <h4 style={{ color: '#2c3e50', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal', fontFamily: 'inherit' }}>Petitioner</h4>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }}>{predictionResult.petitioner || 'Not specified'}</p>
                </div>
                <div style={{ flex: 1, padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #ddd' }}>
                  <h4 style={{ color: '#2c3e50', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal', fontFamily: 'inherit' }}>Respondent</h4>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit' }}>{predictionResult.respondent || 'Not specified'}</p>
                </div>
              </div>

            
              {/* Display all available fields dynamically */}
              {Object.keys(predictionResult).map((key) => {
                // Skip already displayed fields
                if (['title', 'petitioner', 'respondent', 'success_probability', 'SuccessProbability'].includes(key)) {
                  return null;
                }

                const value = predictionResult[key];
                if (!value) return null;

                // Handle objects that are showing as [object Object]
                let displayValue;
                if (Array.isArray(value)) {
                  // Handle array of objects (like Legal Precedents)
                  displayValue = value.map((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                      // For objects, try to extract meaningful fields or format nicely
                      const objStr = Object.entries(item)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n');
                      return `${index + 1}. ${objStr}`;
                    }
                    return `${index + 1}. ${String(item)}`;
                  }).join('\n\n');
                } else if (typeof value === 'object' && value !== null) {
                  // If it's a single object, try to stringify it nicely or extract meaningful content
                  displayValue = Object.entries(value)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n');
                } else {
                  displayValue = String(value);
                }

                // Skip empty or meaningless values
                if (!displayValue || displayValue === '{}' || displayValue === '[]') {
                  return null;
                }

                // Format the key for display - handle both camelCase and snake_case
                const displayKey = key
                  .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                  .replace(/_/g, ' ') // Replace underscores with spaces
                  .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
                  .trim();

                // Different styling based on content type
                let borderColor = '#ddd';
                let headerColor = '#2c3e50';
                let borderWidth = '1px';

                if (key.toLowerCase().includes('strong') || key.toLowerCase().includes('advantage')) {
                  borderColor = '#27ae60';
                  headerColor = '#27ae60';
                  borderWidth = '2px';
                } else if (key.toLowerCase().includes('weak') || key.toLowerCase().includes('risk') || key.toLowerCase().includes('penalt')) {
                  borderColor = '#e74c3c';
                  headerColor = '#e74c3c';
                  borderWidth = '2px';
                } else if (key.toLowerCase().includes('advisory') || key.toLowerCase().includes('recommendation') || key.toLowerCase().includes('final')) {
                  borderColor = '#8e44ad';
                  headerColor = '#8e44ad';
                  borderWidth = '3px';
                } else if (key.toLowerCase().includes('precedent') || key.toLowerCase().includes('case') || key.toLowerCase().includes('legal')) {
                  borderColor = '#3498db';
                  headerColor = '#3498db';
                  borderWidth = '2px';
                } else if (key.toLowerCase().includes('outcome') || key.toLowerCase().includes('likely')) {
                  borderColor = '#f39c12';
                  headerColor = '#f39c12';
                  borderWidth = '2px';
                } else if (key.toLowerCase().includes('strateg')) {
                  borderColor = '#17a2b8';
                  headerColor = '#17a2b8';
                  borderWidth = '2px';
                }

                return (
                  <div key={key} style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    borderRadius: '5px', 
                    border: `${borderWidth} solid ${borderColor}` 
                  }}>
                    <h4 style={{ color: headerColor, margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'normal', fontFamily: 'inherit' }}>{displayKey}</h4>
                    <div style={{ 
                      lineHeight: '1.6', 
                      color: '#555', 
                      whiteSpace: 'pre-line',
                      fontFamily: 'inherit',
                      fontSize: '14px'
                    }}>
                      {displayValue}
                    </div>
                  </div>
                );
              })}

              {/* Fallback for raw JSON display if structured data is not available */}
              {!predictionResult.title && !predictionResult.likely_outcome && (
                <div>
                  <h3 style={{ color: '#2c3e50', marginBottom: '10px', fontFamily: 'inherit', fontSize: '18px', fontWeight: '600' }}>Analysis Result:</h3>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '5px',
                    lineHeight: '1.6',
                    color: '#2c3e50',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}>
                    {JSON.stringify(predictionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <button className="back-btn" onClick={() => navigate(-1)}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Input form view when no prediction result
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
          Enter your case details for AI-based analysis.
        </p>
        <br />
        
        <textarea 
          id="caseinput" 
          value={caseinput} 
          onChange={(e) => setCaseInput(e.target.value)} 
          placeholder="Please enter case details" 
          style={{
            backgroundColor: "#f0f0f0",
            width: "100%",
            height: "200px",
            borderRadius: "5px",
            border: "1px solid #ccc",
            padding: "10px"
          }}
        />
        
        <div className="upload-section">
          {message && <p className="progress-info">{message}</p>}
        </div>
        
        <button 
          className="analyze-btn" 
          onClick={getfromFastAPI}
          disabled={isLoading || !caseinput.trim()}
          style={{
            opacity: (isLoading || !caseinput.trim()) ? 0.6 : 1,
            cursor: (isLoading || !caseinput.trim()) ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? "Analyzing Case..." : "Predict Case Outcome"}
        </button>
        <br />
        <br />
        
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
};

export default CasePrediction;