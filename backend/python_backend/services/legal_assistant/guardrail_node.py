import re
from typing import Tuple
from services.legal_assistant.state import LegalAssistantState

# Known prompt injection & jailbreak signature patterns
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior)\s+directives",
    r"you\s+are\s+now\s+(in\s+)?(developer|dan|unrestricted|god)\s+mode",
    r"system\s+prompt\s+(leak|reveal|print|show)",
    r"repeat\s+the\s+(words|instructions)\s+above",
    r"output\s+initial\s+prompt",
    r"forget\s+your\s+rules",
    r"pretend\s+you\s+have\s+no\s+(morals|filters|restrictions)",
    r"simulate\s+an\s+unfiltered\s+ai",
    r"as\s+an\s+unaligned\s+ai",
]

# Unlawful solicitation patterns (requesting instructions on committing offenses)
ILLICIT_INTENT_PATTERNS = [
    r"how\s+to\s+(forge|fabricate)\s+(a\s+)?(fake\s+)?(will|property\s+deed|aadhaar|pan\s+card|document)",
    r"how\s+to\s+launder\s+black\s+money\s+without\s+getting\s+caught",
    r"how\s+to\s+bribe\s+(a\s+)?(police|judge|official)\s+safely",
    r"how\s+to\s+evade\s+arrest\s+after\s+committing",
    r"how\s+to\s+hack\s+(into\s+)?.*bank\s+account",
]


def check_query_safety(query: str) -> Tuple[bool, str]:
    """
    Checks if the user query contains prompt injection, jailbreaks, or illicit advice solicitation.
    Returns (is_safe: bool, reason: str).
    """
    normalized = query.strip().lower()

    # 1. Check for prompt injection / jailbreak attempts
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return False, "Prompt injection / jailbreak attempt detected."

    # 2. Check for illicit offence solicitation
    for pattern in ILLICIT_INTENT_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return False, "Request solicits instructions on executing illegal activities."

    # 3. Check for suspicious delimiter flooding (common injection technique)
    if normalized.count("```") > 3 or normalized.count("---") > 4:
        return False, "Malformed prompt delimiter detected."

    return True, "Safe"


def guardrail_node(state: LegalAssistantState) -> LegalAssistantState:
    """
    Node 1: Evaluates user query for prompt injection and malicious intent.
    If unsafe, flags is_safe=False and sets a polite legal refusal.
    """
    question = state.get("question", "")
    is_safe, reason = check_query_safety(question)

    state["is_safe"] = is_safe
    state["safety_reason"] = reason if not is_safe else None

    if not is_safe:
        print(f"[Guardrail] Triggered: {reason}")
        state["final_answer"] = (
            "I am programmed strictly as a legal informational assistant operating under the Indian legal framework. "
            "I cannot fulfill requests that attempt to override instructions, alter system parameters, or solicit advice "
            "on committing unlawful acts. If you have a legitimate legal question regarding Indian statutes or legal procedures, "
            "please feel free to ask."
        )

    return state
