from typing import List, Dict, Any
from services.contract_analyzer import run_contract_analyzer_pipeline
from services.contract_analyzer.ingestion_node import build_hybrid_contract_retriever


def analyze_uploaded_contract(request_text: str, documents: List[Any]) -> Dict[str, Any]:
    """Delegates to the 4-Node Agentic Contract Analyzer Pipeline."""
    return run_contract_analyzer_pipeline(request_text, documents)


def build_advanced_contract_retriever(documents: List[Any]):
    """Delegates to the Ingestion Node hybrid retriever."""
    return build_hybrid_contract_retriever(documents)
