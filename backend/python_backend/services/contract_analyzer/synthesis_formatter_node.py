import re
import json
from typing import Dict, Any, List
from services.contract_analyzer.state import ContractAnalyzerState
from models.llm import get_contract_analyzer_llm

try:
    from langchain.prompts import PromptTemplate
except ImportError:
    class PromptTemplate:
        @classmethod
        def from_template(cls, template: str):
            class _T:
                def __init__(self, t): self.t = t
                def format(self, **kwargs): return self.t.format(**kwargs)
            return _T(template)


SYNTHESIS_PROMPT = """You are an Executive Legal Strategist and Senior Commercial Counsel.
Review the extracted operational terms and the evidence-backed risk audit findings below.

Synthesize an executive summary and strategic recommendations for executive leadership.

Extracted Operational Terms:
Parties: {parties}
Dates: {dates}
Payment Terms: {payment_terms}
Obligations: {obligations}
Termination: {termination}

Risk Audit Findings:
Risk Level: {risk_level}
Red Flags (Evidence-Backed): {red_flags}
Missing Protections / Omissions: {missing_protections}
Mistakes & Ambiguities: {mistakes}

Return ONLY a valid JSON object with the following exact keys:
{{
  "title": "A professional executive title, e.g., 'Commercial Contract Risk Audit: [Agreement Name / Parties]'",
  "plain_summary": "A clear, 3–4 sentence executive summary written in plain everyday English that a CEO or non-lawyer can immediately understand, highlighting whether the agreement is commercially viable and what the primary financial vulnerability is.",
  "recommendations": "Actionable, numbered negotiation amendments and specific revised clause text recommended before signing or executing this agreement."
}}

CRITICAL: Return ONLY valid JSON format. No conversational text outside the JSON.

JSON Summary & Recommendations:"""


def parse_synthesis_json(raw_text: str) -> Dict[str, Any]:
    """Parses synthesis JSON safely, falling back to field regex extraction if inner quotes are unescaped."""
    cleaned = raw_text.strip()
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)

    json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    target = json_match.group(0) if json_match else cleaned

    try:
        return json.loads(target)
    except Exception:
        pass

    # Resilient field-level regex extraction if LLM didn't escape inner quotes
    extracted = {}
    title_match = re.search(r'"title"\s*:\s*"(.*?)"(?:\s*,|\s*\n|\s*})', target, re.DOTALL)
    if title_match:
        extracted["title"] = title_match.group(1).replace('\\"', '"')

    summary_match = re.search(r'"plain_summary"\s*:\s*"(.*?)"(?:\s*,|\s*\n\s*"recommendations"|\s*})', target, re.DOTALL)
    if summary_match:
        extracted["plain_summary"] = summary_match.group(1).replace('\\"', '"')

    rec_match = re.search(r'"recommendations"\s*:\s*"(.*?)"(?:\s*})', target, re.DOTALL)
    if rec_match:
        extracted["recommendations"] = rec_match.group(1).replace('\\"', '"')

    if extracted:
        return extracted

    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Synthesis Node] JSON parsing warning: {e}")
        return {}


def synthesis_formatter_node(state: ContractAnalyzerState) -> ContractAnalyzerState:
    """
    Node 4: Synthesis & Final Comprehensive Formatter Agent.
    
    ENGINEERING IMPROVEMENTS:
    - Integrates evidence-backed red flags, missing protections, and rubric breakdown.
    - Preserves rich structured findings while ensuring 100% backward compatibility
      with existing frontends and APIs.
    - Appends audit metadata: retrieval strategy, document length, and risk score breakdown.
    """
    if not state.get("is_valid_doc", True):
        error_msg = state.get("doc_error", "Invalid or unreadable document.")
        state["final_analysis"] = {
            "title": "Contract Analysis Error",
            "parties": "No document content available",
            "dates": "No document content available",
            "payment_terms": "No document content available",
            "obligations": "No document content available",
            "termination": "No document content available",
            "mistakes_ambiguities": error_msg,
            "red_flags": [error_msg],
            "missing_protections": [],
            "risk_assessment": {
                "overall_level": "Unknown",
                "score_rationale": error_msg,
                "rubric_breakdown": {}
            },
            "plain_summary": f"Analysis could not proceed: {error_msg}",
            "risk_level": "Unknown",
            "recommendations": "Please ensure the uploaded file contains readable text or OCR.",
            "analysis_metadata": {
                "retrieval_strategy": "failed",
                "document_length": 0
            }
        }
        return state

    extracted = state.get("extracted_terms", {})
    risk = state.get("risk_audit", {})

    print("[Synthesis Node] Synthesizing executive summary and assembling comprehensive audit report...")

    red_flags_list = risk.get("red_flags", [])
    missing_protections_list = risk.get("missing_protections", [])
    mistakes_list = risk.get("mistakes_ambiguities", [])
    risk_assessment = risk.get("risk_assessment", {})

    prompt = PromptTemplate.from_template(SYNTHESIS_PROMPT).format(
        parties=extracted.get("parties", "Not specified"),
        dates=extracted.get("dates", "Not specified"),
        payment_terms=extracted.get("payment_terms", "Not specified"),
        obligations=extracted.get("obligations", "Not specified"),
        termination=extracted.get("termination", "Not specified"),
        risk_level=risk.get("risk_level", "Medium"),
        red_flags=json.dumps(red_flags_list[:6]),
        missing_protections=json.dumps(missing_protections_list[:4]),
        mistakes=json.dumps(mistakes_list[:4]),
    )

    try:
        llm = get_contract_analyzer_llm()
        response = llm.invoke(prompt)
        synth = parse_synthesis_json(response.content)

        title = synth.get("title", "Contract Risk & Liability Analysis Report")
        plain_summary = synth.get("plain_summary", "Contract analysis completed.")
        recommendations = synth.get("recommendations", "Review all marked red flags before signing.")
    except Exception as e:
        print(f"[Synthesis Node] Error generating summary: {e}")
        title = "Contract Risk & Liability Analysis Report"
        plain_summary = "Contract terms and operational risks have been audited."
        recommendations = "Review red flags and negotiate terms with counterparty."

    # Final assembled payload
    state["final_analysis"] = {
        "title": title,
        "parties": extracted.get("parties", "Not specified"),
        "dates": extracted.get("dates", "Not specified"),
        "payment_terms": extracted.get("payment_terms", "Not specified"),
        "obligations": extracted.get("obligations", "Not specified"),
        "termination": extracted.get("termination", "Not specified"),
        "mistakes_ambiguities": mistakes_list if mistakes_list else "None identified",
        "red_flags": red_flags_list if red_flags_list else ["Review contract terms."],
        "missing_protections": missing_protections_list,
        "risk_assessment": risk_assessment,
        "plain_summary": plain_summary,
        "risk_level": risk.get("risk_level", "Medium"),
        "recommendations": recommendations,
        "analysis_metadata": {
            "retrieval_strategy": state.get("retrieval_strategy", "standard"),
            "document_length": state.get("document_length", 0),
            "red_flags_count": len(red_flags_list),
            "missing_protections_count": len(missing_protections_list),
        }
    }

    print(f"[Synthesis Node] Final contract analysis assembled ({len(red_flags_list)} red flags, {len(missing_protections_list)} missing protections).")
    return state
