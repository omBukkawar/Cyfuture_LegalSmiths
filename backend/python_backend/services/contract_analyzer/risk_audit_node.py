import re
import json
from typing import Dict, Any, List
from services.contract_analyzer.state import ContractAnalyzerState
from models.llm import get_llm

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


RISK_AUDIT_PROMPT = """You are a Senior Risk Assessment Counsel and Commercial Litigator.
Perform an in-depth risk and liability audit on the provided contract clauses.

Identify all legal vulnerabilities, predatory or one-sided terms, uncapped exposure, and ambiguities.

Return ONLY a valid JSON object with the following exact keys:
{{
  "red_flags": [
    "1. [Clause Name]: Detailed explanation of the severe risk, one-sided indemnity, or unfair liability exposure.",
    "2. [Clause Name]: Explanation of another high-risk term, unilateral termination right, or uncapped damages."
  ],
  "mistakes_ambiguities": "List any contradictory deadlines, vague wording (e.g. 'best efforts' without objective metrics), undefined legal terms, or missing standard protective clauses (e.g. Force Majeure, Severability, Governing Law).",
  "risk_level": "High (or Medium or Low) - A concise, authoritative one-line legal justification for this risk rating."
}}

CRITICAL: Return ONLY valid JSON. Ensure "red_flags" is an array of numbered strings. No conversational introductions outside the JSON.

Contract Clauses:
{context}

JSON Risk Audit:"""


def parse_risk_json(raw_text: str) -> Dict[str, Any]:
    """Parses risk audit JSON safely."""
    cleaned = raw_text.strip()
    if "```" in cleaned:
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)

    json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except Exception:
            pass

    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"[Risk Audit Node] JSON parsing warning: {e}")
        return {}


def risk_audit_node(state: ContractAnalyzerState) -> ContractAnalyzerState:
    """
    Node 3: Dedicated Risk & Red-Flag Audit Agent.
    Audits liability, indemnity exposure, one-sided terms, ambiguities, and assigns a risk score.
    """
    if not state.get("is_valid_doc", True):
        return state

    clauses = state.get("retrieved_clauses", "")
    if not clauses.strip():
        state["risk_audit"] = {}
        return state

    print("[Risk Audit Node] Performing deep risk assessment and red flag detection...")
    prompt = PromptTemplate.from_template(RISK_AUDIT_PROMPT).format(context=clauses)

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        audit_result = parse_risk_json(response.content)

        red_flags = audit_result.get("red_flags", [])
        if isinstance(red_flags, str):
            red_flags = [red_flags]

        state["risk_audit"] = {
            "red_flags": red_flags if red_flags else ["No critical red flags identified."],
            "mistakes_ambiguities": audit_result.get("mistakes_ambiguities", "No significant ambiguities identified."),
            "risk_level": audit_result.get("risk_level", "Medium - Standard commercial terms with typical liabilities."),
        }
        print(f"[Risk Audit Node] Identified {len(state['risk_audit']['red_flags'])} red flags. Risk Level: {state['risk_audit']['risk_level']}")
    except Exception as e:
        print(f"[Risk Audit Node] Error: {e}")
        state["risk_audit"] = {
            "red_flags": ["Manual risk review required."],
            "mistakes_ambiguities": "Unable to complete ambiguity audit.",
            "risk_level": "Medium - Pending manual legal review.",
        }

    return state

