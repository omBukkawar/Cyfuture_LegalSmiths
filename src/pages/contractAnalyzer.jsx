import axios from "axios";
import React, { useState, useRef } from "react";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";


const ContractAnalyzer = () => {
  const navigate = useNavigate();

  // File handling
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Tabs
  const [selectedTab, setSelectedTab] = useState("keyTerms");

  // Analysis data (from FastAPI response)
  const [analysis, setAnalysis] = useState(null);

  // FastAPI integration
  const analyzeWithFastAPI = async (files) => {
    // METHOD 1: Use FastAPI Backend (UNCOMMENT TO USE)
    
    if (files.length === 0) {
      setMessage("Please upload at least one file before analyzing.");
      return;
    }

    setAnalyzing(true);
    const formdata = new FormData();
    formdata.append("request", "Please analyze this contract for me.");
    files.forEach((file) => {
      formdata.append("files", file);
    });

    try {
      const response = await axios.post(
        "https://monocable-dollishly-joannie.ngrok-free.app/contractanalyzer",
        formdata,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const json_data = response.data;
      console.log("Json data:", json_data);

      if (json_data.answers && json_data.answers.length > 0) {
        setAnalysis(json_data.answers[0]);
        setMessage("Analysis completed successfully!");
      } else {
        setMessage("No analysis data received from the server.");
      }

      // (Optional) still download the result as file
      const blob = new Blob([JSON.stringify(json_data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contract_analysis.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
    

    // METHOD 2: Use Local JSON File for Testing (COMMENT OUT WHEN USING FASTAPI)
    // setAnalyzing(true);
    // try {
    //   // Simulate API delay for realistic testing
    //   await new Promise(resolve => setTimeout(resolve, 2000));
      
    //   // Fetch the local JSON file from public folder
    //   const response = await fetch('/contract_analysis.json');
    //   if (!response.ok) {
    //     throw new Error('Failed to load test data');
    //   }
      
    //   const json_data = await response.json();
    //   console.log("Local Json data:", json_data);

    //   if (json_data.answers && json_data.answers.length > 0) {
    //     setAnalysis(json_data.answers[0]);
    //     setMessage("Analysis completed successfully! (Using test data)");
    //   } else {
    //     setMessage("No analysis data found in test file.");
    //   }

    //   // Optional: still download the result as file for testing
    //   const blob = new Blob([JSON.stringify(json_data, null, 2)], {
    //     type: "application/json",
    //   });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = "contract_analysis_test.json";
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // } catch (error) {
    //   console.error("Error loading test data:", error);
    //   setMessage("Failed to load test data. Make sure contract_analysis.json is in the public folder.");
    // } finally {
    //   setAnalyzing(false);
    // }
  };

  // File upload to backend
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(
        "http://localhost:5000/upload-contract",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setMessage(res.data.message || "File uploaded successfully");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // File utilities
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
      handleFileUpload(e.dataTransfer.files[0]);
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

  // UI Helpers
  const getColor = () => {
    if (selectedTab === "redFlags") return "red";
    if (selectedTab === "mistakes") return "orange";
    return "inherit";
  };

  // Helper function to render text with proper formatting
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Split by sentences and paragraphs, handle bold text
    return text.split('\n').map((paragraph, index) => (
      <p key={index} style={{ marginBottom: '10px' }}>
        {paragraph.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    ));
  };

  // Helper function to render array items
  const renderArrayItems = (items) => {
    if (!Array.isArray(items)) return null;
    
    return (
      <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            {typeof item === 'string' ? renderFormattedText(item) : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  };

  // Helper function to parse numbered points from text
  const parseNumberedPoints = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    // Split by numbered points (1. 2. 3. etc.)
    const points = text.split(/(?=\d+\.\s)/).filter(point => point.trim().length > 0);
    
    return points.map(point => {
      // Remove the number and clean up the text
      return point.replace(/^\d+\.\s*/, '').trim();
    }).filter(point => point.length > 0);
  };

  return (
    <div
      className="case-prediction"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      {/* Top Bar */}
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <Link to="/login" className="login-link">
          Logout
        </Link>
      </div>

      {/* Main Container */}
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

          {/* Analyze Button */}
          <button
            className="analyze-btn"
            onClick={() => analyzeWithFastAPI(files)}
            disabled={analyzing}
            // Remove file length check for testing with local file
            // disabled={analyzing || files.length === 0}
          >
            {analyzing ? "Analyzing..." : "Analyze Contract"}
          </button>

          {/* Upload/Analysis status */}
          {(uploading || analyzing) && (
            <div className="progress-bar">
              <div className="progress"></div>
              <div className="progress-text">
                {uploading ? "Uploading..." : "Analyzing..."}
              </div>
            </div>
          )}
          {message && <p className="progress-info">{message}</p>}
        </div>

        {/* Report */}
        <h2 className="section-title">Analysis Report</h2>
        <div className="report">
          {analysis ? (
            <>
              {/* Title Section */}
              {analysis.title && (
                <div className="component grid-summary">
                  <h2>Document Title</h2>
                  <p><strong>{analysis.title}</strong></p>
                </div>
              )}

              {/* Summary Section */}
              <div className="component grid-summary">
                <h2>Plain Summary</h2>
                <div>{renderFormattedText(analysis.plain_summary)}</div>
              </div>

              {/* Quick Stats */}
              <div className="quickies">
                <div className="component riskScore">
                  <h2>Risk Level</h2>
                  <p>{analysis.risk_level}</p>
                </div>
                <div className="component flagsFound">
                  <h2>Red Flags Found</h2>
                  <div className="value">
                    {Array.isArray(analysis.red_flags) ? analysis.red_flags.length : 
                     typeof analysis.red_flags === 'string' ? 1 : 0}
                  </div>
                </div>
                <div className="component mistakes">
                  <h2>Mistakes/Ambiguities</h2>
                  <div className="value">
                    {Array.isArray(analysis.mistakes_ambiguities) ? analysis.mistakes_ambiguities.length : 
                     typeof analysis.mistakes_ambiguities === 'string' ? 1 : 0}
                  </div>
                </div>
              </div>

              {/* Tabs */}
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
                  Mistakes & Ambiguities
                </h3>
                <h3
                  className={selectedTab === "recommendations" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("recommendations")}
                >
                  Recommendations
                </h3>
              </div>
              <hr className="hr1" />

              {/* Tab Content */}
              <div style={{ color: getColor() }}>
                {selectedTab === "keyTerms" && (
                  <div className="tab-content">
                    {/* Parties */}
                    <div className="component keyTerms">
                      <h2>Parties</h2>
                      <div>{renderFormattedText(analysis.parties)}</div>
                    </div>

                    {/* Dates */}
                    <div className="component keyTerms">
                      <h2>Important Dates</h2>
                      <div>{renderFormattedText(analysis.dates)}</div>
                    </div>

                    {/* Payment Terms */}
                    <div className="component keyTerms">
                      <h2>Payment Terms</h2>
                      <div>{renderFormattedText(analysis.payment_terms)}</div>
                    </div>

                    {/* Obligations */}
                    <div className="component keyTerms">
                      <h2>Obligations</h2>
                      <div>{renderFormattedText(analysis.obligations)}</div>
                    </div>

                    {/* Termination */}
                    <div className="component keyTerms">
                      <h2>Termination Clauses</h2>
                      <div>{renderFormattedText(analysis.termination)}</div>
                    </div>
                  </div>
                )}

                {selectedTab === "redFlags" && (
                  <div className="tab-content">
                    <div className="component redFlags">
                      <h2>Red Flags Identified</h2>
                      {(() => {
                        if (typeof analysis.red_flags === 'string') {
                          const redFlagPoints = parseNumberedPoints(analysis.red_flags);
                          if (redFlagPoints.length > 0) {
                            return (
                              <div>
                                {redFlagPoints.map((flag, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '15px', 
                                    padding: '10px', 
                                    border: '1px solid #ff6b6b', 
                                    borderRadius: '5px',
                                    backgroundColor: '#fff5f5'
                                  }}>
                                    <h4 style={{ color: '#d63031', marginBottom: '8px' }}>
                                      Red Flag #{index + 1}
                                    </h4>
                                    <div>{renderFormattedText(flag)}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return <div>{renderFormattedText(analysis.red_flags)}</div>;
                          }
                        } else if (Array.isArray(analysis.red_flags)) {
                          return renderArrayItems(analysis.red_flags);
                        } else {
                          return <p>No red flags identified.</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {selectedTab === "mistakes" && (
                  <div className="tab-content">
                    <div className="component mistakes">
                      <h2>Mistakes and Ambiguities</h2>
                      {(() => {
                        if (typeof analysis.mistakes_ambiguities === 'string') {
                          const mistakePoints = parseNumberedPoints(analysis.mistakes_ambiguities);
                          if (mistakePoints.length > 0) {
                            return (
                              <div>
                                {mistakePoints.map((mistake, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '15px', 
                                    padding: '10px', 
                                    border: '1px solid #fdcb6e', 
                                    borderRadius: '5px',
                                    backgroundColor: '#fffbf0'
                                  }}>
                                    <h4 style={{ color: '#e17055', marginBottom: '8px' }}>
                                      Issue #{index + 1}
                                    </h4>
                                    <div>{renderFormattedText(mistake)}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          } else {
                            return <div>{renderFormattedText(analysis.mistakes_ambiguities)}</div>;
                          }
                        } else if (Array.isArray(analysis.mistakes_ambiguities)) {
                          return renderArrayItems(analysis.mistakes_ambiguities);
                        } else {
                          return <p>No mistakes or ambiguities identified.</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}

                {selectedTab === "recommendations" && (
                  <div className="tab-content">
                    <div className="component recommendations">
                      <h2>Recommendations</h2>
                      {(() => {
                        if (analysis.recommendations) {
                          if (typeof analysis.recommendations === 'string') {
                            const recommendationPoints = parseNumberedPoints(analysis.recommendations);
                            if (recommendationPoints.length > 0) {
                              return (
                                <div>
                                  {recommendationPoints.map((recommendation, index) => (
                                    <div key={index} style={{ 
                                      marginBottom: '15px', 
                                      padding: '10px', 
                                      border: '1px solid #00b894', 
                                      borderRadius: '5px',
                                      backgroundColor: '#f0fff4'
                                    }}>
                                      <h4 style={{ color: '#00b894', marginBottom: '8px' }}>
                                        Recommendation #{index + 1}
                                      </h4>
                                      <div>{renderFormattedText(recommendation)}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return <div>{renderFormattedText(analysis.recommendations)}</div>;
                            }
                          } else if (Array.isArray(analysis.recommendations)) {
                            return renderArrayItems(analysis.recommendations);
                          } else {
                            return <p>{JSON.stringify(analysis.recommendations)}</p>;
                          }
                        } else {
                          return <p>No recommendations available.</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>No analysis yet. Upload and analyze a contract to see results.</p>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default ContractAnalyzer;