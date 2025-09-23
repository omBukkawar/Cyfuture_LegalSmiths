## Retrieval Indexes

This folder stores all **retrieval indexes** used by the **Cyfuture_LegalSmiths** project to enable fast document search and question-answering.

###  Purpose
These indexes significantly speed up information retrieval for both the **Legal Assistant** and **Contract Analyzer** modules.

###  Index Details

#### Legal Assistant
- **FAISS** (Facebook AI Similarity Search)  
  - `faiss_index-question-answer-index`  
  - `faiss_index_legal_text_index`
- **BM25** (Keyword Retriever)  
  - `bm25_index-question-answer-index.pkl`  
  - `bm25_index_legal_text_index`

#### Contract Analyzer
- **FAISS**  
  - `faiss_index_contracts_index`
- **BM25**  
  - `bm25_index_contracts.pkl`

###  Notes
- These are **pre-built indexes** required for fast retrieval; they are **not raw datasets**.  
- If you rebuild indexes, make sure to update this folder and re-generate the files accordingly.
