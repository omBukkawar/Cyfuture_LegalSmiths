from typing import TypedDict, List, Dict, Any, Optional


class ContractAnalyzerState(TypedDict):
    """State object passed across the 4-node contract analyzer agent pipeline."""
    documents: List[Any]
    request_text: str
    is_valid_doc: bool
    doc_error: Optional[str]
    retrieved_clauses: str
    extracted_terms: Dict[str, Any]
    risk_audit: Dict[str, Any]
    final_analysis: Dict[str, Any]

