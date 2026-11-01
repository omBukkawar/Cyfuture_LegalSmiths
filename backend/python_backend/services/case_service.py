import re
import json
from typing import Dict, Any
from models.llm import get_case_predictor_llm
from config.settings import CASE_PREDICTOR_MODELS

try:
    from langchain.prompts import PromptTemplate
except ImportError:
    class PromptTemplate:
        @classmethod
        def from_template(cls, template: str):
            class _Template:
                def __init__(self, t): self.t = t
                def format(self, **kwargs): return self.t.format(**kwargs)
            return _Template(template)

CASE_SYSTEM_PROMPT = """You are a specialized legal advisory assistant operating strictly under the Indian legal framework.
Your task is to analyze ONLY the case facts provided by the user and produce a structured, court-style legal advisory.

CRITICAL: You must respond with ONLY a valid JSON object. No markdown, no conversational filler, no extra text.

Required JSON structure:
{{
  "title": "Brief case title or Legal Advisory to [Client Name]",
  "petitioner": "Name of the petitioner",
  "respondent": "Name of the respondent",
  "successProbability": "X%",
  "likelyOutcome": "Detailed prediction of probable result with legal reasoning",
  "strongPoints": ["Strongest legal and factual arguments under Indian law"],
  "weakPoints": ["Weakest or most vulnerable arguments"],
  "legalPrecedents": [
    {{
      "case": "Case Title and Citation",
      "citation": "Citation details",
      "explanation": "Brief explanation of relevance"
    }}
  ],
  "strategies": ["Possible remedies and compliance steps if petitioner loses"],
  "penalties": ["Potential penalties and liabilities under relevant Indian statutes"],
  "finalAdvisory": "Realistic legal feedback combining all factors and probable outcome implications"
}}

Legal Framework:
- Prioritize Indian Constitution, statutes (BNS, IPC, Contract Act, CPC, CrPC), and Supreme Court/High Court judgments.
- Apply proportionality test, fundamental rights, and statutory compliance.
- Use legally precise, court-advisory tone.
- Include only directly relevant Indian precedents.

Case Facts:
{case_facts}

JSON Advisory:"""

def extract_json_from_response(response_text: str) -> dict:
    """Extract and parse JSON from LLM response, handling code fences and formatting quirks."""
    try:
        cleaned = response_text.strip()
        if "```" in cleaned:
            json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(1)

        json_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))

        return json.loads(cleaned)
    except Exception as e:
        print(f"Case prediction JSON parsing error: {e}")
        return {
            "title": "Legal Case Analysis",
            "petitioner": "Not specified",
            "respondent": "Not specified",
            "successProbability": "N/A",
            "likelyOutcome": "Analysis completed, but failed to format JSON cleanly.",
            "strongPoints": ["Review raw response"],
            "weakPoints": ["Review raw response"],
            "legalPrecedents": [],
            "strategies": ["Consult legal counsel"],
            "penalties": ["None specified"],
            "finalAdvisory": response_text,
        }

def predict_case_outcome(case_facts: str) -> Dict[str, Any]:
    """Generates structured legal case outcome prediction using OpenRouter / LLM."""
    llm = get_case_predictor_llm()
    prompt = PromptTemplate.from_template(CASE_SYSTEM_PROMPT).format(case_facts=case_facts)
    response = llm.invoke(prompt)
    print(f"[Case Predictor] Prediction generated via: {response.model_used}")
    parsed = extract_json_from_response(response.content)

    # Ensure all required fields exist
    required_fields = [
        "title",
        "petitioner",
        "respondent",
        "successProbability",
        "likelyOutcome",
        "strongPoints",
        "weakPoints",
        "legalPrecedents",
        "strategies",
        "penalties",
        "finalAdvisory",
    ]
    for field in required_fields:
        if field not in parsed:
            parsed[field] = "Not provided"

    return parsed

