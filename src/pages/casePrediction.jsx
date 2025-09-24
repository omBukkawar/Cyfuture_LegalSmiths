import axios from "axios";
import { useState } from "react";
import "../styles/casePrediction.css";
import backgroundImg from "../assets/background.jpeg";
import { Link, useNavigate } from "react-router-dom";

const CasePrediction = () => {
  const navigate = useNavigate();

  // State management
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [showResults, setShowResults] = useState(false); // New state to control visibility

  // Case input for text-based analysis
  const [caseInput, setCaseInput] = useState("");

  // Analysis data (from FastAPI response)
  const [analysis, setAnalysis] = useState(null);

  // FastAPI integration for case prediction
  const analyzeCaseText = async () => {
    try {
      setAnalyzing(true);
      setMessage("");

      if (!caseInput.trim()) {
        setMessage("Please enter case details first!");
        return;
      }

      const response = await axios.post(
        "https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction",
        {
          questions: [caseInput]
        },
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          }
        }
      );

      const jsonData = response.data;
      console.log("Analysis data:", jsonData);

      if (jsonData.answers && jsonData.answers.length > 0) {
        setAnalysis(jsonData.answers[0]);
        setMessage("Analysis completed successfully!");
        setShowResults(true); // Show results and hide input section
      } else {
        setMessage("No analysis data received from the server.");
      }

    } catch (error) {
      console.error("Error:", error);
      setMessage(`Failed to analyze case: ${error.response?.data?.message || error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Function to start a new analysis (reset to input view)
  const startNewAnalysis = () => {
    setShowResults(false);
    setAnalysis(null);
    setCaseInput("");
    setMessage("");
  };

  // Helper function to render formatted text
  const renderFormattedText = (text) => {
    if (!text) return "N/A";
    if (typeof text === 'string') {
      return text.split('\n').map((paragraph, index) => (
        <span key={index}>
          {paragraph.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {index < text.split('\n').length - 1 && <br />}
        </span>
      ));
    }
    return text;
  };

  // Helper function to render array as list items
  const renderListItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
      return items.map((item, index) => (
        <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
      ));
    }
    if (typeof items === 'string') {
      // Split by numbered points or line breaks
      const points = items.split(/(?=\d+\.\s)|\n/).filter(point => point.trim().length > 0);
      return points.map((point, index) => (
        <li key={index}>{point.replace(/^\d+\.\s*/, '').trim()}</li>
      ));
    }
    return [<li key={0}>{JSON.stringify(items)}</li>];
  };

  return (
    <div
      className="case-prediction"
      style={{ backgroundImage: `url(${backgroundImg})` }}
    >
      {/* Top bar */}
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <Link to="/login" className="login-link">
          Logout
        </Link>
      </div>

      <div className="case-container">
        <h1 className="title">Case Outcome Prediction</h1>
        <p className="description">
          Leverage AI to forecast your winning probability, uncover red flags
          with explanations, and receive data-driven strategy suggestions.
        </p>
        <br></br>

        {/* Conditionally render Case Input Section or Results */}
        {!showResults ? (
          <>
            {/* Case Input Section */}
            <div className="input-section">
              <h3>Enter Case Details</h3>
              <textarea
                className="case-input"
                value={caseInput}
                onChange={(e) => setCaseInput(e.target.value)}
                placeholder="Enter your case details here..."
                rows={15}
                style={{
                  width: '100%',
                  minWidth: '100%',
                  maxWidth: '100%',
                  border: '1px solid #ccc',
                  padding: '8px',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
              <button
                className="analyze-btn"
                onClick={analyzeCaseText}
                disabled={analyzing || !caseInput.trim()}
              >
                {analyzing ? "Analyzing..." : "Predict Case Outcome"}
              </button>
            </div>

            {/* Progress and status messages */}
            {analyzing && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div className="progress"></div>
                </div>
                <div className="progress-text">
                  Analyzing case...
                </div>
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{
              color: 'green',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '20px',
              marginTop: '10px'
            }}>{message}</p>
            {/* Case Report */}
            <div className="report-section">
              <h2 className="section-title">Case Prediction Report</h2>
              {analysis && (
                <div className="analysis-results">
                  <div className="grid-layout">
                    <div className="grid-item grid-win">
                      <h3>Winning Probability</h3>
                      <div className="winning-chart">
                        <span className="percentage">
                          {analysis?.successProbability || analysis?.winningProbability || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="grid-item grid-court">
                      <h3>Petitioner</h3>
                      <p className="key">{analysis?.petitioner || "Not specified"}</p>
                    </div>

                    <div className="grid-item grid-sentiment">
                      <h3>Respondent</h3>
                      <p className="key">{analysis?.respondent || "Not specified"}</p>
                    </div>

                    <div className="grid-item grid-case-type">
                      <h3>Case Type</h3>
                      <p className="key">{analysis?.title || analysis?.caseType || "Not specified"}</p>
                    </div>

                  </div>
                  <div className="analysis-stack">
                    <div className="grid-item grid-reasons">
                      <h3>Likely Outcome</h3>
                      {analysis?.likelyOutcome ? (
                        <div>
                          {renderFormattedText(analysis.likelyOutcome)}
                        </div>
                      ) : (
                        <p>No outcome prediction available.</p>
                      )}
                    </div>

                    <div className="grid-item grid-strategies">
                      <h3>Strategy Suggestions</h3>
                      {analysis?.strategies ? (
                        <ul>
                          {renderListItems(analysis.strategies)}
                        </ul>
                      ) : (
                        <p>No strategy suggestions available.</p>
                      )}
                    </div>

                    <div className="grid-item grid-red">
                      <h3>Weak Points</h3>
                      {analysis?.strongPoints ? (
                        <ul>
                          {renderListItems(analysis.weakPoints)}
                        </ul>
                      ) : (
                        <p>No weak points identified.</p>
                      )}
                    </div>

                    <div className="grid-item grid-green">
                      <h3>Strong Points</h3>
                      {analysis?.strongPoints ? (
                        <ul>
                          {renderListItems(analysis.strongPoints)}
                        </ul>
                      ) : (
                        <p>No strong points identified.</p>
                      )}
                    </div>

                    <div className="grid-item grid-feedback">
                      <h3>Final Advisory</h3>
                      {analysis?.finalAdvisory ? (
                        <div>
                          {renderFormattedText(analysis.finalAdvisory)}
                        </div>
                      ) : (
                        <p>No advisory available.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button className="back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
};

export default CasePrediction;