from typing import List

try:
    from langchain.docstore.document import Document
except ImportError:
    class Document:
        def __init__(self, page_content: str, metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}

from services.legal_assistant import run_legal_assistant_pipeline


def query_legal_assistant(question: str) -> str:
    """Delegates to the 4-Node Agentic Legal Assistant Pipeline."""
    return run_legal_assistant_pipeline(question)


def build_hybrid_retriever(documents: List[Document], index_name: str, persist: bool = False):
    """Delegates to the Contract Service advanced hybrid retriever."""
    from services.contract_service import build_advanced_contract_retriever
    return build_advanced_contract_retriever(documents)
