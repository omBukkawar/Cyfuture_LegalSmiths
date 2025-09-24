# Cyfuture LegalSmiths

**LegalSmiths** is an AI-powered legal assistant and case outcome prediction system built for the **Cyfuture AI Hackathon 1.0**.  
It combines advanced AI, secure authentication, and legal domain datasets to provide the following:

- **Legal Assistant** – Answers legal queries in plain language.  
- **Contract Analyzer** – Analyzes uploaded contracts and extracts structured insights.  
- **Case Outcome Predictor** – Predicts the likely outcome of legal cases using AI models.  

## A] Table of Contents
- [Project Structure](#project-structure)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Database Setup](#database-setup)
- [Running the System](#running-the-system)
- [AI Layer Workflow](#ai-layer-workflow)
- [Deployment with Ngrok](#deployment-with-ngrok)
- [Package Breakdown](#package-breakdown)
- [Contributors](#contributors)

## B] Project Structure
The repository is divided into three major layers:

1. **Frontend Layer (React + Vite)**  
2. **Backend Layer (Node.js + Express for Auth APIs)**  
3. **AI Layer (FastAPI, LangChain, Gemini LLM, FAISS, BM25)**  
4. **Databases**  
   - **MySQL**: For user authentication.  
   - **MongoDB**: For legal data (contracts, chats, case details).  

## C] Features
-  **Secure login/register** (MySQL + bcrypt)  
-  **AI Legal Assistant** (Answers legal Q&A)  
-  **Contract Analyzer** (JSON-structured insights + red flags in  contract docuemnts)  
-  **Case Outcome Prediction** (Predicts outcome of cases with next steps)  
-  **Ngrok-based deployment** (Colab/Kaggle GPU-powered models)  

## D] Technologies
- **Frontend:** React, Vite, React Router, Axios  
- **Backend (Auth APIs):** Node.js, Express, CORS, Multer, MySQL2, Mongoose, Bcrypt  
- **AI Backend:** FastAPI, LangChain, FAISS, BM25, HuggingFace embeddings, Gemini 2.5 LLM  
- **Databases:**  
  - MySQL (authentication)  
  - MongoDB (contracts, chats, case details)  

## E] Installation
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

# F] Running the System
### Start Databases
1. Run MySQL (cyfuture_db)
2. Run MongoDB
3. Run Python AI Backend
```bash
uvicorn backend.scripts.backend:app --reload --port 8000
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

## G] AI Layer Workflow
## 1. Legal Assistant (/legalassistant)
### Uses Retriever-Augmented Generation (RAG) with FAISS(FACEBOOK SIMILARITY SEARCH).
### Returns plain-language legal answers with references.
## 2. Contract Analyzer (/contractanalyzer)
### 1. Upload contract → parse text → chunk into FAISS + BM25 indexes.
### 2. Uses Gemini 2.5 LLM Model for structured JSON output as follows:
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

[Colab Notebook Link for legal assistant and contract analzyer](https://colab.research.google.com/drive/1EtG6lfml7WMJUNBrByXRkDWLbNajbKcO#scrollTo=Bj43NmKboq-5)

## 3. Case Outcome Predictor (/caseoutcomeprediction)
### Takes case facts as input → Preprocess → ML model → Predicts outcome.

[Kaggle Notebook Link](https://www.kaggle.com/code/pavankumar1185/legalsmiths-case-outcome-prediction-fastapi/edit)


# E] Deployment with Ngrok

## Since GPU models run on Colab/Kaggle, APIs are exposed via Ngrok.

## Steps:

### 1]Create Ngrok account & set up auth token.
### 2] Run backend with Uvicorn:
## Eg:
```python
uvicorn backend:app --host 0.0.0.0 --port 8000
```

# F] Package Breakdown
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

# G] Contributors

Developed by Team HackSmiths for the Cyfuture AI Hackathon 1.0.




