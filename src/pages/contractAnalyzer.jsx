import axios from "axios";
import { useState, useRef } from "react";
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
  //UI Helpers
  const getItemCount = (data) => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'string') {
      const points = parseNumberedPoints(data);
      return points.length > 0 ? points.length : 1; // If no numbered points found, assume 1 item
    }
    return 0;
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
    if (selectedTab === "mistakes") return "maroon";
    return "inherit";
  };

  // Helper function to render text with proper formatting
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split by sentences and paragraphs, handle bold text
    return text.split('\n').map((paragraph, index) => (
      <p key={index} style={{ marginBottom: '10px' }}>
        {paragraph.split(/(\\[^]+\\*)/).map((part, i) => {
          if (part.startsWith('') && part.endsWith('')) {
            return <p key={i}>{part.slice(2, -2)}</p>;
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
        <br />

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
              Drag & Drop or <span>Choose a File</span>
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
            <div>
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
        <div>
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
                  <div className="val">{analysis.risk_level || 'N/A'}</div>
                </div>
                <div className="component flagsFound">
                  <h2>Red Flags Found</h2>
                  <div className="value">
                    {getItemCount(analysis.red_flags)}
                  </div>
                </div>
                <div className="component mistakes">
                  <h2>Mistakes/Ambiguities</h2>
                  <div className="value">
                    {getItemCount(analysis.mistakes_ambiguities)}
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
                  </div>
                )}

                {selectedTab === "redFlags" && (
                  <div className="tab-content">
                    {(() => {
                      let redFlagItems = [];

                      if (typeof analysis.red_flags === 'string') {
                        const redFlagPoints = parseNumberedPoints(analysis.red_flags);
                        redFlagItems = redFlagPoints.length > 0 ? redFlagPoints : [analysis.red_flags];
                      } else if (Array.isArray(analysis.red_flags)) {
                        redFlagItems = analysis.red_flags;
                      }

                      return redFlagItems.length > 0 ? (
                        redFlagItems.map((flag, index) => (
                          <div key={index} className="component redFlags">

                            <div style={{
                              padding: '10px',
                              margin: "-1rem",
                              border: '2px solid #ff6b6b',
                              borderRadius: '8px',
                              backgroundColor: '#fff5f5',
                              color: '#d63031'
                            }}><h4 style={{ color: '#6e0303ff', marginBottom: '8px' }}>
                                Red Flag #{index + 1}
                              </h4>
                              {renderFormattedText(flag)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component redFlags">
                          <h2>Red Flags</h2>
                          <p>No red flags identified.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedTab === "mistakes" && (
                  <div className="tab-content">
                    {(() => {
                      let mistakeItems = [];

                      if (typeof analysis.mistakes_ambiguities === 'string') {
                        const mistakePoints = parseNumberedPoints(analysis.mistakes_ambiguities);
                        mistakeItems = mistakePoints.length > 0 ? mistakePoints : [analysis.mistakes_ambiguities];
                      } else if (Array.isArray(analysis.mistakes_ambiguities)) {
                        mistakeItems = analysis.mistakes_ambiguities;
                      }

                      return mistakeItems.length > 0 ? (
                        mistakeItems.map((mistake, index) => (
                          <div key={index} className="component mistakes">

                            <div style={{
                              padding: '10px',
                              margin: "-1rem",
                              border: '2px solid #fdcb6e',
                              borderRadius: '8px',
                              backgroundColor: '#fffbf0',
                              color: '#e17055'
                            }}>
                              <h4 style={{ color: '#871a0dff', marginBottom: '8px' }}>
                                Mistake #{index + 1}
                              </h4>
                              {renderFormattedText(mistake)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component mistakes">
                          <h2>Mistakes & Ambiguities</h2>
                          <p>No mistakes or ambiguities identified.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedTab === "recommendations" && (
                  <div className="tab-content">
                    {(() => {
                      let recommendationItems = [];

                      if (analysis.recommendations) {
                        if (typeof analysis.recommendations === 'string') {
                          const recommendationPoints = parseNumberedPoints(analysis.recommendations);
                          recommendationItems = recommendationPoints.length > 0 ? recommendationPoints : [analysis.recommendations];
                        } else if (Array.isArray(analysis.recommendations)) {
                          recommendationItems = analysis.recommendations;
                        } else {
                          recommendationItems = [JSON.stringify(analysis.recommendations)];
                        }
                      }

                      return recommendationItems.length > 0 ? (
                        recommendationItems.map((recommendation, index) => (
                          <div key={index} className="component recommendations">

                            <div style={{
                              padding: '10px',
                              margin: "-1rem",
                              border: '2px solid #00b894',
                              borderRadius: '8px',
                              backgroundColor: '#f0fff4',
                              color: '#00b894'
                            }}>
                              <h4 style={{ color: '#046753ff', marginBottom: '8px' }}>
                                Recommendation #{index + 1}
                              </h4>
                              {renderFormattedText(recommendation)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component recommendations">
                          <h2>Recommendations</h2>
                          <p>No recommendations available.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>No analysis yet. Upload and analyze a contract to see results.</p>
          )}
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>

      </div>
    </div>
  );
};

export default ContractAnalyzer;