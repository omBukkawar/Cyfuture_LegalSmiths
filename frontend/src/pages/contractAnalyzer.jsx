import axios from "axios";
import { useState, useRef, useEffect, useCallback } from "react";
import "../styles/contractAnalyzer.css";
import { Link, useNavigate } from "react-router-dom";
import { AI_API_URL, NODE_API_URL, getAuthHeaders } from "../config/api";
import { getUser, logout } from "../utils/auth";

const ContractAnalyzer = () => {
  const navigate = useNavigate();
  const currentUser = getUser();

  // Mode: file upload vs text paste
  const [inputMode, setInputMode] = useState("file"); // "file" | "text"
  const [pastedText, setPastedText] = useState("");
  const [isTextCollapsed, setIsTextCollapsed] = useState(false);

  // File handling
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  // Sidebar & Past Contracts
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pastContracts, setPastContracts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentContractId, setCurrentContractId] = useState(null);

  // Tabs: redFlags | missingProtections | keyTerms | mistakes | recommendations
  const [selectedTab, setSelectedTab] = useState("redFlags");

  // Analysis data (from FastAPI response or loaded from database)
  const [analysis, setAnalysis] = useState(null);

  // 1. Fetch user's saved contracts from Node backend (MongoDB Atlas)
  const fetchPastContracts = useCallback(async () => {
    try {
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };
      const res = await axios.get(`${NODE_API_URL}/contracts`, { headers });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPastContracts(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch past contracts:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const load = async () => { await fetchPastContracts(); };
    load();
  }, [fetchPastContracts]);

  // 2. Start a fresh new audit (clears old outputs, inputs, and selection)
  const handleStartNewAudit = () => {
    setAnalysis(null);
    setCurrentContractId(null);
    setFiles([]);
    setPastedText("");
    setIsTextCollapsed(false);
    setMessage("");
    setSelectedTab("redFlags");
    setSidebarOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Load a previous upload and its saved audit from the database
  const handleSelectContract = (contract) => {
    if (!contract) return;
    setCurrentContractId(contract._id);
    setFiles([]);
    setPastedText(contract.contractText || "");
    setIsTextCollapsed(true);
    setSelectedTab("redFlags");
    setMessage("");
    setSidebarOpen(false);

    if (contract.analysis) {
      setAnalysis(contract.analysis);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      setAnalysis(null);
      setMessage("This contract has no saved audit analysis yet.");
    }
  };

  // 4. Delete an old contract from the database vault
  const handleDeleteContract = async (contractId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this contract from your vault?")) return;

    try {
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };
      await axios.delete(`${NODE_API_URL}/contracts/${contractId}`, { headers });
      setPastContracts((prev) => prev.filter((c) => c._id !== contractId));
      if (currentContractId === contractId) {
        handleStartNewAudit();
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
      alert("Failed to delete contract from vault.");
    }
  };

  // 5. Automatically save new contract & full analysis to MongoDB Atlas
  const saveContractToDatabase = async (finalAnalysis, contractTitle, textContent) => {
    try {
      const headers = {
        ...getAuthHeaders(),
        "x-user-id": currentUser?.id || "anonymous",
      };

      const payload = {
        contractId: currentContractId || undefined,
        originalName: contractTitle || finalAnalysis.title || "Commercial Contract",
        contractText: textContent || "",
        analysis: finalAnalysis,
      };

      const res = await axios.post(`${NODE_API_URL}/contracts/save-audit`, payload, { headers });
      if (res.data?.success && res.data.doc) {
        setCurrentContractId(res.data.doc._id);
        fetchPastContracts(); // Refresh sidebar list
      }
    } catch (err) {
      console.warn("Could not save contract analysis to database vault:", err.message);
    }
  };

  // 6. Run FastAPI Contract Analysis
  const analyzeWithFastAPI = async () => {
    let filesToSubmit = [...files];
    let contractTitle;
    let textContent = "";

    // Clear previous output so user does not see stale results
    setAnalysis(null);
    setMessage("");

    // If text mode, convert pasted text into a virtual text file
    if (inputMode === "text") {
      if (!pastedText.trim()) {
        setMessage("Please paste the contract text before analyzing.");
        return;
      }
      textContent = pastedText.trim();
      contractTitle = `Pasted Contract (${new Date().toLocaleDateString()})`;
      const textBlob = new Blob([textContent], { type: "text/plain" });
      const virtualFile = new File([textBlob], "pasted_contract.txt", { type: "text/plain" });
      filesToSubmit = [virtualFile];
    } else {
      if (filesToSubmit.length === 0) {
        setMessage("Please upload at least one contract file (.pdf, .docx, .txt).");
        return;
      }
      contractTitle = filesToSubmit[0].name;
    }

    setAnalyzing(true);

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

        // Save to MongoDB database
        await saveContractToDatabase(result, contractTitle, textContent);

        // Auto-scroll directly to results
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

  // Export JSON
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

  // Export PDF (Native Print Memorandum View)
  const handleDownloadPDF = () => {
    if (!analysis) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const redFlagsHtml = Array.isArray(analysis.red_flags)
      ? analysis.red_flags
          .map((flag, idx) => {
            if (typeof flag === "object" && flag !== null) {
              const sevColor = {
                critical: { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" },
                high: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
                medium: { bg: "#fefce8", border: "#eab308", text: "#713f12" },
                low: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
              }[(flag.severity || "high").toLowerCase()] || { bg: "#fee2e2", border: "#dc2626", text: "#991b1b" };
              return `
              <div style="border: 1px solid ${sevColor.border}; border-left: 6px solid ${sevColor.border}; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: ${sevColor.text}; font-size: 14px;">
                  <span>#${idx + 1} ${flag.title || "Contract Risk"}</span>
                  <span style="background: ${sevColor.bg}; color: ${sevColor.text}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${(flag.severity || "HIGH").toUpperCase()}</span>
                </div>
                ${flag.clause_reference ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">📌 Clause Reference: <strong>${flag.clause_reference}</strong></div>` : ""}
                ${flag.evidence ? `<div style="background: #f8fafc; border-left: 3px solid #64748b; padding: 8px 12px; margin: 8px 0; font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #334155;">&ldquo;${flag.evidence}&rdquo;</div>` : ""}
                ${flag.explanation ? `<div style="font-size: 13px; color: #1e293b; margin-top: 6px;"><strong>Legal Analysis:</strong> ${flag.explanation}</div>` : ""}
                <div style="font-size: 13px; color: #1e293b; margin-top: 6px;"><strong>Impact:</strong> ${flag.impact || ""}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 6px;"><strong>Recommended Amendment:</strong> ${flag.recommendation || ""}</div>
              </div>`;
            }
            return `<div style="padding: 10px; border: 1px solid #fee2e2; border-radius: 6px; margin-bottom: 8px;"><strong>#${idx + 1}:</strong> ${flag}</div>`;
          })
          .join("")
      : "<p>No critical red flags recorded.</p>";

    const missingProtectionsHtml = Array.isArray(analysis.missing_protections)
      ? analysis.missing_protections
          .map((item, idx) => {
            if (typeof item === "object" && item !== null) {
              return `
              <div style="border: 1px solid #f59e0b; border-left: 6px solid #f59e0b; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #fffbeb;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #92400e; font-size: 14px;">
                  <span>#${idx + 1} ${item.title || "Missing Protection"}</span>
                  <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${(item.severity || "HIGH").toUpperCase()}</span>
                </div>
                <div style="font-size: 13px; color: #1e293b; margin-top: 6px;"><strong>Gap:</strong> ${item.explanation || ""}</div>
                <div style="font-size: 13px; color: #1e293b; margin-top: 4px;"><strong>Vulnerability:</strong> ${item.impact || ""}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 6px;"><strong>Suggested Clause:</strong> ${item.recommendation || ""}</div>
              </div>`;
            }
            return `<div style="padding: 10px; border: 1px solid #fef3c7; border-radius: 6px; margin-bottom: 8px;">${item}</div>`;
          })
          .join("")
      : "";

    const ambiguitiesHtml = Array.isArray(analysis.mistakes_ambiguities)
      ? analysis.mistakes_ambiguities
          .map((item, idx) => {
            if (typeof item === "object" && item !== null) {
              return `
              <div style="border: 1px solid #cbd5e1; border-left: 6px solid #94a3b8; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #f8fafc;">
                <div style="font-weight: bold; color: #334155; font-size: 14px;">#${idx + 1} ${item.title || "Drafting Issue"}</div>
                ${item.clause_reference ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">📌 Clause: <strong>${item.clause_reference}</strong></div>` : ""}
                ${item.evidence ? `<div style="background: #fff; border-left: 3px solid #94a3b8; padding: 8px 12px; margin: 8px 0; font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #475569;">&ldquo;${item.evidence}&rdquo;</div>` : ""}
                <div style="font-size: 13px; color: #1e293b; margin-top: 6px;"><strong>Issue:</strong> ${item.explanation || ""}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 6px;"><strong>Suggested Fix:</strong> ${item.recommendation || ""}</div>
              </div>`;
            }
            return `<div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">${typeof item === "string" ? item : JSON.stringify(item)}</div>`;
          })
          .join("")
      : (typeof analysis.mistakes_ambiguities === "string" ? `<p style="font-size: 13px; color: #334155;">${analysis.mistakes_ambiguities.replace(/\n/g, "<br/>")}</p>` : "");

    const renderStringOrArray = (value) => {
      if (typeof value === "string") return value.replace(/\n/g, "<br/>");
      if (Array.isArray(value)) return value.map((v) => `<li style="margin-bottom:4px;">${typeof v === "string" ? v : JSON.stringify(v)}</li>`).join("");
      if (value && typeof value === "object") return `<pre style="font-size:12px; white-space:pre-wrap;">${JSON.stringify(value, null, 2)}</pre>`;
      return String(value || "—");
    };

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

        ${missingProtectionsHtml ? `
        <div class="section">
          <h2>3. Missing Protective Provisions</h2>
          ${missingProtectionsHtml}
        </div>` : ""}

        ${ambiguitiesHtml ? `
        <div class="section">
          <h2>${missingProtectionsHtml ? "4" : "3"}. Drafting Ambiguities & Unclear Provisions</h2>
          ${ambiguitiesHtml}
        </div>` : ""}

        <div class="section">
          <h2>${[missingProtectionsHtml, ambiguitiesHtml].filter(Boolean).length + 3}. Recommended Contract Amendments</h2>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 14px; border-radius: 6px; font-size: 13px; color: #065f46;">
            ${typeof analysis.recommendations === "string"
              ? analysis.recommendations.replace(/\n/g, "<br/>")
              : Array.isArray(analysis.recommendations)
                ? `<ol style="margin:0; padding-left:16px;">${analysis.recommendations.map(r => `<li style="margin-bottom:6px;">${typeof r === "string" ? r : JSON.stringify(r)}</li>`).join("")}</ol>`
                : JSON.stringify(analysis.recommendations)}
          </div>
        </div>

        <div class="section">
          <h2>${[missingProtectionsHtml, ambiguitiesHtml].filter(Boolean).length + 4}. Core Operational Clauses</h2>
          <table style="width:100%; border-collapse: collapse; font-size: 13px;">
            <tr style="background:#f1f5f9;"><td style="padding:8px 12px;font-weight:bold;width:160px;color:#64748b;border:1px solid #e2e8f0;">Parties</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${renderStringOrArray(analysis.parties)}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#64748b;border:1px solid #e2e8f0;">Important Dates</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${renderStringOrArray(analysis.dates)}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:8px 12px;font-weight:bold;color:#64748b;border:1px solid #e2e8f0;">Payment Terms</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${renderStringOrArray(analysis.payment_terms)}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:bold;color:#64748b;border:1px solid #e2e8f0;">Termination Triggers</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${renderStringOrArray(analysis.termination)}</td></tr>
            ${analysis.obligations ? `<tr style="background:#f1f5f9;"><td style="padding:8px 12px;font-weight:bold;color:#64748b;border:1px solid #e2e8f0;">Key Obligations</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${renderStringOrArray(analysis.obligations)}</td></tr>` : ""}
          </table>
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

  // Automatically clear previous analysis on selecting new file(s)
  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      [".pdf", ".docx", ".doc", ".txt"].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      )
    );
    if (validFiles.length > 0) {
      setAnalysis(null);
      setCurrentContractId(null);
      setMessage("");
      setFiles(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
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
          <p style={{ fontSize: "0.85rem", color: "#555", marginTop: "4px", lineHeight: "1.5" }}>
            {raw.split("-").slice(1).join("-").trim()}
          </p>
        )}
      </div>
    );
  };

  const activeContract = pastContracts.find((c) => c._id === currentContractId);
  const currentTitle = activeContract?.originalName || (analysis ? analysis.title : "Smart Contract Risk Auditor");

  return (
    <div className="contractAnalyzerPage">
      {/* -------------------------------------------------------------
          TOP NAVIGATION BAR (Uniform with Legal Assistant)
         ------------------------------------------------------------- */}
      <nav className="topBar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={() => navigate(-1)}
            className="navLink"
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            title="Go back"
          >
            ← Back
          </button>
          <Link to="/" className="brand">
            ⚖️ LegalSmiths
          </Link>
        </div>

        <div className="topBarNav">
          <Link to="/services" className="navLink">
            Services
          </Link>
          <button onClick={() => logout(navigate)} className="navLink">
            Logout
          </button>
        </div>
      </nav>

      {/* -------------------------------------------------------------
          MAIN CARD CONTAINER (White rounded card matching app design)
         ------------------------------------------------------------- */}
      <div className="mainContainer">
        {/* -----------------------------------------------------------
            SIDEBAR (#727374 App Color - Uniform with Legal Assistant)
           ----------------------------------------------------------- */}
        <aside className={`sidebar ${sidebarOpen ? "sidebarOpen" : ""}`}>
          {/* + New Contract Audit Button (#3437C2) */}
          <button className="newAuditBtn" onClick={handleStartNewAudit}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span>
            <span>New Contract Audit</span>
          </button>

          {/* Past Contracts Header */}
          <div className="sessionSectionHeader">
            <span className="sectionTitle">Previous Contracts</span>
            <span className="sessionBadge">{pastContracts.length}</span>
          </div>

          {/* Scrollable Contracts List */}
          <div className="contractList">
            {loadingHistory ? (
              <div className="emptyContracts">Loading saved contracts...</div>
            ) : pastContracts.length === 0 ? (
              <div className="emptyContracts">
                No saved contracts yet.
                <br />
                Upload or paste a contract to begin!
              </div>
            ) : (
              pastContracts.map((c) => {
                const isActive = c._id === currentContractId;
                const riskRaw = c.analysis?.risk_level || "";
                const isHigh = riskRaw.toLowerCase().includes("high");
                const isLow = riskRaw.toLowerCase().includes("low");
                const riskIcon = isHigh ? "🔴" : isLow ? "🟢" : "🟡";

                return (
                  <div
                    key={c._id}
                    className={`contractItem ${isActive ? "contractItemActive" : ""}`}
                    onClick={() => handleSelectContract(c)}
                    title={c.originalName}
                  >
                    <div className="contractTitleWrapper">
                      <span className="contractIcon">{riskIcon}</span>
                      <span className="contractTitleText">{c.originalName || "Contract Audit"}</span>
                    </div>

                    <button
                      className="contractDeleteBtn"
                      onClick={(e) => handleDeleteContract(c._id, e)}
                      title="Delete contract from vault"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* User Profile & Back to Services */}
          <div className="sidebarFooter">
            <div className="userBadge">
              <div className="userAvatar">
                {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
              </div>
              <div className="userDetails">
                <span className="userName">{currentUser?.name || "Legal User"}</span>
                <span className="userRole">{currentUser?.email || "Signed in"}</span>
              </div>
            </div>

            <button className="backBtn" onClick={() => navigate("/services")}>
              ← Back to Services
            </button>
          </div>
        </aside>
        {sidebarOpen && <div className="sidebarOverlay" onClick={() => setSidebarOpen(false)} />}

        {/* -----------------------------------------------------------
            MAIN CONTENT AREA (Right Panel)
           ----------------------------------------------------------- */}
        <main className="contentArea">
          {/* Header */}
          <header className="contentHeader">
            <div className="headerTitleGroup">
              <button
                className="mobileMenuBtn"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle history menu"
              >
                ☰
              </button>
              <button
                onClick={() => navigate(-1)}
                className="headerBackBtn"
                title="Back to previous page"
              >
                ← Back
              </button>
              <div style={{ overflow: "hidden" }}>
                <h2 className="contentTitle" title={currentTitle}>{currentTitle}</h2>
                <span className="contentSubtitle">Agentic Cross-Clause Legal Intelligence</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleStartNewAudit}
                style={{
                  background: "#3437C2",
                  color: "#ffffff",
                  border: "none",
                  padding: "7px 16px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + New Audit
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="contentBody">
            {/* Input Mode Selector */}
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "15px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setInputMode("file");
                  setAnalysis(null);
                  setMessage("");
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: inputMode === "file" ? "2px solid #3437C2" : "1px solid #cbd5e1",
                  background: inputMode === "file" ? "#3437C2" : "#ffffff",
                  color: inputMode === "file" ? "#ffffff" : "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                📁 Upload Contract File
              </button>
              <button
                onClick={() => {
                  setInputMode("text");
                  setAnalysis(null);
                  setMessage("");
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: inputMode === "text" ? "2px solid #3437C2" : "1px solid #cbd5e1",
                  background: inputMode === "text" ? "#3437C2" : "#ffffff",
                  color: inputMode === "text" ? "#ffffff" : "#334155",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                📝 Paste Contract Text
              </button>
            </div>

            {/* Upload / Input Card */}
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
                    <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#1e293b" }}>
                      Drag & Drop or <span style={{ color: "#3437C2", textDecoration: "underline" }}>Choose a File</span>
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
                    <div style={{ textAlign: "left", marginBottom: "15px", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontSize: "0.85rem", color: "#334155", margin: 0 }}>Selected File:</h4>
                        <button
                          onClick={() => {
                            setFiles([]);
                            setAnalysis(null);
                          }}
                          style={{ background: "none", border: "none", color: "#dc2626", fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      </div>
                      <ul style={{ fontSize: "0.8rem", color: "#475569", margin: "6px 0 0 0", paddingLeft: "20px" }}>
                        {files.map((file, index) => (
                          <li key={index}>📄 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginBottom: "15px" }}>
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
                        📄 <strong>Pasted Contract:</strong> {pastedText.split(/\s+/).filter(Boolean).length} words ({pastedText.length} chars)
                      </span>
                      <button
                        onClick={() => setIsTextCollapsed(false)}
                        style={{
                          background: "#3437C2",
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
                        <span>Paste contract clauses or complete agreement:</span>
                        {pastedText && (
                          <span>{pastedText.split(/\s+/).filter(Boolean).length} words ({pastedText.length} chars)</span>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        value={pastedText}
                        onChange={(e) => {
                          setPastedText(e.target.value);
                          if (analysis) setAnalysis(null);
                        }}
                        placeholder="Paste contract clauses, terms, or complete agreement text here for instant evidence-backed audit..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontFamily: "inherit",
                          fontSize: "0.85rem",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Analyze Button */}
              <button className="analyze-btn" onClick={analyzeWithFastAPI} disabled={analyzing}>
                {analyzing ? "Auditing Cross-Clause Risks with AI..." : "Analyze Contract"}
              </button>

              {/* Upload/Analysis progress bar */}
              {analyzing && (
                <div className="progress-bar">
                  <div className="progress"></div>
                  <div className="progress-text">
                    {"Evaluating cross-clause carve-outs & liabilities..."}
                  </div>
                </div>
              )}
              {message && <p className="progress-info">{message}</p>}
            </div>

            {/* Anchor for results */}
            <div ref={resultsRef}></div>

            {/* Auditing Capabilities Guide for Empty State */}
            {!analysis && !analyzing && (
              <div className="analyzerFeaturesGuide">
                <h3 className="guideTitle">What Smart Contract Auditor Evaluates</h3>
                <div className="guideGrid">
                  <div className="guideCard">
                    <div className="guideIcon">🛡️</div>
                    <h4>Financial Exposure & Liability</h4>
                    <p>Detects uncapped indemnification, consequential damages carve-outs, and asymmetrical payout obligations.</p>
                  </div>
                  <div className="guideCard">
                    <div className="guideIcon">⚖️</div>
                    <h4>Clause Symmetry & Fairness</h4>
                    <p>Identifies one-sided termination clauses, non-mutual IP assignments, and unreciprocated cure periods.</p>
                  </div>
                  <div className="guideCard">
                    <div className="guideIcon">🔍</div>
                    <h4>Evidence-Backed Red Flags</h4>
                    <p>Extracts exact verbatim clause citations with actionable drafting recommendations before signing.</p>
                  </div>
                  <div className="guideCard">
                    <div className="guideIcon">📑</div>
                    <h4>Multi-Format Vault Support</h4>
                    <p>Audit contracts from PDF, Word (.docx), or plain text, with automatic save and export to PDF/JSON.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Report Section */}
            {analysis && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "2rem 0 1rem", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{ fontSize: "1.4rem", margin: 0, color: "#1e1b4b", fontWeight: "700" }}>
                    Contract Audit Report
                  </h2>

                  {/* Export Bar */}
                  <div className="export-bar" style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleDownloadPDF}
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "7px 16px",
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
                        padding: "7px 16px",
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
                </div>

                {/* Title & Classification */}
                {analysis.title && (
                  <div className="component">
                    <h2>Document Classification</h2>
                    <p><strong>{analysis.title}</strong></p>
                    {analysis.analysis_metadata && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "6px" }}>
                        Audited via <strong>{analysis.analysis_metadata.retrieval_strategy === "complete_document_context" ? "Complete-Document Cross-Clause Verification" : "Hybrid RAG + Structural Outline"}</strong> ({analysis.analysis_metadata.document_length?.toLocaleString()} characters analyzed).
                      </div>
                    )}
                  </div>
                )}

                {/* Plain Summary */}
                <div className="component">
                  <h2>Executive Plain Summary</h2>
                  <div>{renderFormattedText(analysis.plain_summary)}</div>
                </div>

                {/* Quick Stats & Risk Rubric */}
                <div className="quickies">
                  <div className="component">
                    <h2>Risk Assessment</h2>
                    <div style={{ marginTop: "0.5rem" }}>
                      {renderRiskBadge(analysis.risk_level)}
                    </div>
                  </div>
                  <div className="component">
                    <h2>Red Flags Identified</h2>
                    <div className="value" style={{ color: "#dc2626" }}>
                      {getItemCount(analysis.red_flags)}
                    </div>
                  </div>
                  <div className="component">
                    <h2>Missing Protections</h2>
                    <div className="value" style={{ color: "#d97706" }}>
                      {getItemCount(analysis.missing_protections)}
                    </div>
                  </div>
                </div>

                {/* Risk Rubric Breakdown Matrix */}
                {analysis.risk_assessment?.rubric_breakdown && (
                  <div className="component">
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
                  {/* 1. Evidence-Backed Red Flags */}
                  {selectedTab === "redFlags" && (
                    <div>
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
                          if (typeof flag === "object" && flag !== null) {
                            const sev = String(flag.severity || "High").toLowerCase();
                            return (
                              <div key={index} className={`evidence-card ${sev}`}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                                  <div>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>RED FLAG #{index + 1}</span>
                                    <h3 style={{ margin: "2px 0 6px 0", fontSize: "1.05rem", color: "#1e293b", fontWeight: "bold" }}>
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

                                {flag.evidence && (
                                  <div className="evidence-quote-box">
                                    <span style={{ fontWeight: "600", fontStyle: "normal", fontSize: "0.75rem", display: "block", color: "#64748b", marginBottom: "4px" }}>
                                      📜 VERBATIM CONTRACT EVIDENCE:
                                    </span>
                                    &ldquo;{flag.evidence}&rdquo;
                                  </div>
                                )}

                                <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#334155" }}>
                                  <p style={{ margin: "0 0 6px 0" }}><strong>Legal Vulnerability:</strong> {flag.explanation}</p>
                                  {flag.impact && (
                                    <p style={{ margin: "0 0 6px 0", color: "#991b1b" }}>
                                      <strong>Financial / Operational Exposure:</strong> {flag.impact}
                                    </p>
                                  )}
                                </div>

                                {flag.recommendation && (
                                  <div style={{ marginTop: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", color: "#166534" }}>
                                    <strong>💡 Recommended Negotiation Action:</strong> {flag.recommendation}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={index} className="component">
                              <p>{flag}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  {/* 2. Missing Protections */}
                  {selectedTab === "missingProtections" && (
                    <div>
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

                  {/* 3. Key Terms */}
                  {selectedTab === "keyTerms" && (
                    <div>
                      <div className="component">
                        <h2>👥 Contracting Parties & Defined Roles</h2>
                        <div>{renderFormattedText(analysis.parties)}</div>
                      </div>

                      <div className="component">
                        <h2>📅 Important Dates & Term Milestones</h2>
                        <div>{renderFormattedText(analysis.dates)}</div>
                      </div>

                      <div className="component">
                        <h2>💳 Payment Terms & Financial Penalties</h2>
                        <div>{renderFormattedText(analysis.payment_terms)}</div>
                      </div>

                      <div className="component">
                        <h2>📋 Core Covenants & Performance Obligations</h2>
                        <div>{renderFormattedText(analysis.obligations)}</div>
                      </div>

                      <div className="component">
                        <h2>🚪 Termination Triggers & Cure Periods</h2>
                        <div>{renderFormattedText(analysis.termination)}</div>
                      </div>
                    </div>
                  )}

                  {/* 4. Mistakes & Ambiguities */}
                  {selectedTab === "mistakes" && (
                    <div>
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
                              <div key={index} className="component">
                                <p>{m}</p>
                              </div>
                            );
                          });
                        }

                        return (
                          <div className="component">
                            <div>{renderFormattedText(mistakes)}</div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 5. Actionable Recommendations */}
                  {selectedTab === "recommendations" && (
                    <div className="component">
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
                  )}
                </div>
              </div>
            )}
            {/* Bottom Back Button */}
            <div style={{ display: "flex", justifyContent: "center", margin: "2.5rem 0 1rem" }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  padding: "9px 24px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                ← Back to Previous Page
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContractAnalyzer;
