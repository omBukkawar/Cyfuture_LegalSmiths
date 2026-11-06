import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import "../styles/casePrediction.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { AI_API_URL, NODE_API_URL, getAuthHeaders } from "../config/api";
import { getUser, logout } from "../utils/auth";

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Returns a CSS class suffix based on winning_side value */
const verdictClass = (verdict) => {
  if (!verdict) return "tie";
  const v = verdict.toLowerCase();
  if (v === "claimant") return "claimant";
  if (v === "defence") return "defence";
  return "tie";
};

/** Safe array renderer */
const safeArray = (val) => (Array.isArray(val) ? val : []);

/** Render plain text with markdown bold */
const RichText = ({ text }) => {
  if (!text) return <span className="muted">Not provided</span>;
  return (
    <span>
      {String(text)
        .split("\n")
        .map((line, i) => (
          <span key={i}>
            {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              )
            )}
            {i < String(text).split("\n").length - 1 && <br />}
          </span>
        ))}
    </span>
  );
};

/** Score bar component */
const ScoreBar = ({ label, value }) => {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 5);
  const percent = (pct / 5) * 100;
  return (
    <div className="score-bar-row">
      <span className="score-label">{label}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="score-val">{pct}/5</span>
    </div>
  );
};

/** Priority badge */
const PriorityBadge = ({ priority }) => (
  <span className={`priority-badge priority-${(priority || "low").toLowerCase()}`}>
    {(priority || "—").toUpperCase()}
  </span>
);

/** Verification badge */
const VerifBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  const cls = s.includes("verified") && !s.includes("un")
    ? "verif-ok"
    : s.includes("unverified") || s.includes("partial")
    ? "verif-warn"
    : "verif-unknown";
  return <span className={`verif-badge ${cls}`}>{status || "—"}</span>;
};

// ─── CasePrediction component ─────────────────────────────────────────────────

