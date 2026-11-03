import re
import json
from typing import Dict, Any
from services.contract_analyzer.state import ContractAnalyzerState
from models.llm import get_contract_analyzer_llm
from config.settings import CONTRACT_ANALYZER_MODELS

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
Review the extracted operational terms and the risk audit findings below.

Synthesize an executive summary and strategic recommendations for the client.

Extracted Operational Terms:
Parties: {parties}
Dates: {dates}
Payment Terms: {payment_terms}
Obligations: {obligations}
Termination: {termination}

Risk Audit Findings:
Risk Level: {risk_level}
Red Flags: {red_flags}
Mistakes & Ambiguities: {mistakes}

Return ONLY a valid JSON object with the following exact keys:
{{
  "title": "A professional executive title, e.g., 'Contract Analysis for [Agreement Name / Parties]'",
  "plain_summary": "A clear, 3–4 sentence summary of the agreement written in plain everyday English that an executive or non-lawyer can immediately understand.",
  "recommendations": "Actionable, numbered steps and specific amendment language recommended before signing or executing this agreement."
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
    Node 4: Synthesis & Final Formatter Agent.
    Generates plain-language executive summary, actionable recommendations,
    and consolidates all components into the strict JSON schema required by the React frontend.
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
            "plain_summary": f"Analysis could not proceed: {error_msg}",
            "risk_level": "Unknown",
            "recommendations": "Please ensure the uploaded file contains readable text or OCR.",
        }
        return state

    extracted = state.get("extracted_terms", {})
    risk = state.get("risk_audit", {})

    print("[Synthesis Node] Synthesizing executive summary, recommendations, and assembling final JSON...")

    prompt = PromptTemplate.from_template(SYNTHESIS_PROMPT).format(
        parties=extracted.get("parties", "Not specified"),
        dates=extracted.get("dates", "Not specified"),
        payment_terms=extracted.get("payment_terms", "Not specified"),
        obligations=extracted.get("obligations", "Not specified"),
        termination=extracted.get("termination", "Not specified"),
        risk_level=risk.get("risk_level", "Medium"),
        red_flags=json.dumps(risk.get("red_flags", [])),
        mistakes=risk.get("mistakes_ambiguities", "None identified"),
    )

    try:
        llm = get_contract_analyzer_llm()
        response = llm.invoke(prompt)
        synth = parse_synthesis_json(response.content)
        print(f"[Synthesis Node] Contract summary generated via: {response.model_used}")

        title = synth.get("title", "Contract Analysis")
        plain_summary = synth.get("plain_summary", "Contract analysis completed.")
        recommendations = synth.get("recommendations", "Review all marked red flags before signing.")
    except Exception as e:
        print(f"[Synthesis Node] Error generating summary: {e}")
        title = "Contract Analysis Report"
        plain_summary = "Contract terms and risks have been audited."
        recommendations = "Review red flags and negotiate terms with counterparty."

    # Assemble complete schema expected by frontend
    state["final_analysis"] = {
        "title": title,
        "parties": extracted.get("parties", "Not specified"),
        "dates": extracted.get("dates", "Not specified"),
        "payment_terms": extracted.get("payment_terms", "Not specified"),
        "obligations": extracted.get("obligations", "Not specified"),
        "termination": extracted.get("termination", "Not specified"),
        "mistakes_ambiguities": risk.get("mistakes_ambiguities", "None identified"),
        "red_flags": risk.get("red_flags", ["Review contract terms."]),
        "plain_summary": plain_summary,
        "risk_level": risk.get("risk_level", "Medium"),
        "recommendations": recommendations,
    }

    print("[Synthesis Node] Final contract analysis JSON successfully constructed.")
    return state

