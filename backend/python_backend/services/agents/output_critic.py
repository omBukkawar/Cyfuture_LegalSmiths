"""
LegalSmiths — Output Critic Agent
===================================
Validates AI-generated outputs before they reach the user.
Runs a lightweight LLM-based quality check tailored to each module.

Validation profiles:
  legal_assistant    — Is the response a genuine legal answer? On-topic, coherent, non-empty?
  contract_analyzer  — Are all required fields present? No raw JSON? Risk level present?
  case_predictor     — Is the verdict structured? Contains reasoning? Winning side present?

Design principles:
  - Fail-open: a critic failure NEVER discards a valid pipeline output
  - Confidence threshold: only acts on HIGH-confidence rejections (>= 85)
  - Lightweight: max_tokens=150, fast model, 10s timeout
  - Non-destructive: returns original output on pass or fail-open
"""

import json
import re
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Decision dataclass
# ---------------------------------------------------------------------------

@dataclass
class OutputDecision:
    valid: bool
    issues: List[str] = field(default_factory=list)
    confidence: int = 100          # 0–100; only act on >= 85 to block
    fallback_message: str = ""     # Shown to user when output is blocked
    latency_ms: float = 0.0
    critic_skipped: bool = False   # True if critic was not run (fail-open)


# ---------------------------------------------------------------------------
# Structural pre-checks (cheap, no LLM)
# ---------------------------------------------------------------------------

def _structural_output_check(output: Any, module: str) -> Tuple[bool, List[str]]:
    """
    Quick structural sanity checks before the LLM critic runs.
    Returns (passes_structural, issues).
    """
    issues = []

    if output is None:
        issues.append("Output is None")
        return False, issues

    if isinstance(output, str):
        if len(output.strip()) < 20:
            issues.append(f"Output suspiciously short ({len(output.strip())} chars)")
            return False, issues
        return True, issues

    if isinstance(output, dict):
        if module == "legal_assistant":
            if not output.get("final_answer") and not output.get("answer"):
                issues.append("Missing final_answer/answer field")
                return False, issues

        elif module == "contract_analyzer":
            # Must have at minimum a risk signal and summary
            has_risk = any(k in output for k in ["risk_level", "risk_assessment", "red_flags"])
            has_summary = any(k in output for k in ["plain_summary", "title", "summary"])
            if not has_risk:
                issues.append("Missing risk_level/risk_assessment/red_flags field")
            if not has_summary:
                issues.append("Missing plain_summary/title field")
            if issues:
                return False, issues

        elif module == "case_predictor":
            has_verdict = any(k in output for k in [
                "verdict_summary", "comparative_verdict", "winning_side"
            ])
            if not has_verdict:
                issues.append("Missing verdict fields in case prediction output")
                return False, issues

    return True, issues


# ---------------------------------------------------------------------------
# LLM Output Critic prompts per module
# ---------------------------------------------------------------------------

_OUTPUT_CRITIC_SYSTEM = """You are an output quality reviewer for LegalSmiths, an AI legal platform.
Your ONLY job is to validate whether an AI-generated response is acceptable to show to a user.
Be LENIENT — only flag clear failures. When in doubt, mark as valid.
Respond ONLY with valid JSON — no markdown, no other text.
Return: {"valid": true_or_false, "issues": ["list of specific issues, empty if valid"], "confidence": 0_to_100}
confidence: 0=total uncertainty, 100=completely certain. Only mark valid=false when confidence >= 80."""

_OUTPUT_CRITIC_PROMPTS = {
    "legal_assistant": """Review this Legal Assistant response for quality.

VALID if:
- Addresses a legal topic (Indian law, statutes, rights, court procedures, contracts, etc.)
- Not empty or less than 2 sentences
- Coherent and readable

INVALID (confidence >= 80) only if:
- Response is empty or just "I don't know" with no substance
- Response is completely unrelated to law (e.g., gives a cooking recipe)
- Response is garbled or incoherent

Response to review:
\"\"\"
{output}
\"\"\"

Classify:""",

    "contract_analyzer": """Review this Contract Analyzer output for completeness.

VALID if:
- Has a risk_level OR risk_assessment field
- Has red_flags field (can be empty list — that's fine)
- Has plain_summary or title field
- No raw escaped JSON strings as values (like "{{\"key\": \"val\"}}")

INVALID (confidence >= 80) only if:
- Completely missing risk information
- Output is an error message string with no analysis fields
- Output is entirely empty

Output to review (first 1500 chars):
\"\"\"
{output}
\"\"\"

Classify:""",

    "case_predictor": """Review this Case Predictor output for completeness.

VALID if:
- Has any verdict-related field (verdict_summary, comparative_verdict, winning_side, confidence_score)
- Contains some reasoning or analysis text
- Not empty

INVALID (confidence >= 80) only if:
- Completely empty or missing all verdict fields
- Output is a plain error string with no case analysis

Output to review (first 1500 chars):
\"\"\"
{output}
\"\"\"

Classify:""",
}

_FALLBACK_MESSAGES = {
    "legal_assistant": (
        "I apologize — I was unable to generate a valid legal response for your query at this time. "
        "This may be due to a temporary model issue. Please try rephrasing your question or try again shortly."
    ),
    "contract_analyzer": (
        "The contract analysis could not be completed successfully. "
        "The pipeline did not return a valid structured analysis. "
        "Please try uploading the document again or contact support."
    ),
    "case_predictor": (
        "The case outcome prediction could not be completed successfully. "
        "The pipeline did not return a valid verdict. "
        "Please try rephrasing the case facts or try again shortly."
    ),
}


