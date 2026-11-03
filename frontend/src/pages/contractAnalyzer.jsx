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
  const [isTextCollapsed, setIsTextCollapsed] = useState(false);

  // File handling
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Tabs: keyTerms | redFlags | missingProtections | mistakes | recommendations
  const [selectedTab, setSelectedTab] = useState("redFlags");

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
    formdata.append("request", "Please perform a complete evidence-backed contract risk audit.");
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
        const result = json_data.answers[0];
        setAnalysis(result);
        setMessage("Analysis completed successfully!");
        
        // Collapse pasted text once analyzed to maximize screen space
        if (inputMode === "text") {
          setIsTextCollapsed(true);
        }

        // UX ENHANCEMENT: Auto-scroll directly to results so user doesn't have to scroll manually!
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
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

  // JSON Export
  const handleDownloadJSON = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(analysis.title || "contract_risk_audit").replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // PDF Export (Native Print Memorandum View)
  const handleDownloadPDF = () => {
    if (!analysis) return;

    // Create a styled print window for executive PDF rendering
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback to direct window.print()
      window.print();
      return;
    }

    const redFlagsHtml = Array.isArray(analysis.red_flags)
      ? analysis.red_flags
          .map((flag, idx) => {
            if (typeof flag === "object" && flag !== null) {
              return `
              <div style="border: 1px solid #dc2626; border-left: 6px solid #dc2626; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #fff;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; color: #991b1b; font-size: 14px;">
                  <span>#${idx + 1} ${flag.title || "Contract Risk"}</span>
                  <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${(flag.severity || "HIGH").toUpperCase()}</span>
                </div>
                ${flag.clause_reference ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Clause: <strong>${flag.clause_reference}</strong></div>` : ""}
                ${flag.evidence ? `<div style="background: #f8fafc; border-left: 3px solid #64748b; padding: 8px 12px; margin: 8px 0; font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #334155;">&ldquo;${flag.evidence}&rdquo;</div>` : ""}
                <div style="font-size: 13px; color: #1e293b; margin-top: 6px;"><strong>Legal Impact:</strong> ${flag.impact || flag.explanation || ""}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 6px;"><strong>Recommended Amendment:</strong> ${flag.recommendation || ""}</div>
              </div>`;
            }
            return `<div style="padding: 10px; border: 1px solid #fee2e2; border-radius: 6px; margin-bottom: 8px;"><strong>#${idx + 1}:</strong> ${flag}</div>`;
          })
          .join("")
      : "<p>No critical red flags recorded.</p>";

    const rubric = analysis.risk_assessment?.rubric_breakdown || {};

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${analysis.title || "Contract Risk Audit Report"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; margin: 0 auto; max-width: 850px; }
          .header { border-bottom: 3px solid #3730d0; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .header h1 { font-size: 24px; color: #1e1b4b; margin: 0; }
          .header .brand { color: #3730d0; font-weight: bold; font-size: 18px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 15px; font-weight: bold; font-size: 13px; margin-bottom: 12px; }
          .badge-high { background: #fee2e2; color: #991b1b; }
          .badge-medium { background: #fef3c7; color: #92400e; }
          .badge-low { background: #dcfce7; color: #166534; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #334155; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
          .rubric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
          .rubric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-size: 12px; }
          .rubric-box h4 { margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; }
          @media print { body { padding: 0; } button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">⚖️ LegalSmiths AI</div>
            <h1>Commercial Contract Risk Audit Report</h1>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Document: ${analysis.title || "Commercial Agreement"} | Date: ${new Date().toLocaleDateString()}</div>
          </div>
          <button onclick="window.print()" style="background: #3730d0; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Print to PDF</button>
        </div>

        <div class="section">
          <h2>1. Executive Summary & Risk Rating</h2>
          <div class="badge ${String(analysis.risk_level).toLowerCase().includes("high") ? "badge-high" : String(analysis.risk_level).toLowerCase().includes("low") ? "badge-low" : "badge-medium"}">
            ${analysis.risk_level || "MEDIUM RISK"}
          </div>
          <p style="font-size: 14px; color: #334155;">${analysis.plain_summary || "Audit completed."}</p>

          <div class="rubric-grid">
            <div class="rubric-box">
              <h4>💰 Financial Exposure</h4>
              <strong>${rubric.financial_exposure || "Evaluated in red flags"}</strong>
            </div>
            <div class="rubric-box">
              <h4>⚖️ Dispute Probability</h4>
              <strong>${rubric.dispute_probability || "Standard"}</strong>
            </div>
            <div class="rubric-box">
              <h4>🔄 Clause Symmetry</h4>
              <strong>${rubric.clause_symmetry || "Standard"}</strong>
            </div>
            <div class="rubric-box">
              <h4>🔗 Cross-Clause Interaction</h4>
              <strong>${rubric.cross_clause_interaction || "Evaluated"}</strong>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>2. Evidence-Backed Red Flags & Legal Liabilities</h2>
          ${redFlagsHtml}
        </div>

        <div class="section">
          <h2>3. Recommended Contract Amendments</h2>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px; font-size: 13px; color: #065f46;">
            ${typeof analysis.recommendations === "string" ? analysis.recommendations.replace(/\n/g, "<br/>") : JSON.stringify(analysis.recommendations)}
          </div>
        </div>

        <div class="section">
          <h2>4. Core Operational Clauses</h2>
          <p><strong>Parties:</strong> ${typeof analysis.parties === "string" ? analysis.parties : JSON.stringify(analysis.parties)}</p>
          <p><strong>Important Dates:</strong> ${typeof analysis.dates === "string" ? analysis.dates : JSON.stringify(analysis.dates)}</p>
          <p><strong>Payment Terms:</strong> ${typeof analysis.payment_terms === "string" ? analysis.payment_terms : JSON.stringify(analysis.payment_terms)}</p>
          <p><strong>Termination Triggers:</strong> ${typeof analysis.termination === "string" ? analysis.termination : JSON.stringify(analysis.termination)}</p>
        </div>

        <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Generated by LegalSmiths AI Agentic Contract Analyzer. Privileged & Confidential Legal Intelligence.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  // Clean risk level helper with rubric insight
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
          <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "4px", lineHeight: "1.5" }}>
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
        <h1 className="title">Smart Contract Risk Auditor</h1>
        <p className="description">
          Evidence-backed legal auditing: cross-clause carve-out detection, uncapped liability auditing, and actionable amendment recommendations.
        </p>
        <br />

        {/* Input Mode Selector */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "15px" }}>
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
            <div style={{ marginBottom: "15px" }}>
              {/* UX ENHANCEMENT: Collapsible Textarea when analyzed */}
              {isTextCollapsed && analysis ? (
                <div
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "12px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#334155" }}>
                    📄 <strong>Pasted Contract Loaded:</strong> {pastedText.split(/\s+/).length} words ({pastedText.length} chars)
                  </span>
                  <button
                    onClick={() => setIsTextCollapsed(false)}
                    style={{
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Edit Text
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.8rem", color: "#666" }}>
                    <span>Paste complete contract or critical clauses:</span>
                    {pastedText && (
                      <span>{pastedText.split(/\s+/).filter(Boolean).length} words ({pastedText.length} chars)</span>
                    )}
                  </div>
                  <textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste contract clauses, terms, or complete agreement text here for instant evidence-backed audit..."
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
                  {analysis && (
                    <div style={{ textAlign: "right", marginTop: "4px" }}>
                      <button
                        onClick={() => setIsTextCollapsed(true)}
                        style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Collapse text to view report
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <button className="analyze-btn" onClick={analyzeWithFastAPI} disabled={analyzing}>
            {analyzing ? "Auditing Cross-Clause Risks with AI..." : "Analyze Contract"}
          </button>

          {/* Upload/Analysis status */}
          {(uploading || analyzing) && (
            <div className="progress-bar">
              <div className="progress"></div>
              <div className="progress-text">
                {uploading ? "Uploading to secure vault..." : "Evaluating cross-clause carve-outs & liabilities..."}
              </div>
            </div>
          )}
          {message && <p className="progress-info">{message}</p>}
        </div>

        {/* Floating / Sticky Jump Button if analysis is ready */}
        {analysis && (
          <div style={{ textAlign: "center", margin: "1rem 0" }}>
            <button
              onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                background: "#ede9fe",
                color: "#5b21b6",
                border: "1px solid #c4b5fd",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ⬇️ Jump to Audit Report ({getItemCount(analysis.red_flags)} Red Flags Found)
            </button>
          </div>
        )}

        {/* Report Section with Anchor Ref */}
        <div ref={resultsRef} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2.5rem" }}>
          <h2 className="section-title" style={{ margin: 0 }}>Contract Audit Report</h2>
          
          {/* EXPORT OPTIONS: PDF & JSON */}
          {analysis && (
            <div className="export-bar" style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 18px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
                }}
              >
                📄 Download PDF Report
              </button>
              <button
                onClick={handleDownloadJSON}
                style={{
                  background: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 18px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📥 Export JSON
              </button>
            </div>
          )}
        </div>

        <div>
          {analysis ? (
            <>
              {/* Title Section */}
              {analysis.title && (
                <div className="component grid-summary">
                  <h2>Document Classification</h2>
                  <p><strong>{analysis.title}</strong></p>
                  {analysis.analysis_metadata && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px" }}>
                      Audited via <strong>{analysis.analysis_metadata.retrieval_strategy === "complete_document_context" ? "Complete-Document Cross-Clause Verification" : "Hybrid RAG + Structural Outline"}</strong> ({analysis.analysis_metadata.document_length?.toLocaleString()} characters analyzed).
                    </div>
                  )}
                </div>
              )}

              {/* Summary Section */}
              <div className="component grid-summary">
                <h2>Executive Plain Summary</h2>
                <div>{renderFormattedText(analysis.plain_summary)}</div>
              </div>

              {/* Quick Stats & Risk Rubric (Gap D) */}
              <div className="quickies">
                <div className="component riskScore">
                  <h2>Risk Assessment</h2>
                  <div style={{ marginTop: "0.8rem" }}>
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
                  <h2>Missing Protections</h2>
                  <div className="value" style={{ color: "#d97706" }}>
                    {getItemCount(analysis.missing_protections)}
                  </div>
                </div>
              </div>

              {/* Risk Rubric Breakdown Matrix (Gap D) */}
              {analysis.risk_assessment?.rubric_breakdown && (
                <div className="component" style={{ marginBottom: "20px" }}>
                  <h2>⚖️ Consistent Risk Framework Evaluation</h2>
                  <div className="risk-rubric-matrix">
                    <div className="rubric-quadrant">
                      <h4>💰 Financial Exposure</h4>
                      <p>{analysis.risk_assessment.rubric_breakdown.financial_exposure || "Evaluated in red flags"}</p>
                    </div>
                    <div className="rubric-quadrant">
                      <h4>⚖️ Dispute Probability</h4>
                      <p>{analysis.risk_assessment.rubric_breakdown.dispute_probability || "Standard commercial probability"}</p>
                    </div>
                    <div className="rubric-quadrant">
                      <h4>🔄 Clause Symmetry</h4>
                      <p>{analysis.risk_assessment.rubric_breakdown.clause_symmetry || "Standard commercial covenants"}</p>
                    </div>
                    <div className="rubric-quadrant">
                      <h4>🔗 Cross-Clause Interaction</h4>
                      <p>{analysis.risk_assessment.rubric_breakdown.cross_clause_interaction || "No conflicting carve-outs detected"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="points">
                <h3
                  className={selectedTab === "redFlags" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("redFlags")}
                >
                  🚨 Evidence-Backed Red Flags ({getItemCount(analysis.red_flags)})
                </h3>
                <h3
                  className={selectedTab === "missingProtections" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("missingProtections")}
                >
                  🛡️ Missing Protections ({getItemCount(analysis.missing_protections)})
                </h3>
                <h3
                  className={selectedTab === "keyTerms" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("keyTerms")}
                >
                  📋 Key Terms & Clauses
                </h3>
                <h3
                  className={selectedTab === "mistakes" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("mistakes")}
                >
                  ⚠️ Ambiguities
                </h3>
                <h3
                  className={selectedTab === "recommendations" ? "active-tab" : ""}
                  onClick={() => setSelectedTab("recommendations")}
                >
                  💡 Actionable Amendments
                </h3>
              </div>

              {/* Tab Content */}
              <div>
                {/* 1. EVIDENCE-BACKED RED FLAGS (Gap B & C) */}
                {selectedTab === "redFlags" && (
                  <div className="tab-content" style={{ marginTop: "1rem" }}>
                    {(() => {
                      const redFlags = analysis.red_flags;
                      if (!redFlags || (Array.isArray(redFlags) && redFlags.length === 0)) {
                        return (
                          <div className="component">
                            <p style={{ color: "#059669", fontWeight: "bold" }}>✅ No critical contractual red flags identified in this agreement.</p>
                          </div>
                        );
                      }

                      const flagsList = Array.isArray(redFlags) ? redFlags : [redFlags];

                      return flagsList.map((flag, index) => {
                        // Structured Object Support (Gap B)
                        if (typeof flag === "object" && flag !== null) {
                          const sev = String(flag.severity || "High").toLowerCase();
                          return (
                            <div key={index} className={`evidence-card ${sev}`}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                                <div>
                                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>RED FLAG #{index + 1}</span>
                                  <h3 style={{ margin: "2px 0 6px 0", fontSize: "1.1rem", color: "#1e293b", fontWeight: "bold" }}>
                                    {flag.title || "Legal Liability Flag"}
                                  </h3>
                                  {flag.clause_reference && (
                                    <span style={{ fontSize: "0.8rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", color: "#475569" }}>
                                      📍 Clause: <strong>{flag.clause_reference}</strong>
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {flag.finding_type && (
                                    <span style={{ background: "#e0e7ff", color: "#3730a3", fontSize: "0.75rem", padding: "3px 8px", borderRadius: "12px", fontWeight: "600" }}>
                                      {flag.finding_type}
                                    </span>
                                  )}
                                  <span style={{
                                    background: sev === "critical" ? "#7f1d1d" : sev === "high" ? "#dc2626" : sev === "low" ? "#2563eb" : "#d97706",
                                    color: "#fff",
                                    fontSize: "0.75rem",
                                    padding: "3px 10px",
                                    borderRadius: "12px",
                                    fontWeight: "bold",
                                    textTransform: "uppercase"
                                  }}>
                                    {flag.severity || "HIGH"}
                                  </span>
                                </div>
                              </div>

                              {/* VERBATIM CONTRACTUAL EVIDENCE (Gap B) */}
                              {flag.evidence && (
                                <div className="evidence-quote-box">
                                  <span style={{ fontWeight: "600", fontStyle: "normal", fontSize: "0.75rem", display: "block", color: "#64748b", marginBottom: "4px" }}>
                                    📜 VERBATIM CONTRACT EVIDENCE:
                                  </span>
                                  &ldquo;{flag.evidence}&rdquo;
                                </div>
                              )}

                              {/* Explanation & Impact */}
                              <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#334155" }}>
                                <p style={{ margin: "0 0 6px 0" }}><strong>Legal Vulnerability:</strong> {flag.explanation}</p>
                                {flag.impact && (
                                  <p style={{ margin: "0 0 6px 0", color: "#991b1b" }}>
                                    <strong>Financial / Operational Exposure:</strong> {flag.impact}
                                  </p>
                                )}
                              </div>

                              {/* Actionable Negotiation Amendment */}
                              {flag.recommendation && (
                                <div style={{ marginTop: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", color: "#166534" }}>
                                  <strong>💡 Recommended Negotiation Action:</strong> {flag.recommendation}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // String Fallback
                        return (
                          <div key={index} className="component redFlags">
                            <div style={{ padding: "12px", border: "2px solid #ff6b6b", borderRadius: "8px", backgroundColor: "#fff5f5", color: "#b91c1c" }}>
                              <h4 style={{ color: "#7f1d1d", marginBottom: "8px", fontWeight: "bold" }}>
                                🚨 Red Flag #{index + 1}
                              </h4>
                              {renderFormattedText(flag)}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* 2. MISSING PROTECTIONS & OMISSIONS (Gap C) */}
                {selectedTab === "missingProtections" && (
                  <div className="tab-content" style={{ marginTop: "1rem" }}>
                    {(() => {
                      const missing = analysis.missing_protections;
                      if (!missing || (Array.isArray(missing) && missing.length === 0)) {
                        return (
                          <div className="component">
                            <p style={{ color: "#059669", fontWeight: "bold" }}>✅ No critical standard protective provisions were found missing.</p>
                          </div>
                        );
                      }

                      const list = Array.isArray(missing) ? missing : [missing];

                      return list.map((item, index) => {
                        if (typeof item === "object" && item !== null) {
                          return (
                            <div key={index} className="evidence-card medium">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={{ margin: 0, fontSize: "1rem", color: "#92400e", fontWeight: "bold" }}>
                                  🛡️ {item.title || "Absent Standard Protection"}
                                </h3>
                                <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                                  MISSING CLAUSE
                                </span>
                              </div>
                              <p style={{ margin: "8px 0 4px 0", fontSize: "0.88rem", color: "#451a03" }}>
                                <strong>Vulnerability Created:</strong> {item.explanation || item.impact}
                              </p>
                              {item.recommendation && (
                                <div style={{ marginTop: "8px", background: "#fefce8", border: "1px solid #fde047", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", color: "#854d0e" }}>
                                  <strong>Suggested Clause Insertion:</strong> {item.recommendation}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={index} className="component">
                            <p>{item}</p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* 3. KEY OPERATIONAL TERMS */}
                {selectedTab === "keyTerms" && (
                  <div className="tab-content" style={{ marginTop: "1rem" }}>
                    <div className="component keyTerms">
                      <h2>👥 Contracting Parties & Defined Roles</h2>
                      <div>{renderFormattedText(analysis.parties)}</div>
                    </div>

                    <div className="component keyTerms">
                      <h2>📅 Important Dates & Term Milestones</h2>
                      <div>{renderFormattedText(analysis.dates)}</div>
                    </div>

                    <div className="component keyTerms">
                      <h2>💳 Payment Terms & Financial Penalties</h2>
                      <div>{renderFormattedText(analysis.payment_terms)}</div>
                    </div>

                    <div className="component keyTerms">
                      <h2>📋 Core Covenants & Performance Obligations</h2>
                      <div>{renderFormattedText(analysis.obligations)}</div>
                    </div>

                    <div className="component keyTerms">
                      <h2>🚪 Termination Triggers & Cure Periods</h2>
                      <div>{renderFormattedText(analysis.termination)}</div>
                    </div>
                  </div>
                )}

                {/* 4. MISTAKES & AMBIGUITIES */}
                {selectedTab === "mistakes" && (
                  <div className="tab-content" style={{ marginTop: "1rem" }}>
                    {(() => {
                      const mistakes = analysis.mistakes_ambiguities;
                      if (!mistakes || (Array.isArray(mistakes) && mistakes.length === 0)) {
                        return (
                          <div className="component">
                            <p>No contractual ambiguities or drafting contradictions detected.</p>
                          </div>
                        );
                      }

                      if (Array.isArray(mistakes)) {
                        return mistakes.map((m, index) => {
                          if (typeof m === "object" && m !== null) {
                            return (
                              <div key={index} className="evidence-card medium">
                                <h4 style={{ color: "#b45309", margin: "0 0 6px 0", fontWeight: "bold" }}>
                                  ⚠️ #{index + 1} {m.title || "Contractual Ambiguity"}
                                </h4>
                                {m.clause_reference && <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Location: {m.clause_reference}</p>}
                                {m.evidence && (
                                  <div className="evidence-quote-box" style={{ borderColor: "#fde68a" }}>
                                    &ldquo;{m.evidence}&rdquo;
                                  </div>
                                )}
                                <p style={{ fontSize: "0.88rem", color: "#334155" }}>{m.explanation}</p>
                                {m.recommendation && (
                                  <p style={{ fontSize: "0.85rem", color: "#047857" }}><strong>Clarification:</strong> {m.recommendation}</p>
                                )}
                              </div>
                            );
                          }
                          return (
                            <div key={index} className="component mistakes">
                              <p>{m}</p>
                            </div>
                          );
                        });
                      }

                      return (
                        <div className="component mistakes">
                          <div>{renderFormattedText(mistakes)}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 5. ACTIONABLE RECOMMENDATIONS */}
                {selectedTab === "recommendations" && (
                  <div className="tab-content" style={{ marginTop: "1rem" }}>
                    <div className="component recommendations">
                      <div
                        style={{
                          padding: "16px",
                          border: "2px solid #10b981",
                          borderRadius: "10px",
                          backgroundColor: "#f0fdf4",
                          color: "#047857",
                        }}
                      >
                        <h4 style={{ color: "#065f46", marginBottom: "12px", fontWeight: "bold", fontSize: "1.1rem" }}>
                          💡 Strategic Amendment Roadmap Before Signing
                        </h4>
                        <div>{renderFormattedText(analysis.recommendations)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", color: "#666", padding: "2.5rem" }}>
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
