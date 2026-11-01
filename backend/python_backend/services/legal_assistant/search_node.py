import re
from typing import List, Dict
from services.legal_assistant.state import LegalAssistantState
from services.search_service import search_serper


def build_legal_search_query(question: str) -> str:
    """Refines raw user questions into high-yield search queries for Indian legal resources."""
    cleaned = question.strip()
    # Strip conversational lead-ins
    cleaned = re.sub(
        r"^(can you please tell me|please explain|what is|tell me about|could you describe)\s+",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()

    # Ensure Indian legal context is present for precise Google India results
    indicators = ["india", "indian law", "section", "act", "bns", "ipc", "crpc", "court"]
    if not any(ind in cleaned.lower() for ind in indicators):
        return f"{cleaned} Indian law legal section Supreme Court"

    return cleaned


def search_node(state: LegalAssistantState) -> LegalAssistantState:
    """
    Node 2: Executes real-time web search via Serper API targeted to Indian law.
    Fetches official statutory provisions, amendments, and court precedents.
    """
    if not state.get("is_safe", True):
        return state

    question = state.get("question", "")
    search_query = build_legal_search_query(question)
    state["search_query"] = search_query

    print(f"[Search Node] Querying Serper: '{search_query}'")
    results = search_serper(search_query, num_results=5)
    state["search_results"] = results or []

    return state
