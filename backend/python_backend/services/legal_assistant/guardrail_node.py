"""
Legal Assistant — Guardrail Node
Delegates to the shared input_guard module for comprehensive protection.
"""

from services.legal_assistant.state import LegalAssistantState
from services.input_guard import guard_legal_assistant


def guardrail_node(state: LegalAssistantState) -> LegalAssistantState:
    """
    Node 1: Multi-layer input safety check.
    Blocks prompt injection, jailbreaks, XSS, SQL injection, path traversal,
    illicit advice solicitation, off-topic queries, and flooding attacks.
    """
    question = state.get("question", "")
    is_safe, user_message = guard_legal_assistant(question)

    state["is_safe"] = is_safe
    state["safety_reason"] = None if is_safe else "Blocked by input guardrail"

    if not is_safe:
        print(f"[Guardrail] Legal Assistant: blocked query (len={len(question)})")
        state["final_answer"] = user_message

    return state
