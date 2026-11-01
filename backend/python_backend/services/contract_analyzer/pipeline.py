import time
from typing import List, Dict, Any
from services.contract_analyzer.state import ContractAnalyzerState
from services.contract_analyzer.ingestion_node import ingestion_node
from services.contract_analyzer.clause_extractor_node import clause_extractor_node
from services.contract_analyzer.risk_audit_node import risk_audit_node
from services.contract_analyzer.synthesis_formatter_node import synthesis_formatter_node


def run_contract_analyzer_pipeline(request_text: str, documents: List[Any]) -> Dict[str, Any]:
    """
    Executes the 4-Node Agentic Contract Analyzer Pipeline:
    1. Node 1: Ingestion & Hybrid RAG Retrieval (BM25 + FAISS MMR + CrossEncoder)
    2. Node 2: Key Operational Terms Extractor (Parties, Dates, Payments, Obligations, Termination)
    3. Node 3: Deep Risk & Red-Flag Audit (Indemnity, Uncapped Liability, Ambiguities, Rating)
    4. Node 4: Synthesis & Formatter (Plain-Language Summary, Recommendations, Strict JSON)
    """
    start_time = time.time()
    print("=" * 60)
    print(f"[Pipeline] Starting Contract Analyzer Agent Pipeline for {len(documents)} document(s)...")

    # Initialize pipeline state
    state: ContractAnalyzerState = {
        "documents": documents,
        "request_text": request_text,
        "is_valid_doc": True,
        "doc_error": None,
        "retrieved_clauses": "",
        "extracted_terms": {},
        "risk_audit": {},
        "final_analysis": {},
    }

    # Node 1: Ingestion & Retrieval
    state = ingestion_node(state)
    if not state.get("is_valid_doc", True):
        elapsed = time.time() - start_time
        print(f"[Pipeline] Terminated early due to invalid document in {elapsed:.2f}s")
        state = synthesis_formatter_node(state)
        return state["final_analysis"]

    # Node 2: Clause & Operational Terms Extractor
    state = clause_extractor_node(state)

    # Node 3: Deep Risk & Red-Flag Audit
    state = risk_audit_node(state)

    # Node 4: Synthesis & Final JSON Formatter
    state = synthesis_formatter_node(state)

    elapsed = time.time() - start_time
    print(f"[Pipeline] Contract Analyzer Agent Pipeline completed successfully in {elapsed:.2f}s")
    print("=" * 60)

    return state.get("final_analysis", {})

