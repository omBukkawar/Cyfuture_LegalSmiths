import re
import time
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
        def __init__(self, chunk_size=1200, chunk_overlap=300):
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


# Threshold under which we provide complete document analysis
# 65,000 characters (~13,000 words) easily fits in GPT-4o-mini (128k context) & Llama 3.3 70B (128k context)
MAX_COMPLETE_DOC_CHARS = 65000


def build_hybrid_contract_retriever(documents: List[Document]):
    """
    Builds the Advanced Hybrid RAG Retriever for large contracts:
    - BM25 sparse keyword retriever
    - FAISS dense vector store with Maximal Marginal Relevance (MMR)
    - Ensemble combining sparse and dense signals
    - Cross-Encoder reranker
    - Multi-query expansion via OpenRouter LLM
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=300)
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
            weights=[0.6, 0.4],
        )

        # CrossEncoder reranker
        compressor = CrossEncoderReranker(model=reranker_model, top_n=14)
        reranked_retriever = ContextualCompressionRetriever(
            base_compressor=compressor,
            base_retriever=ensemble,
        )

        # Multi-query expansion
        multi_query_retriever = MultiQueryRetriever.from_llm(
            retriever=reranked_retriever,
            llm=llm,
            prompt=PromptTemplate.from_template(
                "Generate 3 distinct search queries to identify all legal clauses, liabilities, exceptions, and terms for:\n\n{question}"
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


def extract_critical_sections_outline(full_text: str) -> str:
    """Extracts section titles and high-risk clause headings to preserve structural cross-clause navigation."""
    outline_lines = []
    # Identify headings like 'Section 1', 'Article II', 'Clause 3', '4. Limitation of Liability'
    pattern = re.compile(r"^(?:(?:Section|Article|Clause|\d+\.|\d+\))\s+[A-Za-z0-9\s,\-\(\)]{3,60})", re.MULTILINE | re.IGNORECASE)
    matches = pattern.findall(full_text)
    if matches:
        outline_lines.append("=== CONTRACT STRUCTURAL OUTLINE / CLAUSE MAP ===")
        for m in matches[:40]:
            clean_m = m.strip()
            if len(clean_m) > 4:
                outline_lines.append(f"• {clean_m}")
    return "\n".join(outline_lines)


def retrieve_multi_dimensional_clauses(retriever, user_request: str) -> str:
    """Queries retriever across key contract dimensions to ensure comprehensive clause extraction."""
    dimensions = [
        user_request or "General legal contract audit",
        "Parties, execution dates, effective date, duration, renewal, governing law, jurisdiction",
        "Payment terms, fee structure, compensation, invoice schedules, financial penalties, interest",
        "Core obligations, representations, warranties, deliverable milestones, covenants",
        "Termination conditions, termination for convenience, breach, default, cure periods, remedies",
        "Indemnification, defense obligations, uncapped liability, liability cap exceptions, carve-outs",
        "Intellectual property assignment, confidentiality exceptions, non-compete, liquidated damages",
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
    Node 1: Advanced Hybrid Ingestion & Adaptive Context Strategy.
    
    ENGINEERING IMPROVEMENTS (Gaps A & E):
    1. Retrieval Completeness: For contracts within safe context limits (<=65k chars),
       we use Complete-Document Analysis so cross-clause interactions (e.g. Section 18
       carve-out overriding Section 14 liability cap) are never missed by chunking filters.
    2. Retrieval Efficiency: Avoids expensive redundant chunking/reranking passes on
       standard-length contracts, saving latency and token costs.
    3. For larger contracts, combines Hybrid RAG with a Structural Clause Map and
       verbatim critical sections.
    """
    start_time = time.time()
    documents = state.get("documents", [])
    user_request = state.get("request_text", "")

    # If documents is empty but user_request contains substantial text (e.g. pasted contract), wrap as Document
    if not documents and len(user_request.strip()) > 80:
        documents = [Document(page_content=user_request.strip(), metadata={"source": "pasted_text"})]
        state["documents"] = documents

    if not documents or not any(getattr(d, "page_content", "").strip() for d in documents):
        print("[Ingestion Node] Error: No readable contract text found in uploaded files.")
        state["is_valid_doc"] = False
        state["doc_error"] = "No readable contract text found in uploaded files."
        state["retrieved_clauses"] = ""
        state["full_document_text"] = ""
        state["document_length"] = 0
        state["retrieval_strategy"] = "failed"
        return state

    state["is_valid_doc"] = True
    state["doc_error"] = None

    # Assemble complete document text
    full_text = "\n\n".join([getattr(doc, "page_content", "").strip() for doc in documents if getattr(doc, "page_content", "").strip()])
    total_chars = len(full_text)
    state["full_document_text"] = full_text
    state["document_length"] = total_chars

    print(f"[Ingestion Node] Document assembled: {total_chars:,} characters (~{total_chars // 4:,} tokens).")

    # Strategy Selection:
    if total_chars <= MAX_COMPLETE_DOC_CHARS:
        # STRATEGY 1: COMPLETE DOCUMENT CONTEXT (Eliminates Gap A: Zero missed cross-clause carve-outs)
        strategy = "complete_document_context"
        retrieved = full_text
        print(f"[Ingestion Node] Using Complete-Document Analysis ({total_chars:,} chars) - preserves all cross-clause interactions.")
    else:
        # STRATEGY 2: HYBRID RAG + STRUCTURAL OUTLINE FOR LARGE CONTRACTS
        strategy = "hybrid_rag_with_structural_context"
        print(f"[Ingestion Node] Document exceeds {MAX_COMPLETE_DOC_CHARS:,} chars. Building Hybrid RAG with Structural Outline...")
        structural_map = extract_critical_sections_outline(full_text)
        retriever = build_hybrid_contract_retriever(documents)
        retrieved_chunks = retrieve_multi_dimensional_clauses(retriever, user_request)

        # Prepend structural map so LLM knows full document layout and all clause locations
        retrieved = f"{structural_map}\n\n=== RETRIEVED HIGH-RELEVANCE CLAUSES ===\n\n{retrieved_chunks}"

    state["retrieval_strategy"] = strategy
    state["retrieved_clauses"] = retrieved

    elapsed = time.time() - start_time
    print(f"[Ingestion Node] Completed in {elapsed:.2f}s | Strategy: {strategy} | Context: {len(retrieved):,} chars.")
    return state
