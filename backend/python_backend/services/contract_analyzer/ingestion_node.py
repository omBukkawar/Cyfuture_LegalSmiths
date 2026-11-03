import re
from typing import List, Dict, Any
from services.contract_analyzer.state import ContractAnalyzerState
from models.llm import get_llm
from models.embeddings import get_embedding_model, get_reranker_model

try:
    from langchain.docstore.document import Document
except ImportError:
    class Document:
        def __init__(self, page_content: str, metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    class RecursiveCharacterTextSplitter:
        def __init__(self, chunk_size=1000, chunk_overlap=250):
            self.chunk_size = chunk_size
            self.chunk_overlap = chunk_overlap

        def split_documents(self, documents: List[Document]) -> List[Document]:
            chunks = []
            for doc in documents:
                text = doc.page_content
                start = 0
                while start < len(text):
                    end = start + self.chunk_size
                    chunks.append(Document(page_content=text[start:end], metadata=doc.metadata))
                    start += self.chunk_size - self.chunk_overlap
            return chunks

try:
    from langchain.prompts import PromptTemplate
except ImportError:
    class PromptTemplate:
        @classmethod
        def from_template(cls, template: str):
            class _T:
                def __init__(self, t): self.t = t
                def format(self, **kwargs): return self.t.format(**kwargs)
            return _T(template)


def build_hybrid_contract_retriever(documents: List[Document]):
    """
    Builds the Advanced Hybrid RAG Retriever for contract analysis:
    - BM25 sparse keyword retriever
    - FAISS dense vector store with Maximal Marginal Relevance (MMR)
    - Ensemble combining sparse and dense signals
    - Cross-Encoder reranker
    - Multi-query expansion via OpenRouter LLM
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=250)
    split_docs = splitter.split_documents(documents)

    if not split_docs:
        split_docs = [Document(page_content="Empty contract", metadata={})]

    try:
        from langchain_community.vectorstores import FAISS
        from langchain_community.retrievers import BM25Retriever
        from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
        from langchain.retrievers.document_compressors import CrossEncoderReranker
        from langchain.retrievers.multi_query import MultiQueryRetriever

        embedding_model = get_embedding_model()
        reranker_model = get_reranker_model()
        llm = get_llm()

        # FAISS dense store with MMR
        vector_store = FAISS.from_documents(split_docs, embedding_model)
        faiss_retriever = vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 12, "fetch_k": 30, "lambda_mult": 0.7},
        )

        # BM25 sparse store
        bm25_retriever = BM25Retriever.from_documents(split_docs)
        bm25_retriever.k = 10

        # Ensemble hybrid
        ensemble = EnsembleRetriever(
            retrievers=[bm25_retriever, faiss_retriever],
            weights=[0.7, 0.3],
        )

        # CrossEncoder reranker
        compressor = CrossEncoderReranker(model=reranker_model, top_n=12)
        reranked_retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=ensemble,
        )

        # Multi-query expansion
        multi_query_retriever = MultiQueryRetriever.from_llm(
            retriever=reranked_retriever,
            llm=llm,
            prompt=PromptTemplate.from_template(
                "Generate 3 distinct search queries to identify all legal clauses, liabilities, and terms for:\n\n{question}"
            ),
        )
        return multi_query_retriever

    except Exception as e:
        print(f"[Ingestion Node] Advanced RAG using lightweight fallback ({e})")

        class FallbackRetriever:
            def __init__(self, docs):
                self.docs = docs

            def get_relevant_documents(self, query: str) -> List[Document]:
                keywords = [w.lower() for w in re.findall(r"\w+", query) if len(w) > 3]
                if not keywords:
                    return self.docs[:15]
                scored = []
                for d in self.docs:
                    content_lower = d.page_content.lower()
                    score = sum(content_lower.count(k) for k in keywords)
                    scored.append((score, d))
                scored.sort(key=lambda x: x[0], reverse=True)
                return [d for score, d in scored[:15]] or self.docs[:15]

        return FallbackRetriever(split_docs)


def retrieve_multi_dimensional_clauses(retriever, user_request: str) -> str:
    """Queries retriever across key contract dimensions to ensure comprehensive clause extraction."""
    dimensions = [
        user_request or "General legal contract audit",
        "Parties, execution dates, effective date, duration, renewal, governing law",
        "Payment terms, fee structure, compensation, invoice schedules, financial penalties",
        "Core obligations, representations, warranties, deliverable milestones",
        "Termination conditions, breach, default, cure periods, dispute resolution",
        "Indemnification, limitation of liability, intellectual property, red flags, ambiguities",
    ]

    collected = []
    seen = set()

    for dim in dimensions:
        try:
            docs = retriever.get_relevant_documents(dim)
            for d in docs:
                content = d.page_content.strip()
                if content and content not in seen:
                    seen.add(content)
                    collected.append(content)
        except Exception as e:
            print(f"[Ingestion Node] Error querying dimension '{dim}': {e}")

    return "\n\n---\n\n".join(collected)


def ingestion_node(state: ContractAnalyzerState) -> ContractAnalyzerState:
    """
    Node 1: Validates uploaded contract files, chunks documents, builds the hybrid index,
    and retrieves clauses across all operational and risk dimensions.
    """
    documents = state.get("documents", [])
    user_request = state.get("request_text", "")

    # If documents is empty but user_request contains substantial text (e.g. pasted contract), wrap it as a Document
    if not documents and len(user_request.strip()) > 80:
        documents = [Document(page_content=user_request.strip(), metadata={"source": "pasted_text"})]
        state["documents"] = documents

    if not documents or not any(getattr(d, "page_content", "").strip() for d in documents):

        print("[Ingestion Node] Error: No readable contract text found in uploaded files.")
        state["is_valid_doc"] = False
        state["doc_error"] = "No readable contract text found in uploaded files."
        state["retrieved_clauses"] = ""
        return state

    state["is_valid_doc"] = True
    state["doc_error"] = None

    print(f"[Ingestion Node] Indexing {len(documents)} document pages with Hybrid RAG...")
    retriever = build_hybrid_contract_retriever(documents)
    retrieved = retrieve_multi_dimensional_clauses(retriever, user_request)

    if not retrieved.strip():
        # Fallback to direct document text
        retrieved = "\n\n".join([doc.page_content for doc in documents[:10]])

    state["retrieved_clauses"] = retrieved
    print(f"[Ingestion Node] Successfully retrieved {len(retrieved)} characters of clause context.")
    return state

