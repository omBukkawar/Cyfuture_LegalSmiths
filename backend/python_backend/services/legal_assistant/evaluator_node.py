import re
from typing import List, Dict
from services.legal_assistant.state import LegalAssistantState

# Key legal terms indicating legitimate statutory or case law content
LEGAL_RELEVANCE_MARKERS = [
    "section", "act", "statute", "court", "ruling", "precedent", "order",
    "supreme court", "high court", "article", "constitution", "bns", "ipc",
    "crpc", "bnss", "bsa", "offence", "bail", "arrest", "warrant", "petition",
    "legal", "law", "right", "notice", "contract", "liability", "punishment",
]


def score_snippet_relevance(snippet: str, query_keywords: List[str]) -> int:
    """Computes relevance score based on query keywords and legal markers."""
    text = snippet.lower()
    score = 0

    # 1. Matches user query terms
    for kw in query_keywords:
        if kw in text:
            score += 2

    # 2. Contains Indian legal vocabulary
    for marker in LEGAL_RELEVANCE_MARKERS:
        if marker in text:
            score += 1

    return score


def evaluator_node(state: LegalAssistantState) -> LegalAssistantState:
    """
    Node 3: Result Relevance & Validity Evaluator.
    Filters out noise, commercial spam, or non-legal results.
    Determines if search results satisfy the inquiry or if statutory fallback is required.
    """
    if not state.get("is_safe", True):
        return state

    results = state.get("search_results", [])
    question = state.get("question", "")

    if not results:
        print("[Evaluator] Zero search results returned from Serper.")
        state["is_search_valid"] = False
        state["curated_context"] = ""
        return state

    # Extract meaningful keywords from question (words > 3 characters)
    query_keywords = [
        w.lower() for w in re.findall(r"\w+", question)
        if len(w) > 3 and w.lower() not in ["what", "when", "where", "which", "tell", "explain", "please"]
    ]

    valid_snippets = []
    for item in results:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        link = item.get("link", "")
        combined = f"{title} {snippet}"

        score = score_snippet_relevance(combined, query_keywords)
        # Threshold: must have at least 1 query keyword and 1 legal marker
        if score >= 3:
            valid_snippets.append({
                "title": title,
                "snippet": snippet,
                "link": link,
                "score": score,
            })

    # Sort valid snippets by score
    valid_snippets.sort(key=lambda x: x["score"], reverse=True)

    if valid_snippets:
        state["is_search_valid"] = True
        formatted = []
        for i, s in enumerate(valid_snippets[:4], 1):
            formatted.append(
                f"[Source {i}]: {s['title']}\n"
                f"Information: {s['snippet']}\n"
                f"Reference URL: {s['link']}"
            )
        state["curated_context"] = "\n\n".join(formatted)
        print(f"[Evaluator] {len(valid_snippets)} search results validated and approved.")
    else:
        print("[Evaluator] Retrieved snippets failed relevance threshold. Flagging internal fallback.")
        state["is_search_valid"] = False
        state["curated_context"] = ""

    return state