def _llm_validate_output(output_text: str, module: str) -> Tuple[bool, List[str], int]:
    """
    Calls the LLM critic to validate output quality.
    Returns (valid, issues, confidence).
    On failure, returns (True, [], 0) — fail-open.
    """
    prompt_template = _OUTPUT_CRITIC_PROMPTS.get(module, _OUTPUT_CRITIC_PROMPTS["legal_assistant"])
    prompt = f"{_OUTPUT_CRITIC_SYSTEM}\n\n{prompt_template.format(output=output_text[:1500])}"

    try:
        import openai as _openai
        from config.settings import OPENROUTER_API_KEY, OPENROUTER_BASE_URL
        client = _openai.OpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY)

        for model in ["openai/gpt-4o-mini", "meta-llama/llama-3.3-70b-instruct", "nvidia/nemotron-3.5-lightning:free"]:
            try:
                resp = client.chat.completions.create(
                    model=model,
                    temperature=0.0,
                    max_tokens=150,
                    messages=[{"role": "user", "content": prompt}],
                    timeout=10,
                )
                raw = (resp.choices[0].message.content or "").strip()
                if "```" in raw:
                    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
                    if match:
                        raw = match.group(1)
                json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    valid = bool(parsed.get("valid", True))
                    issues = parsed.get("issues", [])
                    confidence = int(parsed.get("confidence", 50))
                    print(f"[OutputCritic] model={model} valid={valid} confidence={confidence} issues={issues}")
                    return valid, issues, confidence
            except Exception as e:
                print(f"[OutputCritic] model={model} failed: {e}")
                continue

        return True, [], 0  # all models failed → fail-open

    except Exception as e:
        print(f"[OutputCritic] LLM critic unavailable: {e}")
        return True, [], 0  # fail-open


# ---------------------------------------------------------------------------
# Public API — OutputCriticAgent
# ---------------------------------------------------------------------------

class OutputCriticAgent:
    """
    Post-processing output validation agent.
    Instantiate per module; call .review(output) after pipeline execution.
    """

    # Minimum confidence threshold to act on a rejection
    CONFIDENCE_THRESHOLD = 85

    def __init__(self, module: str):
        valid_modules = {"legal_assistant", "contract_analyzer", "case_predictor"}
        if module not in valid_modules:
            raise ValueError(f"Unknown module '{module}'. Valid: {valid_modules}")
        self.module = module
        self.fallback_message = _FALLBACK_MESSAGES[module]

    def review(self, output: Any) -> OutputDecision:
        """
        Review the pipeline output for quality.

        Returns OutputDecision:
          .valid=True  → pass output to user unchanged
          .valid=False → replace with .fallback_message (only when confidence >= threshold)

        Always fail-open: exceptions return valid=True.
        """
        t0 = time.time()

        # --- Structural pre-check (no LLM cost) ---
        struct_ok, struct_issues = _structural_output_check(output, self.module)
        if not struct_ok:
            print(f"[OutputCritic] Structural issues: {struct_issues}")
            return OutputDecision(
                valid=False,
                issues=struct_issues,
                confidence=90,
                fallback_message=self.fallback_message,
                latency_ms=(time.time() - t0) * 1000,
            )

        # --- Prepare output text for LLM critic ---
        if isinstance(output, str):
            output_text = output
        elif isinstance(output, dict):
            # Serialize to readable text for the critic (not raw JSON dump)
            output_text = json.dumps(output, indent=2)[:1500]
        else:
            output_text = str(output)[:1500]

        # --- LLM critic ---
        try:
            valid, issues, confidence = _llm_validate_output(output_text, self.module)
        except Exception as e:
            print(f"[OutputCritic] FAIL-OPEN: exception: {e}")
            return OutputDecision(
                valid=True,
                issues=[],
                confidence=0,
                critic_skipped=True,
                latency_ms=(time.time() - t0) * 1000,
            )

        latency = (time.time() - t0) * 1000

        # Only act on high-confidence rejections
        if not valid and confidence >= self.CONFIDENCE_THRESHOLD:
            print(f"[OutputCritic] BLOCKED output: issues={issues} confidence={confidence} latency={latency:.0f}ms")
            return OutputDecision(
                valid=False,
                issues=issues,
                confidence=confidence,
                fallback_message=self.fallback_message,
                latency_ms=latency,
            )

        # Low confidence rejection → fail-open (pass through)
        if not valid and confidence < self.CONFIDENCE_THRESHOLD:
            print(f"[OutputCritic] Low-confidence rejection (confidence={confidence}) → fail-open, passing output")

        return OutputDecision(
            valid=True,
            issues=issues,
            confidence=confidence,
            latency_ms=latency,
        )


# ---------------------------------------------------------------------------
# Convenience singleton instances
# ---------------------------------------------------------------------------
legal_assistant_output_critic = OutputCriticAgent("legal_assistant")
contract_analyzer_output_critic = OutputCriticAgent("contract_analyzer")
case_predictor_output_critic = OutputCriticAgent("case_predictor")

