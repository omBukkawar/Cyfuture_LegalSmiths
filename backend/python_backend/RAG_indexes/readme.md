## Retrieval Indexes

This folder stores all **retrieval indexes** used by the **Cyfuture_LegalSmiths** project to enable fast document search and question-answering.

###  Purpose
These indexes significantly speed up information retrieval for both the **Legal Assistant** and **Contract Analyzer** modules.

###  Index Details

#### Legal Assistant
- **FAISS** (Facebook AI Similarity Search) – *Vector Database*
  - `faiss_index-question-answer-index`
  - `faiss_index_legal_text_index`
- **BM25** (Keyword Retriever)
  - `bm25_index-question-answer-index.pkl`
  - `bm25_index_legal_text_index`

#### Contract Analyzer
- **FAISS** – *Vector Database*
  - `faiss_index_contracts_index`
- **BM25**
  - `bm25_index_contracts.pkl`
