# Cyfuture LegalSmiths

**LegalSmiths** is an AI-powered legal assistant, contract analyzer, and case outcome prediction system built for the **Cyfuture AI Hackathon 1.0**.  
It combines advanced LLM models, secure authentication, and legal domain datasets to provide the following features:

- **Legal Assistant** – Answers legal queries in simple, user-friendly language.  
- **Contract Analyzer** – Analyzes uploaded contracts and extracts structured insights.  
- **Case Outcome Predictor** – Uses LLM models to predict the likely outcomes and potential consequences of legal cases and contract breaches.  

## A] Table of Contents
- [Features](#features)
- [Tech Stack](#Tech-Stack)
- [Installation](#installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Database Setup](#database-setup)
- [Running the System](#running-the-system)
- [AI Layer Workflow](#ai-layer-workflow)
- [Deployment with Ngrok](#deployment-with-ngrok)
- [Package Breakdown](#package-breakdown)
- [Contributors](#contributors)  

## B] Features
-  **Secure login/register** (MySQL + bcrypt)  
-  **AI Legal Assistant** (Answers legal Q&A)  
-  **Contract Analyzer** (JSON-structured insights + red flags in  contract documents)  
-  **Case Outcome Prediction** (Predicts outcome of cases with next steps)  
-  **Ngrok-based deployment** (Colab/Kaggle GPU-powered models)  

## C] Tech Stack
- **Frontend:** React, Vite, React Router, Axios  
- **Backend (Auth APIs):** Node.js, Express, CORS, Multer, MySQL2, Mongoose, Bcrypt  
- **AI Backend:** FastAPI, LangChain, FAISS, BM25, HuggingFace embeddings, Gemini 2.5 LLM  
- **Databases:**  
  - MySQL (authentication)  
  - MongoDB (contracts, chats, case details)  

## D] Installation
### 1] Frontend Setup
```bash
# Install core dependencies
npm install

# Install additional packages
npm install react react-dom react-router-dom axios debug
npm install vite axios bcrypt
```

### 2] Backend Setup

### Install Node.js backend dependencies
```bash
# Nodejs Backend
cd backend/node_backend/
npm install express cors multer mongoose bcrypt bcryptjs mysql2 axios

#Python backend
cd backend/python_backend/
pip install -r requirements.txt

# Or manually install:
pip install pyngrok "unstructured[all-docs]" langchain sentence-transformers \
rank-bm25 langchain_community langchain_huggingface faiss-cpu fastapi uvicorn "pydantic>=2"
```

### 3] DATABASE SETUP
## MySQL (for authentication)
```sql
mysql -u root -p

CREATE DATABASE cyfuture_db;

USE cyfuture_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone_number VARCHAR(255)
);
```

## MongoDB (for legal data)
### Stores contract documents, chat logs, and case details of user.

# E] Running the System
### Start Databases
1. Run MySQL (cyfuture_db)
2. Run MongoDB
3. Run Python AI Backend
Eg:
```bash
uvicorn backend:app --reload --port 8000
```
4. Run Node.js Backend 
```bash
cd backend/node_backend/
node server.js
```
5. Run React Frontend
```bash
npm run dev
```

## F] AI Layer Workflow
## 1. Legal Assistant (/legalassistant)
### Uses Retriever-Augmented Generation (RAG) with FAISS(FACEBOOK AI SIMILARITY SEARCH) Vector Database.
### Returns plain-language legal answers with references through GEMINI 2.5 FLASH LLM Model.
## 2. Contract Analyzer (/contractanalyzer)
### 1. Upload contract → parse text → chunk into FAISS + BM25 indexes.
### 2. The Gemini 2.5 LLM Model queries these indexes to retrieve specific clauses and information, and generates a structured JSON output based directly on the retrieved content as follows:
- Parties
- Dates
- Payment Terms
- Obligations
- Termination Clauses
- Red Flags
- Summary
- Risk Level
- Recommendations

---

[Colab Notebook Link for legal assistant and contract analyzer](https://colab.research.google.com/drive/1EtG6lfml7WMJUNBrByXRkDWLbNajbKcO#scrollTo=Bj43NmKboq-5)

### RAG (Retrieval Augmented Generation Architecture):
| Stage                              | Legal Assistant (General)                                                                                       | Contract Analyzer (Focused)                                                                     |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **1. Indexing & Storage**        | Public legal docs chunked & vectorized with `HuggingFaceEmbeddings`, stored in **FAISS** + **BM25** for search. | Contract chunked & vectorized in-memory; temporary **FAISS** + **BM25** built for one-time use. |
| **2. Retrieval & Re-ranking**    | **Hybrid Search** (FAISS + BM25) retrieves docs → **Cross-Encoder** re-ranks for precision.                     | Same Hybrid Search runs on temp index → **Cross-Encoder** re-ranks contract clauses.            |
| **3. Augmentation & Prompting**  | Top passages + user query → rich prompt for LLM.                                                                | Top clauses + structured prompt → JSON-ready context.                                           |
| **4. Generation**              | LLM outputs a **conversational answer**.                                                                        | LLM outputs a **structured JSON report** (parties, red_flags, recommendations,etc).                 |

We have created faiss(Facebook AI Similarity Search) vector database indexes and bm25 indexes in order to speed up retrieval and avoid rebuilding the retriever for every new request.

The indexes are stored in drive.

[RAG Indexes Link](https://drive.google.com/drive/folders/1yGgNFrt3KH9APPRaeD29fO9Iyz6e6dak?usp=sharing)

## 3. Case Outcome Predictor (/caseoutcomeprediction)
### Takes case facts as input → Preprocess → Gemini 2.5 Flash LLM model → Predicts outcome.

[Kaggle Notebook Link](https://www.kaggle.com/code/pavankumar1185/legalsmiths-case-outcome-prediction-fastapi/edit)




### Models used:
| **Model / Component**            | **Purpose**                                                      | **Library / Source**                        |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------- |
| `ChatGoogleGenerativeAI`         | Large Language Model (LLM) for QA, RAG, and query generation     | `langchain_google_genai`                    |
| `HuggingFaceEmbeddings`          | Generates embeddings for documents to store in vector database   | `langchain_huggingface`                     |
| `HuggingFaceCrossEncoder`        | Cross-encoder model for reranking retrieved documents            | `langchain_community.cross_encoders`        |
| `FAISS`                          | Vector store retriever for embedding-based search                | `langchain_community.vectorstores`          |
| `BM25Retriever`                  | Keyword-based retriever for traditional search                   | `langchain_community.retrievers`            |
| `EnsembleRetriever`              | Combines multiple retrievers with weights                        | `langchain.retrievers`                      |
| `CrossEncoderReranker`           | Reranks top retrieved documents based on relevance               | `langchain.retrievers.document_compressors` |
| `ContextualCompressionRetriever` | Compresses retrieved context before feeding to LLM               | `langchain.retrievers`                      |
| `MultiQueryRetriever`            | Generates multiple search queries using LLM to improve retrieval | `langchain.retrievers.multi_query`          |
| `RecursiveCharacterTextSplitter` | Splits long text into chunks for retrieval and embedding         | `langchain.text_splitter`                   |
| `PromptTemplate`                 | Template prompts for LLM input                                   | `langchain.prompts`                         |
| `Document`                       | Wrapper for text and metadata of documents                       | `langchain.docstore.document`               |


### Essential Python libraries used:
| **Library / Module**                        | **Purpose in Code**                                               |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `os`                                        | File system operations, path handling                             |
| `time`                                      | Measure execution time                                            |
| `io`                                        | Handle in-memory file streams                                     |
| `json`                                      | Parse and generate JSON                                           |
| `re`                                        | Regular expressions for text parsing                              |
| `pickle`                                    | Save/load Python objects like retrievers                          |
| `dotenv`                                    | Load environment variables (e.g., API keys)                       |
| `typing`                                    | Type hints (`List`, `Dict`, `Any`)                                |
| `pydantic`                                  | Define request and response models (`BaseModel`, `Field`)         |
| `torch`                                     | Model computation, GPU/CPU device selection                       |
| `datasets`                                  | Load datasets from Hugging Face                                   |
| `unstructured.partition.auto`               | Extract elements from documents (tables, text, etc.)              |
| `fastapi`                                   | Create API endpoints (`FastAPI`, `UploadFile`, `Form`, `File`)    |
| `fastapi.middleware.cors`                   | Enable Cross-Origin Resource Sharing (`CORSMiddleware`)           |
| `langchain.docstore.document`               | Represent documents with content and metadata (`Document`)        |
| `langchain.text_splitter`                   | Split text into smaller chunks (`RecursiveCharacterTextSplitter`) |
| `langchain_community.vectorstores`          | Store and retrieve embeddings (`FAISS`)                           |
| `langchain_community.retrievers`            | BM25 retriever (`BM25Retriever`)                                  |
| `langchain.retrievers`                      | Ensemble, compression, and multi-query retrievers                 |
| `langchain.retrievers.document_compressors` | Cross-encoder reranker (`CrossEncoderReranker`)                   |
| `langchain_community.cross_encoders`        | HuggingFace cross-encoder model (`HuggingFaceCrossEncoder`)       |
| `langchain.retrievers.multi_query`          | Multi-query retriever (`MultiQueryRetriever`)                     |
| `langchain.prompts`                         | Create prompt templates for LLM (`PromptTemplate`)                |
| `langchain_huggingface`                     | Generate embeddings (`HuggingFaceEmbeddings`)                     |
| `langchain_google_genai`                    | Interface with Gemini LLM (`ChatGoogleGenerativeAI`)              |


# G] Deployment with Ngrok

## Since GPU models run on Colab/Kaggle, APIs are hosted via Ngrok.

## Steps:

### 1]Create Ngrok account & set up auth token.
### 2] Run backend with Uvicorn:
## Eg:
```python
uvicorn backend:app --host 0.0.0.0 --port 8000
```
### 3]Endpoints:
- https://monocable-dollishly-joannie.ngrok-free.app/contractanalyzer
- https://monocable-dollishly-joannie.ngrok-free.app/legalassistant
- https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction
# H] Package Breakdown
## Backend (Node.js)
| Package           | Purpose              |
| ----------------- | -------------------- |
| express           | Web server framework |
| cors              | CORS middleware      |
| multer            | File uploads         |
| mongoose          | MongoDB ORM          |
| bcrypt / bcryptjs | Password hashing     |
| mysql2            | MySQL client         |
| axios             | HTTP client          |


## Installation command:
```bash 
npm install express cors multer mongoose bcrypt bcryptjs mysql2 axios
```

## Frontend (React)
| Package          | Purpose       |
| ---------------- | ------------- |
| react, react-dom | Core UI       |
| react-router-dom | Routing       |
| axios            | HTTP client   |
| debug            | Debug logging |

## Install runtime:
```bash
npm install react react-dom react-router-dom axios debug
```

## Install dev dependencies:

```bash
npm install -D vite @vitejs/plugin-react eslint @eslint/js \
eslint-plugin-react-hooks eslint-plugin-react-refresh globals \
@types/react @types/react-dom
``` 

# I] Contributors

Developed by Team HackSmiths :
1. [Pavankumar-Batchu1185](https://github.com/Pavankumar-Batchu1185)
2. [AnvitaChougule](https://github.com/AnvitaChougule)
3. [Gaurang2805](https://github.com/Gaurang2805)
4. [omBukkawar](https://github.com/omBukkawar)
5. [Shivam2407-Hub](https://github.com/Shivam2407-Hub)