const CasePrediction = () => {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [caseInput, setCaseInput] = useState("");
  const [caseType, setCaseType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("India");
  const [incidentDate, setIncidentDate] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Sidebar history state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pastCases, setPastCases] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentCaseId, setCurrentCaseId] = useState(null);

  const fetchPastCases = useCallback(async () => {
    try {
      const headers = { ...getAuthHeaders(), "x-user-id": currentUser?.id || "anonymous" };
      const res = await axios.get(`${NODE_API_URL}/cases`, { headers });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPastCases(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch past cases:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id]);

  useEffect(() => { fetchPastCases(); }, [fetchPastCases]);

  const handleSelectCase = (c) => {
    if (!c?.prediction) return;
    setCurrentCaseId(c._id);
    setAnalysis(c.prediction);
    setCaseInput(c.caseFacts || "");
    setShowResults(true);
    setActiveTab("overview");
    setMessage("");
    setSidebarOpen(false);
  };

  const handleDeleteCase = async (caseId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this case prediction?")) return;
    try {
      const headers = { ...getAuthHeaders(), "x-user-id": currentUser?.id || "anonymous" };
      await axios.delete(`${NODE_API_URL}/cases/${caseId}`, { headers });
      setPastCases((prev) => prev.filter((c) => c._id !== caseId));
      if (currentCaseId === caseId) startNewAnalysis();
    } catch (err) {
      alert("Failed to delete case.");
    }
  };

  const saveCaseToDatabase = async (prediction, facts) => {
    try {
      const headers = { ...getAuthHeaders(), "x-user-id": currentUser?.id || "anonymous" };
      const title = facts ? facts.slice(0, 60) + (facts.length > 60 ? "..." : "") : "Legal Case Assessment";
      const res = await axios.post(
        `${NODE_API_URL}/cases/save-prediction`,
        { prediction, caseFacts: facts, title },
        { headers }
      );
      if (res.data?.success && res.data.doc) {
        setCurrentCaseId(res.data.doc._id);
        fetchPastCases();
      }
    } catch (err) {
      console.warn("Could not save case prediction:", err.message);
    }
  };

  // Pipeline stages shown during loading
  const stages = [
    "🔍 Researching Indian statutes and precedents...",
    "⚖️ Formulating Claimant Legal Brief...",
    "🛡️ Formulating Defence Written Statement...",
    "📋 Auditing statutory citations...",
    "🧑‍⚖️ Conducting judicial assessment & ruling...",
  ];
  const [stageIdx, setStageIdx] = useState(0);

  const startStageTimer = () => {
    setStageIdx(0);
    const handle = setInterval(() => {
      setStageIdx((prev) => {
        if (prev >= stages.length - 1) {
          clearInterval(handle);
          return prev;
        }
        return prev + 1;
      });
    }, 12000);
    return handle;
  };

  const analyzeCaseText = async () => {
    if (!caseInput.trim()) {
      setMessage("Please enter case details first!");
      return;
    }
    setAnalyzing(true);
    setMessage("");
    setCurrentCaseId(null);
    const timer = startStageTimer();

    try {
      const response = await axios.post(
        `${AI_API_URL}/caseoutcomeprediction`,
        {
          questions: [caseInput],
          case_type: caseType || "unspecified",
          jurisdiction: jurisdiction || "India",
          incident_date: incidentDate || "",
        },
        { headers: { "Content-Type": "application/json" } }
      );

      clearInterval(timer);
      const jsonData = response.data;
      if (jsonData.answers && jsonData.answers.length > 0) {
        const result = jsonData.answers[0];
        setAnalysis(result);
        setShowResults(true);
        setMessage("Legal case outcome analysis complete!");
        setActiveTab("overview");
        await saveCaseToDatabase(result, caseInput);
      } else {
        setMessage("No analysis data received from the server.");
      }
    } catch (error) {
      clearInterval(timer);
      console.error("Error:", error);
      setMessage(`Analysis failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const startNewAnalysis = () => {
    setShowResults(false);
    setAnalysis(null);
    setCaseInput("");
    setCaseType("");
    setJurisdiction("India");
    setIncidentDate("");
    setMessage("");
    setStageIdx(0);
    setCurrentCaseId(null);
    setSidebarOpen(false);
  };

  // ─── Render results tabs ────────────────────────────────────────────────────

  const a = analysis || {};
  const scorecard = a.side_by_side_scorecard || {};
  const claimantScore = scorecard.claimant || {};
  const defenceScore = scorecard.defence || {};
  const caseTheory = a.case_theory || {};
  const claimantAnalysis = a.claimant_analysis || {};
  const defenceAnalysis = a.defence_analysis || {};
  const clashes = safeArray(a.point_by_point_clashes);
  const precedents = safeArray(a.precedent_and_authority_analysis);
  const nextSteps = safeArray(a.tactical_next_steps_for_lawyer);
  const realWorld = a.real_world_case_assessment || {};
  const adversarialQuality = a.adversarial_quality || {};
  const sourceWarnings = safeArray(a.source_verification_warnings);

  const tabs = [
    { id: "overview", label: "⚖️ Verdict" },
    { id: "advocates", label: "🗣️ Advocates" },
    { id: "clashes", label: "⚔️ Clashes" },
    { id: "precedents", label: "📚 Precedents" },
    { id: "strategy", label: "🎯 Strategy" },
  ];

  const renderOverview = () => (
    <div className="tab-content">
      {/* Verdict hero */}
      <div className={`verdict-hero verdict-${verdictClass(a.winning_side)}`}>
        <div className="verdict-badge">
          {(a.comparative_verdict || "INSUFFICIENT_ARGUMENTS").replace(/_/g, " ")}
        </div>
        <div className="verdict-winner">
          Stronger side:{" "}
          <strong>
            {a.winning_side
              ? a.winning_side.charAt(0).toUpperCase() + a.winning_side.slice(1)
              : "—"}
          </strong>
        </div>
        <div className="verdict-summary">
          <RichText text={a.verdict_summary} />
        </div>
        <div className="confidence-row">
          <span className="conf-label">Confidence</span>
          <div className="conf-track">
            <div
              className="conf-fill"
              style={{ width: `${Math.min(Number(a.confidence_score) || 0, 100)}%` }}
            />
          </div>
          <span className="conf-val">{a.confidence_score ?? 0}/100</span>
        </div>
        <p className="conf-basis muted">{a.confidence_basis}</p>
      </div>

      {/* Case theory */}
      <div className="section-card">
        <h3 className="card-heading">📌 Case Theory</h3>
        <div className="theory-grid">
          <div className="theory-item">
            <div className="theory-label claimant-label">Claimant Theory</div>
            <RichText text={caseTheory.claimant_theory} />
          </div>
          <div className="theory-item">
            <div className="theory-label defence-label">Defence Theory</div>
            <RichText text={caseTheory.defence_theory} />
          </div>
        </div>
        {caseTheory.central_dispute && (
          <div className="central-dispute">
            <strong>Central Dispute: </strong>
            <RichText text={caseTheory.central_dispute} />
          </div>
        )}
      </div>

      {/* Scorecard */}
      <div className="section-card">
        <h3 className="card-heading">📊 Side-by-Side Scorecard</h3>
        <div className="scorecard-grid">
          {[
            { key: "legal_rule_application", label: "Legal Rule Application" },
            { key: "evidence_fit", label: "Evidence Fit" },
            { key: "reasoning", label: "Reasoning" },
            { key: "rebuttal_tactics", label: "Rebuttal Tactics" },
            { key: "authority_quality", label: "Authority Quality" },
          ].map(({ key, label }) => (
            <div key={key} className="scorecard-row">
              <div className="sc-metric">{label}</div>
              <div className="sc-side">
                <span className="sc-side-label claimant-label">Claimant</span>
                <ScoreBar value={claimantScore[key]} />
              </div>
              <div className="sc-side">
                <span className="sc-side-label defence-label">Defence</span>
                <ScoreBar value={defenceScore[key]} />
              </div>
            </div>
          ))}
        </div>
        {claimantScore.score_rationale && (
          <p className="score-rationale">
            <strong>Claimant rationale: </strong>
            <RichText text={claimantScore.score_rationale} />
          </p>
        )}
        {defenceScore.score_rationale && (
          <p className="score-rationale">
            <strong>Defence rationale: </strong>
            <RichText text={defenceScore.score_rationale} />
          </p>
        )}
      </div>

      {/* Overall reasoning */}
      <div className="section-card">
        <h3 className="card-heading">🧠 Overall Comparative Reasoning</h3>
        <RichText text={a.overall_comparative_reasoning} />
      </div>

      {/* Real world assessment */}
      <div className="section-card rw-card">
        <h3 className="card-heading">🌍 Real-World Case Assessment</h3>
        <span className={`rw-status ${(realWorld.status || "").toLowerCase()}`}>
          {realWorld.status || "—"}
        </span>
        <p><RichText text={realWorld.assessment} /></p>
        {safeArray(realWorld.key_uncertainties).length > 0 && (
          <>
            <strong>Key uncertainties:</strong>
            <ul className="bullet-list">
              {safeArray(realWorld.key_uncertainties).map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </>
        )}
        {realWorld.do_not_treat_as_calibrated_probability && (
          <p className="disclaimer-note">
            ⚠️ Do not treat this as a calibrated court-outcome probability.
          </p>
        )}
      </div>

      {/* Disclaimer */}
      {a.disclaimer && (
        <p className="disclaimer">{a.disclaimer}</p>
      )}

      {/* Source warnings */}
      {sourceWarnings.length > 0 && (
        <div className="section-card warn-card">
          <h3 className="card-heading">⚠️ Source Verification Warnings</h3>
          <ul className="bullet-list">
            {sourceWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderAdvocates = () => {
    const renderSideAnalysis = (data, side) => (
      <div className={`advocate-card advocate-${side}`}>
        <h4 className={`advocate-heading ${side}-label`}>
          {side === "claimant" ? "⚖️ Claimant Analysis" : "🛡️ Defence Analysis"}
        </h4>
        {data.position_actually_taken && (
          <div className="adv-position">
            <strong>Position taken: </strong>
            <RichText text={data.position_actually_taken} />
          </div>
        )}

        {safeArray(data.winning_points).length > 0 && (
          <>
            <h5>✅ Winning Points</h5>
            {safeArray(data.winning_points).map((pt, i) => (
              <div key={i} className="point-card win-point">
                <div className="point-header">{pt.point || `Point ${i + 1}`}</div>
                {pt.legal_rule_or_element && (
                  <p><span className="pill">Rule</span> {pt.legal_rule_or_element}</p>
                )}
                {pt.fact_and_evidence_link && (
                  <p><span className="pill">Evidence</span> {pt.fact_and_evidence_link}</p>
                )}
                {pt.why_it_is_persuasive && (
                  <p><span className="pill">Why persuasive</span> {pt.why_it_is_persuasive}</p>
                )}
                {pt.opponent_counterattack && (
                  <p><span className="pill red-pill">Counter</span> {pt.opponent_counterattack}</p>
                )}
                {pt.best_tactical_response && (
                  <p><span className="pill">Response</span> {pt.best_tactical_response}</p>
                )}
                {pt.support_status && (
                  <VerifBadge status={pt.support_status} />
                )}
              </div>
            ))}
          </>
        )}

        {safeArray(data.weak_points_and_exposure).length > 0 && (
          <>
            <h5>⚠️ Weak Points & Exposure</h5>
            {safeArray(data.weak_points_and_exposure).map((wp, i) => (
              <div key={i} className="point-card weak-point">
                <div className="point-header">{wp.weakness || `Weakness ${i + 1}`}</div>
                {wp.why_it_matters && <p>{wp.why_it_matters}</p>}
                {(wp.how_defence_can_exploit_it || wp.how_claimant_can_exploit_it) && (
                  <p>
                    <span className="pill red-pill">Exploit</span>{" "}
                    {wp.how_defence_can_exploit_it || wp.how_claimant_can_exploit_it}
                  </p>
                )}
                {wp.repair_strategy && (
                  <p><span className="pill">Repair</span> {wp.repair_strategy}</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );

    return (
      <div className="tab-content advocates-grid">
        {renderSideAnalysis(claimantAnalysis, "claimant")}
        {renderSideAnalysis(defenceAnalysis, "defence")}
      </div>
    );
  };

  const renderClashes = () => (
    <div className="tab-content">
      <h3 className="card-heading">⚔️ Point-by-Point Clashes</h3>
      {clashes.length === 0 ? (
        <p className="muted">No clashes available.</p>
      ) : (
        clashes.map((clash, i) => (
          <div key={i} className="clash-card">
            <div className="clash-issue">{clash.issue || `Issue ${i + 1}`}</div>
            <div className="clash-sides">
              <div className="clash-side claimant-side">
                <div className="clash-side-label claimant-label">Claimant</div>
                <RichText text={clash.claimant_position} />
              </div>
              <div className="clash-side defence-side">
                <div className="clash-side-label defence-label">Defence</div>
                <RichText text={clash.defence_position} />
              </div>
            </div>
            <div className="clash-footer">
              <span
                className={`clash-winner ${(clash.stronger_on_this_point || "").toLowerCase()}`}
              >
                Stronger: {clash.stronger_on_this_point || "Unresolved"}
              </span>
              {clash.reason && (
                <p className="clash-reason"><RichText text={clash.reason} /></p>
              )}
              {clash.evidence_that_would_resolve_it && (
                <p className="clash-evidence">
                  <span className="pill">Evidence needed</span>{" "}
                  {clash.evidence_that_would_resolve_it}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPrecedents = () => (
    <div className="tab-content">
      <h3 className="card-heading">📚 Precedent & Authority Analysis</h3>
      {precedents.length === 0 ? (
        <p className="muted">No precedents cited.</p>
      ) : (
        precedents.map((p, i) => (
          <div key={i} className="precedent-card">
            <div className="prec-header">
              <span className="prec-name">{p.authority_name_and_citation || `Authority ${i + 1}`}</span>
              <VerifBadge status={p.verification_status} />
            </div>
            {p.legal_proposition && (
              <p><strong>Proposition: </strong>{p.legal_proposition}</p>
            )}
            {p.material_facts_and_holding && (
              <p><strong>Holding: </strong>{p.material_facts_and_holding}</p>
            )}
            <div className="prec-sides">
              {p.analogy_or_distinction_for_claimant && (
                <div className="prec-side">
                  <div className="prec-side-label claimant-label">Claimant angle</div>
                  {p.analogy_or_distinction_for_claimant}
                </div>
              )}
              {p.analogy_or_distinction_for_defence && (
                <div className="prec-side">
                  <div className="prec-side-label defence-label">Defence angle</div>
                  {p.analogy_or_distinction_for_defence}
                </div>
              )}
            </div>
            {p.source_url && (
              <a
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                🔗 Source
              </a>
            )}
            {p.research_action && (
              <p className="muted">📝 {p.research_action}</p>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderStrategy = () => (
    <div className="tab-content">
      <h3 className="card-heading">🎯 Tactical Next Steps for Lawyer</h3>
      {nextSteps.length === 0 ? (
        <p className="muted">No next steps available.</p>
      ) : (
        nextSteps.map((step, i) => (
          <div key={i} className="step-card">
            <div className="step-header">
              <PriorityBadge priority={step.priority} />
              <span
                className={`step-side-badge ${(step.which_side_it_helps || "both").toLowerCase()}`}
              >
                Helps: {step.which_side_it_helps || "—"}
              </span>
            </div>
            <div className="step-action">{step.action || "—"}</div>
            {step.why_it_matters && (
              <p className="step-why"><RichText text={step.why_it_matters} /></p>
            )}
            {step.evidence_or_document_to_obtain && (
              <p className="step-evidence">
                <span className="pill">Obtain</span> {step.evidence_or_document_to_obtain}
              </p>
            )}
          </div>
        ))
      )}

      {/* Adversarial quality */}
      {adversarialQuality && (
        <div className="section-card" style={{ marginTop: "1.5rem" }}>
          <h3 className="card-heading">🔎 Adversarial Quality Check</h3>
          <table className="aq-table">
            <tbody>
              <tr>
                <td>Claimant argued assigned side</td>
                <td>{adversarialQuality.claimant_argued_assigned_side ? "✅ Yes" : "❌ No"}</td>
              </tr>
              <tr>
                <td>Defence argued assigned side</td>
                <td>{adversarialQuality.defence_argued_assigned_side ? "✅ Yes" : "❌ No"}</td>
              </tr>
              <tr>
                <td>Adversarial failure</td>
                <td>{adversarialQuality.adversarial_failure ? "⚠️ Yes" : "✅ No"}</td>
              </tr>
            </tbody>
          </table>
          {adversarialQuality.explanation && (
            <p className="muted">{adversarialQuality.explanation}</p>
          )}
        </div>
      )}
    </div>
  );

  const tabRenderers = {
    overview: renderOverview,
    advocates: renderAdvocates,
    clashes: renderClashes,
    precedents: renderPrecedents,
    strategy: renderStrategy,
  };

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div
      className="case-prediction"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <button
            onClick={() => navigate(-1)}
            className="login-link"
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="Go back to previous page"
          >
            ← Back
          </button>
          <Link to="/" className="brand">LegalSmiths</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <Link to="/services" className="login-link">Services</Link>
          <button
            onClick={() => logout(navigate)}
            className="login-link"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", fontFamily: "inherit" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main layout with sidebar */}
      <div className="cp-main-layout">
        {/* Sidebar */}
        <aside className={`cp-sidebar ${sidebarOpen ? "cp-sidebar-open" : ""}`}>
          <button className="cp-new-btn" onClick={startNewAnalysis}>
            <span>+</span> New Case Analysis
          </button>

          <div className="cp-sidebar-section-header">
            <span className="cp-section-title">Past Predictions</span>
            <span className="cp-session-badge">{pastCases.length}</span>
          </div>

          <div className="cp-case-list">
            {loadingHistory ? (
              <div className="cp-empty">Loading saved cases...</div>
            ) : pastCases.length === 0 ? (
              <div className="cp-empty">No saved cases yet.<br />Run an analysis to begin!</div>
            ) : (
              pastCases.map((c) => {
                const isActive = c._id === currentCaseId;
                const verdict = c.prediction?.winning_side || "";
                const icon = verdict === "claimant" ? "🔵" : verdict === "defence" ? "🟣" : "⚖️";
                return (
                  <div
                    key={c._id}
                    className={`cp-case-item ${isActive ? "cp-case-item-active" : ""}`}
                    onClick={() => handleSelectCase(c)}
                    title={c.title}
                  >
                    <div className="cp-case-title-wrapper">
                      <span>{icon}</span>
                      <span className="cp-case-title-text">{c.title || "Legal Case"}</span>
                    </div>
                    <button
                      className="cp-delete-btn"
                      onClick={(e) => handleDeleteCase(c._id, e)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="cp-sidebar-footer">
            <div className="cp-user-badge">
              <div className="cp-user-avatar">
                {(currentUser?.name || currentUser?.email || "U")[0].toUpperCase()}
              </div>
              <div className="cp-user-details">
                <span className="cp-user-name">{currentUser?.name || "Legal User"}</span>
                <span className="cp-user-role">{currentUser?.email || "Signed in"}</span>
              </div>
            </div>
            <button className="cp-back-services-btn" onClick={() => navigate("/services")}>
              ← Back to Services
            </button>
          </div>
        </aside>
        {sidebarOpen && <div className="cp-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Content */}
        <div className="cp-content">
          {/* Mobile menu + header */}
          <div className="cp-content-header">
            <button className="cp-mobile-menu-btn" onClick={() => setSidebarOpen((p) => !p)}>☰</button>
            <h1 className="cp-content-title">⚖️ Case Outcome Prediction</h1>
          </div>

      <div className="case-container">
        <p className="description">
          Professional legal case assessment — Claimant Brief vs Defence Written Statement evaluated
          under Indian statutory law and judicial precedents.
        </p>

        {!showResults ? (
          /* ── Input form ── */
          <div className="input-panel">
            <div className="form-group">
              <label className="form-label">Case Facts *</label>
              <textarea
                className="case-input"
                id="caseFactsInput"
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
                placeholder="Describe the case in detail — parties involved, facts, claims, dates, relevant statutes…"
                rows={12}
              />
            </div>

            <div className="meta-grid">
              <div className="form-group">
                <label className="form-label">Case Type</label>
                <input
                  className="meta-input"
                  id="caseTypeInput"
                  type="text"
                  placeholder="e.g. Consumer dispute, Criminal, Civil"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jurisdiction</label>
                <input
                  className="meta-input"
                  id="jurisdictionInput"
                  type="text"
                  placeholder="e.g. Delhi High Court, India"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Incident Date</label>
                <input
                  className="meta-input"
                  id="incidentDateInput"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </div>
            </div>

            <button
              className="analyze-btn"
              id="predictBtn"
              onClick={analyzeCaseText}
              disabled={analyzing || !caseInput.trim()}
            >
              {analyzing ? "Analyzing…" : "⚖️ Run Professional Legal Analysis"}
            </button>

            {analyzing && (
              <div className="pipeline-progress">
                <div className="pipeline-spinner" />
                <div className="pipeline-stage">{stages[stageIdx]}</div>
                <p className="pipeline-note">
                  Streamlined legal assessment pipeline. Typical time: 1–2 minutes.
                </p>
              </div>
            )}

            {message && (
              <div className={`msg-banner ${message.toLowerCase().includes("fail") ? "msg-error" : "msg-info"}`}>
                {message}
              </div>
            )}
          </div>
        ) : (
          /* ── Results ── */
          <div className="results-panel">
            {message && <div className="msg-banner msg-success">{message}</div>}

            <h2 className="results-heading">📋 Professional Case Assessment Report</h2>

            {/* Tab bar */}
            <div className="tab-bar" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tabRenderers[activeTab]?.()}

            <div className="results-footer">
              <button className="analyze-btn" onClick={startNewAnalysis}>
                + Analyze Another Case
              </button>
            </div>
          </div>
        )}

        <button className="back-btn" id="backBtn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default CasePrediction;
