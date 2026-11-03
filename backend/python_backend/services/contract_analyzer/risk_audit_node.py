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


RISK_AUDIT_PROMPT = """You are an Elite Commercial Litigator and Senior Contract Risk Auditor.
Perform a rigorous, evidence-backed legal and financial risk audit of the provided contract.

CRITICAL INSTRUCTIONS FOR RISK AUDIT:
1. CROSS-CLAUSE INTERACTION (Gap A): Check if exceptions or carve-outs in one section override protections in another (e.g., Section 18 uncapped indemnification or confidentiality exceptions secretly negating the Section 14 liability cap).
2. EVIDENCE-BACKED FINDINGS (Gap B): Every identified red flag MUST provide the exact verbatim contractual sentence as evidence, the exact clause/section reference, clear legal explanation, concrete financial/operational impact, and a recommended amendment.
3. CONFIDENCE & ABSENT PROTECTIONS (Gap C): Clearly distinguish explicit contractual risks from missing/omitted protections (e.g. absent reciprocal indemnification, missing liability cap, missing cure period, missing data protection clauses).
4. CONSISTENT RUBRIC EVALUATION (Gap D): Evaluate risk against the 4 core dimensions:
   - Financial Exposure: Uncapped liability, broad indemnities, liquidated damages.
   - Dispute Probability: Ambiguous standards ("best efforts", "promptly"), subjective termination triggers.
   - Clause Symmetry: One-sided rights benefiting one party exclusively.
   - Cross-Clause Interactions: Interlocking clauses that amplify risk.

Return ONLY a valid JSON object matching this EXACT schema:
{{
  "risk_assessment": {{
    "overall_level": "High",
    "score_rationale": "Concise 1-2 sentence executive explanation of why this contract receives this risk rating based on the 4 rubric dimensions.",
    "rubric_breakdown": {{
      "financial_exposure": "Critical / High / Medium / Low (with brief note)",
      "dispute_probability": "High / Medium / Low (with brief note)",
      "clause_symmetry": "One-sided / Moderately Asymmetric / Balanced",
      "cross_clause_interaction": "Severe / Moderate / None (e.g. indemnity carve-out negating liability cap)"
    }}
  }},
  "red_flags": [
    {{
      "title": "Clear, punchy title (e.g. Uncapped Third-Party Indemnification)",
      "severity": "Critical",
      "clause_reference": "Section 14 & Section 18",
      "evidence": "Verbatim quote of the exact sentence(s) from the contract text demonstrating this risk.",
      "explanation": "Detailed legal explanation of why this provision exposes the party to severe risk.",
      "impact": "Concrete financial, operational, or legal exposure (e.g. Financial exposure could exceed total contract value).",
      "recommendation": "Specific proposed amendment language or negotiation stance.",
      "finding_type": "Explicit Risk",
      "confidence_assessment": "High (Verbatim contractual clause)"
    }}
  ],
  "missing_protections": [
    {{
      "title": "Title of missing protection (e.g. Absence of Mutual Indemnification)",
      "severity": "High",
      "finding_type": "Missing Protection / Omission",
      "explanation": "Explanation of what standard legal safeguard is entirely absent from this agreement.",
      "impact": "Vulnerability created by this absence.",
      "recommendation": "Proposed clause to insert before execution."
    }}
  ],
  "mistakes_ambiguities": [
    {{
      "title": "Title of ambiguity (e.g. Subjective Performance Standard)",
      "clause_reference": "Section 3.2",
      "evidence": "Verbatim quote of ambiguous or contradictory wording.",
      "explanation": "Why this wording is vague, conflicting, or susceptible to multiple interpretations in litigation.",
      "recommendation": "Clarification language to remove ambiguity."
    }}
  ]
}}

Severity levels MUST be one of: "Critical", "High", "Medium", "Low".
Overall level MUST be one of: "High", "Medium", "Low".

CRITICAL: Return ONLY valid JSON. No Markdown formatting or conversational text outside the JSON block.

Contract Context:
{context}

JSON Risk Audit:"""


def parse_risk_json(raw_text: str) -> Dict[str, Any]:
    """Parses risk audit JSON safely, stripping code fences."""
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


