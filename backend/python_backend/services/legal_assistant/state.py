from typing import TypedDict, List, Dict, Any, Optional


class LegalAssistantState(TypedDict):
    """State object passed across the 4-node legal assistant agent pipeline."""
    question: str
    is_safe: bool
    safety_reason: Optional[str]
    search_query: str
    search_results: List[Dict[str, str]]
    is_search_valid: bool
    curated_context: str
    final_answer: str

