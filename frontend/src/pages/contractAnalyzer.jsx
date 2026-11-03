import axios from "axios";
import { useState, useRef } from "react";
import "../styles/contractAnalyzer.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { AI_API_URL, NODE_API_URL } from "../config/api";
import { logout } from "../utils/auth";

const ContractAnalyzer = () => {
  const navigate = useNavigate();

  // Mode: file upload vs text paste
  const [inputMode, setInputMode] = useState("file"); // "file" | "text"
  const [pastedText, setPastedText] = useState("");

  // File handling
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Tabs: keyTerms | redFlags | mistakes | recommendations
  const [selectedTab, setSelectedTab] = useState("keyTerms");

  // Analysis data (from FastAPI response)
  const [analysis, setAnalysis] = useState(null);

  // File upload to Node backend (optional persistence)
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post(
        `${NODE_API_URL}/upload-contract`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(res.data.message || "File uploaded successfully to vault.");
    } catch (err) {
      console.warn("Backend file upload warning (non-fatal):", err.message);
    } finally {
      setUploading(false);
    }
  };

  // FastAPI integration
  const analyzeWithFastAPI = async () => {
    let filesToSubmit = [...files];

    // If text mode, convert pasted text into a virtual text file
    if (inputMode === "text") {
      if (!pastedText.trim()) {
        setMessage("Please paste the contract text before analyzing.");
        return;
      }
      const textBlob = new Blob([pastedText.trim()], { type: "text/plain" });
      const virtualFile = new File([textBlob], "pasted_contract.txt", { type: "text/plain" });
      filesToSubmit = [virtualFile];
    } else {
      if (filesToSubmit.length === 0) {
        setMessage("Please upload at least one contract file (.pdf, .docx, .txt).");
        return;
      }
    }

    setAnalyzing(true);
    setMessage("");

    const formdata = new FormData();
    formdata.append("request", "Please analyze this contract thoroughly.");
    filesToSubmit.forEach((file) => {
      formdata.append("files", file);
    });

    try {
      const response = await axios.post(
        `${AI_API_URL}/contractanalyzer`,
        formdata,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const json_data = response.data;
      if (json_data.answers && json_data.answers.length > 0) {
        setAnalysis(json_data.answers[0]);
        setMessage("Analysis completed successfully!");
      } else {
        setMessage("No analysis data received from the AI engine.");
      }
    } catch (error) {
      console.error("Contract analysis error:", error);
      setMessage("Analysis failed. Please check the AI backend connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(analysis.title || "contract_analysis").replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
  const parseNumberedPoints = (text) => {
    if (!text || typeof text !== "string") return [];
    const points = text.split(/(?=\d+\.\s)/).filter((point) => point.trim().length > 0);
    return points
      .map((point) => point.replace(/^\d+\.\s*/, "").trim())
      .filter((point) => point.length > 0);
  };

  const getItemCount = (data) => {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === "string") {
      const points = parseNumberedPoints(data);
      return points.length > 0 ? points.length : 1;
    }
    return 0;
  };

  // Helper function to render text with clean bolding and bullet formatting
  const renderFormattedText = (text) => {
    if (!text) return <p style={{ color: "#888", fontStyle: "italic" }}>Not specified in contract.</p>;

    if (typeof text !== "string") {
      if (Array.isArray(text)) {
        return text.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "8px" }}>
            {renderFormattedText(item)}
          </div>
        ));
      }
      return <span>{JSON.stringify(text)}</span>;
    }

    return text.split("\n").map((paragraph, index) => {
      if (!paragraph.trim()) return null;
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={index} style={{ marginBottom: "8px", lineHeight: "1.6" }}>
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  // Clean risk level helper
  const renderRiskBadge = (riskStr) => {
    const raw = String(riskStr || "Medium");
    const isHigh = raw.toLowerCase().includes("high");
    const isLow = raw.toLowerCase().includes("low");

    const badgeColor = isHigh ? "#ef4444" : isLow ? "#10b981" : "#f59e0b";
    const badgeBg = isHigh ? "#fee2e2" : isLow ? "#dcfce7" : "#fef3c7";
    const label = isHigh ? "HIGH RISK" : isLow ? "LOW RISK" : "MEDIUM RISK";

    return (
      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            padding: "8px 18px",
            background: badgeBg,
            color: badgeColor,
            borderRadius: "20px",
            fontWeight: "bold",
            fontSize: "1.2rem",
            marginBottom: "8px",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </span>
        {raw.includes("-") && (
          <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "4px" }}>
            {raw.split("-").slice(1).join("-").trim()}
          </p>
        )}
      </div>
    );
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
        <button
          onClick={() => logout(navigate)}
          className="login-link"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontFamily: "inherit",
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div className="case-container">
        <h1 className="title">Smart Contract Analyzer</h1>
        <p className="description">
          Automated multi-clause legal auditing: uncover uncapped indemnities, identify operational liabilities, and receive tailored commercial recommendations.
        </p>
        <br />

        {/* Input Mode Selector */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => setInputMode("file")}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: inputMode === "file" ? "2px solid #3730d0" : "1px solid #ccc",
              background: inputMode === "file" ? "#3730d0" : "#fff",
              color: inputMode === "file" ? "#fff" : "#333",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📁 Upload Contract File
          </button>
          <button
            onClick={() => setInputMode("text")}
            style={{
              padding: "8px 20px",
              borderRadius: "20px",
              border: inputMode === "text" ? "2px solid #3730d0" : "1px solid #ccc",
              background: inputMode === "text" ? "#3730d0" : "#fff",
              color: inputMode === "text" ? "#fff" : "#333",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📝 Paste Contract Text
          </button>
        </div>

        {/* Upload / Input Section */}
        <div className="upload-section">
          {inputMode === "file" ? (
            <>
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

              {files.length > 0 && (
                <div style={{ textAlign: "left", marginBottom: "15px" }}>
                  <h4 style={{ fontSize: "0.85rem", color: "#444" }}>Selected File(s):</h4>
                  <ul style={{ fontSize: "0.8rem", color: "#666" }}>
                    {files.map((file, index) => (
                      <li key={index}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{ marginBottom: "20px" }}>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste contract clauses, terms, or complete agreement text here for instant audit..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Analyze Button */}
          <button className="analyze-btn" onClick={analyzeWithFastAPI} disabled={analyzing}>
            {analyzing ? "Auditing Contract with AI..." : "Analyze Contract"}
          </button>

          {/* Upload/Analysis status */}
          {(uploading || analyzing) && (
            <div className="progress-bar">
              <div className="progress"></div>
              <div className="progress-text">
                {uploading ? "Uploading to secure vault..." : "Extracting clauses & evaluating legal risks..."}
              </div>
            </div>
          )}
          {message && <p className="progress-info">{message}</p>}
        </div>

        {/* Report Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3rem" }}>
          <h2 className="section-title" style={{ margin: 0 }}>Analysis Report</h2>
          {analysis && (
            <button
              onClick={handleDownloadReport}
              style={{
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              📥 Download Audit JSON
            </button>
          )}
        </div>

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
                <h2>Executive Plain Summary</h2>
                <div>{renderFormattedText(analysis.plain_summary)}</div>
              </div>

              {/* Quick Stats */}
              <div className="quickies">
                <div className="component riskScore">
                  <h2>Risk Assessment</h2>
                  <div style={{ marginTop: "1rem" }}>
                    {renderRiskBadge(analysis.risk_level)}
                  </div>
                </div>
                <div className="component flagsFound">
                  <h2>Red Flags Identified</h2>
                  <div className="value" style={{ color: "#dc2626" }}>
                    {getItemCount(analysis.red_flags)}
                  </div>
                </div>
                <div className="component mistakes">
                  <h2>Ambiguities Found</h2>
                  <div className="value" style={{ color: "#d97706" }}>
                    {getItemCount(analysis.mistakes_ambiguities)}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="points">
                <h3
                  className={selectedTab === "keyTerms" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("keyTerms")}
                >
                  Key Terms & Clauses
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
                  Actionable Amendments
                </h3>
              </div>
              <hr className="hr1" />

              {/* Tab Content */}
              <div>
                {selectedTab === "keyTerms" && (
                  <div className="tab-content">
                    {/* Parties */}
                    <div className="component keyTerms">
                      <h2>👥 Contracting Parties & Defined Roles</h2>
                      <div>{renderFormattedText(analysis.parties)}</div>
                    </div>

                    {/* Dates */}
                    <div className="component keyTerms">
                      <h2>📅 Important Dates & Term Milestones</h2>
                      <div>{renderFormattedText(analysis.dates)}</div>
                    </div>

                    {/* Payment Terms */}
                    <div className="component keyTerms">
                      <h2>💳 Payment Terms & Financial Penalties</h2>
                      <div>{renderFormattedText(analysis.payment_terms)}</div>
                    </div>

                    {/* Core Obligations */}
                    <div className="component keyTerms">
                      <h2>📋 Core Covenants & Performance Obligations</h2>
                      <div>{renderFormattedText(analysis.obligations)}</div>
                    </div>

                    {/* Termination Rights */}
                    <div className="component keyTerms">
                      <h2>🚪 Termination Triggers & Cure Periods</h2>
                      <div>{renderFormattedText(analysis.termination)}</div>
                    </div>
                  </div>
                )}

                {selectedTab === "redFlags" && (
                  <div className="tab-content">
                    {(() => {
                      let redFlagItems = [];
                      if (typeof analysis.red_flags === "string") {
                        const redFlagPoints = parseNumberedPoints(analysis.red_flags);
                        redFlagItems = redFlagPoints.length > 0 ? redFlagPoints : [analysis.red_flags];
                      } else if (Array.isArray(analysis.red_flags)) {
                        redFlagItems = analysis.red_flags;
                      }

                      return redFlagItems.length > 0 ? (
                        redFlagItems.map((flag, index) => (
                          <div key={index} className="component redFlags">
                            <div
                              style={{
                                padding: "12px",
                                border: "2px solid #ff6b6b",
                                borderRadius: "8px",
                                backgroundColor: "#fff5f5",
                                color: "#b91c1c",
                              }}
                            >
                              <h4 style={{ color: "#7f1d1d", marginBottom: "8px", fontWeight: "bold" }}>
                                🚨 Red Flag #{index + 1}
                              </h4>
                              {renderFormattedText(flag)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component redFlags">
                          <h2>Red Flags</h2>
                          <p>No critical red flags identified in this agreement.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedTab === "mistakes" && (
                  <div className="tab-content">
                    {(() => {
                      let mistakeItems = [];
                      if (typeof analysis.mistakes_ambiguities === "string") {
                        const mistakePoints = parseNumberedPoints(analysis.mistakes_ambiguities);
                        mistakeItems = mistakePoints.length > 0 ? mistakePoints : [analysis.mistakes_ambiguities];
                      } else if (Array.isArray(analysis.mistakes_ambiguities)) {
                        mistakeItems = analysis.mistakes_ambiguities;
                      }

                      return mistakeItems.length > 0 ? (
                        mistakeItems.map((mistake, index) => (
                          <div key={index} className="component mistakes">
                            <div
                              style={{
                                padding: "12px",
                                border: "2px solid #fdcb6e",
                                borderRadius: "8px",
                                backgroundColor: "#fffbf0",
                                color: "#c2410c",
                              }}
                            >
                              <h4 style={{ color: "#7c2d12", marginBottom: "8px", fontWeight: "bold" }}>
                                ⚠️ Ambiguity #{index + 1}
                              </h4>
                              {renderFormattedText(mistake)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component mistakes">
                          <h2>Mistakes & Ambiguities</h2>
                          <p>No contractual ambiguities or missing provisions detected.</p>
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
                        if (typeof analysis.recommendations === "string") {
                          const recommendationPoints = parseNumberedPoints(analysis.recommendations);
                          recommendationItems =
                            recommendationPoints.length > 0 ? recommendationPoints : [analysis.recommendations];
                        } else if (Array.isArray(analysis.recommendations)) {
                          recommendationItems = analysis.recommendations;
                        } else {
                          recommendationItems = [JSON.stringify(analysis.recommendations)];
                        }
                      }

                      return recommendationItems.length > 0 ? (
                        recommendationItems.map((recommendation, index) => (
                          <div key={index} className="component recommendations">
                            <div
                              style={{
                                padding: "12px",
                                border: "2px solid #10b981",
                                borderRadius: "8px",
                                backgroundColor: "#f0fdf4",
                                color: "#047857",
                              }}
                            >
                              <h4 style={{ color: "#065f46", marginBottom: "8px", fontWeight: "bold" }}>
                                💡 Recommended Amendment #{index + 1}
                              </h4>
                              {renderFormattedText(recommendation)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="component recommendations">
                          <h2>Recommendations</h2>
                          <p>No specific amendment actions required.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
              No contract analyzed yet. Upload a file or paste contract text above, then click <strong>"Analyze Contract"</strong>.
            </p>
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