def enforce_consistent_risk_rubric(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    ENGINEERING IMPROVEMENT (Gap D - Consistent Methodology):
    Enforces deterministic consistency between individual findings and the overall risk rating.
    If any finding is 'Critical' or 2+ findings are 'High', overall risk is guaranteed to be 'High'.
    """
    red_flags = audit_data.get("red_flags", [])
    missing_protections = audit_data.get("missing_protections", [])

    critical_count = 0
    high_count = 0

    for item in red_flags + missing_protections:
        if isinstance(item, dict):
            sev = str(item.get("severity", "")).lower()
            if sev == "critical":
                critical_count += 1
            elif sev == "high":
                high_count += 1

    risk_assessment = audit_data.get("risk_assessment", {})
    if not isinstance(risk_assessment, dict):
        risk_assessment = {}

    current_overall = str(risk_assessment.get("overall_level", "Medium")).capitalize()

    # Rubric enforcement:
    if critical_count >= 1 or high_count >= 2:
        enforced_level = "High"
    elif high_count == 1 or len(red_flags) >= 2:
        enforced_level = "Medium" if current_overall != "High" else "High"
    else:
        enforced_level = current_overall if current_overall in ["High", "Medium", "Low"] else "Low"

    risk_assessment["overall_level"] = enforced_level
    audit_data["risk_assessment"] = risk_assessment
    return audit_data


def risk_audit_node(state: ContractAnalyzerState) -> ContractAnalyzerState:
    """
    Node 3: Evidence-Backed Risk & Vulnerability Audit Agent.
    
    ENGINEERING IMPROVEMENTS (Gaps B, C, D):
    - Evidence-backed Red Flags: Every finding includes exact verbatim clause quotes,
      clause reference, severity, impact, and actionable recommendations.
    - Confidence & Uncertainty: Distinguishes explicit verbatim risks, missing protections,
      and interpretive ambiguities.
    - Consistent Risk Rubric: Evaluates 4 dimensions (Financial Exposure, Dispute Probability,
      Symmetry, Cross-Clause Interlocking) with deterministic level enforcement.
    """
    if not state.get("is_valid_doc", True):
        return state

    clauses = state.get("retrieved_clauses", "")
    if not clauses.strip():
        state["risk_audit"] = {}
        return state

    print(f"[Risk Audit Node] Performing evidence-backed risk audit across {len(clauses):,} chars...")
    prompt = PromptTemplate.from_template(RISK_AUDIT_PROMPT).format(context=clauses)

    try:
        llm = get_contract_analyzer_llm()
        response = llm.invoke(prompt)
        audit_result = parse_risk_json(response.content)

        # Apply deterministic rubric consistency
        audit_result = enforce_consistent_risk_rubric(audit_result)

        red_flags = audit_result.get("red_flags", [])
        if isinstance(red_flags, str):
            red_flags = [{"title": "Contract Risk", "severity": "Medium", "evidence": "See contract text", "explanation": red_flags, "impact": "Review terms", "recommendation": "Clarify clause"}]

        missing_protections = audit_result.get("missing_protections", [])
        mistakes_ambiguities = audit_result.get("mistakes_ambiguities", [])
        risk_assessment = audit_result.get("risk_assessment", {})

        overall_level = risk_assessment.get("overall_level", "Medium")
        rationale = risk_assessment.get("score_rationale", "Standard commercial terms with notable liabilities.")
        composite_risk_str = f"{overall_level} - {rationale}"

        state["risk_audit"] = {
            "red_flags": red_flags,
            "missing_protections": missing_protections,
            "mistakes_ambiguities": mistakes_ambiguities,
            "risk_assessment": risk_assessment,
            "risk_level": composite_risk_str,
        }
        print(f"[Risk Audit Node] Identified {len(red_flags)} structured red flags, {len(missing_protections)} missing protections. Overall: {overall_level}")
    except Exception as e:
        print(f"[Risk Audit Node] Error: {e}")
        state["risk_audit"] = {
            "red_flags": [
                {
                    "title": "Manual Legal Review Required",
                    "severity": "Medium",
                    "clause_reference": "General",
                    "evidence": "Analysis encountered an unexpected parsing event.",
                    "explanation": "Automated clause audit could not parse all risk structures cleanly.",
                    "impact": "Unverified contractual provisions.",
                    "recommendation": "Consult legal counsel for manual audit.",
                    "finding_type": "Uncertain finding",
                    "confidence_assessment": "Verification Needed"
                }
            ],
            "missing_protections": [],
            "mistakes_ambiguities": [],
            "risk_assessment": {
                "overall_level": "Medium",
                "score_rationale": "Pending manual legal review.",
                "rubric_breakdown": {
                    "financial_exposure": "Medium (pending review)",
                    "dispute_probability": "Medium",
                    "clause_symmetry": "Requires manual inspection",
                    "cross_clause_interaction": "Unverified"
                }
            },
            "risk_level": "Medium - Pending manual legal review.",
        }

    return state
