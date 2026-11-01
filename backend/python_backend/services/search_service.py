import os
from typing import List, Dict, Any
import requests
from config.settings import SERPER_API_KEY


def search_serper(query: str, num_results: int = 5) -> List[Dict[str, str]]:
    """
    Searches Google via Serper.dev API geotargeted to India for legal provisions and case law.
    Returns a list of structured results with title, snippet, and link.
    """
    if not SERPER_API_KEY:
        print("Notice: SERPER_API_KEY is not set. Skipping live web search.")
        return []

    # Augment query specifically for Indian legal context if not already present
    search_query = query
    legal_keywords = ["indian law", "india", "section", "act", "court", "bns", "ipc"]
    if not any(kw in query.lower() for kw in legal_keywords):
        search_query = f"{query} Indian law legal sections"

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "q": search_query,
        "gl": "in",  # Geotarget: India
        "hl": "en",  # Language: English
        "num": num_results,
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"Serper API warning: Status {response.status_code} - {response.text}")
            return []

        data = response.json()
        results = []

        # Extract answer box if available (e.g., direct definitions / statute snippets)
        if "answerBox" in data:
            box = data["answerBox"]
            snippet = box.get("answer") or box.get("snippet") or ""
            if snippet:
                results.append({
                    "title": box.get("title", "Direct Answer"),
                    "snippet": snippet,
                    "link": box.get("link", ""),
                })

        # Extract organic search results
        for item in data.get("organic", []):
            results.append({
                "title": item.get("title", ""),
                "snippet": item.get("snippet", ""),
                "link": item.get("link", ""),
            })

        return results[:num_results]

    except Exception as e:
        print(f"Serper search error: {e}")
        return []


def format_search_context(results: List[Dict[str, str]]) -> str:
    """Formats Serper search results into a clean context string for LLM ingestion."""
    if not results:
        return "No external web search results available."

    formatted = []
    for i, res in enumerate(results, 1):
        formatted.append(
            f"Source [{i}]: {res.get('title')}\n"
            f"Snippet: {res.get('snippet')}\n"
            f"Link: {res.get('link')}"
        )
    return "\n\n".join(formatted)

