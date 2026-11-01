import re
import json
from typing import Dict, Any
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


CLAUSE_EXTRACTION_PROMPT = """You are an Expert Commercial Contract Attorney.
Analyze the provided contract clauses and extract the core operational terms with high legal precision.

Return ONLY a valid JSON object with the following exact keys:
{{
  "parties": "Detailed description of all contracting parties, their legal entity names, addresses, and defined roles (e.g., Client, Contractor, Licensor, Licensee)",
  "dates": "Summary of critical dates: Execution Date, Effective Date, Initial Term, Expiration Date, Renewal Windows, and Notice Deadlines",
  "payment_terms": "Full breakdown of financial terms: Contract Price, Fee Rates, Invoicing Schedule, Payment Deadlines (e.g., Net 30), Late Payment Penalties, and Withholding Taxes",
  "obligations": "Clear summary of key deliverables, operational covenants, performance standards, representations, and warranties for each party",
  "termination": "Comprehensive summary of termination provisions: Termination for Convenience, Termination for Cause / Material Breach, Notice Periods, Cure Periods, and Post-Termination Obligations"
}}

CRITICAL: Return ONLY valid JSON. No conversational introductions, notes, or markdown fences outside the JSON.

Contract Clauses:
{context}

JSON Terms:"""


def parse_json_safely(raw_text: str) -> Dict[str, Any]:
    """Extracts and parses JSON from LLM response text."""
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
        print(f"[Clause Extractor] JSON parsing warning: {e}")
        return {}


def clause_extractor_node(state: ContractAnalyzerState) -> ContractAnalyzerState:
    """
    Node 2: Dedicated Clause Extractor Agent.
    Audits the retrieved clauses and extracts key operational terms:
    parties, dates, payment terms, obligations, and termination rights.
    """
    if not state.get("is_valid_doc", True):
        return state

    clauses = state.get("retrieved_clauses", "")
    if not clauses.strip():
        state["extracted_terms"] = {}
        return state

    print("[Clause Extractor Node] Extracting key terms and operational clauses...")
    prompt = PromptTemplate.from_template(CLAUSE_EXTRACTION_PROMPT).format(context=clauses)

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        extracted = parse_json_safely(response.content)

        state["extracted_terms"] = {
            "parties": extracted.get("parties", "Could not extract contracting parties."),
            "dates": extracted.get("dates", "Could not extract critical contract dates."),
            "payment_terms": extracted.get("payment_terms", "Could not extract payment obligations."),
            "obligations": extracted.get("obligations", "Could not extract contractual obligations."),
            "termination": extracted.get("termination", "Could not extract termination provisions."),
        }
        print("[Clause Extractor Node] Completed operational terms extraction.")
    except Exception as e:
        print(f"[Clause Extractor Node] Error: {e}")
        state["extracted_terms"] = {
            "parties": "Extraction encountered an error.",
            "dates": "Extraction encountered an error.",
            "payment_terms": "Extraction encountered an error.",
            "obligations": "Extraction encountered an error.",
            "termination": "Extraction encountered an error.",
        }

    return state

