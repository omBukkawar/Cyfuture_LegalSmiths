import time
from typing import Dict, Any
from services.legal_assistant.state import LegalAssistantState
from services.legal_assistant.guardrail_node import guardrail_node
from services.legal_assistant.search_node import search_node
from services.legal_assistant.evaluator_node import evaluator_node
from services.legal_assistant.synthesis_node import synthesis_node


def run_legal_assistant_pipeline(question: str) -> str:
    """
    Executes the 4-Node Agentic Legal Assistant Pipeline:
    1. Node 1: Safety & Prompt Injection Guardrail (Early exit if malicious)
    2. Node 2: Serper API Live Search (Google India)
    3. Node 3: Result Relevance & Validity Evaluator
    4. Node 4: Context Injection & Legal Synthesis (OpenRouter LLM)
    """
    start_time = time.time()
    print("=" * 60)
    print(f"[Pipeline] Running Legal Assistant Agent Pipeline for: '{question[:60]}...'")

    # Initialize State
    state: LegalAssistantState = {
        "question": question,
        "is_safe": True,
        "safety_reason": None,
        "search_query": "",
        "search_results": [],
        "is_search_valid": False,
        "curated_context": "",
        "final_answer": "",
    }

    # Node 1: Safety & Prompt Injection Guardrail
    state = guardrail_node(state)
    if not state.get("is_safe", True):
        elapsed = time.time() - start_time
        print(f"[Pipeline] Terminated early by Guardrail in {elapsed:.2f}s")
        return state["final_answer"]

    # Node 2: Live Search via Serper API
    state = search_node(state)

    # Node 3: Relevance & Validity Evaluator
    state = evaluator_node(state)

    # Node 4: Context Injection & Legal Synthesis
    state = synthesis_node(state)

    elapsed = time.time() - start_time
    print(f"[Pipeline] Completed successfully in {elapsed:.2f}s")
    print("=" * 60)

    return state.get("final_answer", "")
