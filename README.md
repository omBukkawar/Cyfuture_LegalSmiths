LegalSmiths – AI-Powered Legal Assistant & Case Outcome Predictor

LegalSmiths is a three-layered system (Frontend, Backend, Database) designed for the Cyfuture AI Hackathon 1.0. It provides:

🧑‍⚖️ Legal Assistant → Answers legal queries in plain language.

📑 Contract Analyzer → Analyzes uploaded contracts and extracts structured insights.

⚖️ Case Outcome Predictor → Predicts the likely outcome of legal cases using AI models.

🖥️ Frontend Layer
🔧 Tech Used

React + Vite

Axios (API calls)

Bcrypt (password hashing)

Node.js

MySQL (for auth integration)

⚙️ Setup
# Go to frontend folder
cd frontend

# Install dependencies
npm install

# Install Vite
npm install vite

# Additional libraries
npm install axios bcrypt

# Node.js runtime
npm install node

# Database libraries (choose one depending on backend)
npm install mysql        # for SQL
# OR
npm install mongoose     # if using MongoDB

🚀 Run Frontend
npm run dev

Components

Login/Register → Auth with MySQL (bcrypt-hashed passwords).

Legal Assistant → Asks AI legal queries.

Contract Analyzer → Uploads contracts for AI review.

Case Prediction → Predicts outcomes.

Contact Us → Basic static page.


🗄️ Database Layer
MySQL (User Authentication)

Database: cyfuture_db
Table: users

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone_number VARCHAR(255)
);


Stores login & register user details.

Passwords hashed with bcrypt.

MongoDB (Legal Data)

Stores uploaded contracts, chat history, and user case details.


🤖 Backend + AI Layer
🔧 Tech Used

FastAPI (REST APIs)

LangChain (RAG pipeline)

FAISS + BM25 (semantic + keyword search)

HuggingFace Embeddings (BAAI/bge-base-en-v1.5)

CrossEncoder (BAAI/bge-reranker-base)

Unstructured (document parsing)

Google Generative AI (Gemini 2.5) (LLM for legal Q&A & contracts)

HuggingFace Datasets (Indian law datasets)

dotenv, pickle, JSON, regex (config & parsing)

CORS Middleware (frontend-backend communication)

📦 Install Dependencies

From python-backend/:

pip install -r requirements.txt


If requirements.txt is missing, manually install:

pip install pyngrok
pip install "unstructured[all-docs]"
pip install langchain
pip install sentence-transformers
pip install rank-bm25
pip install langchain_community
pip install langchain_huggingface
pip install faiss-cpu
pip install fastapi
pip install uvicorn
pip install "pydantic>=2"

⚙️ AI Layer Workflow
1. Legal Assistant (/legalassistant)

Retrieves legal texts & QAs.

Runs RAG (Retriever-Augmented Generation).

Returns plain-language legal answers with references.

2. Contract Analyzer (/contractanalyzer)

Uploads contracts → parses text.

Splits into chunks → builds FAISS + BM25 indexes.

Uses Gemini LLM to output structured JSON:

Parties, Dates, Payment terms, Obligations, Termination clauses, Ambiguities, Red flags, Plain summary, Risk level, Recommendations.

3. Case Outcome Predictor (/caseoutcomeprediction)

Takes case facts as input.

Preprocesses → passes through ML model.

Predicts favorable/unfavorable outcome.

🌍 Deployment (with Ngrok)

Since AI models run on Colab/Kaggle (GPU needed), we expose APIs via Ngrok tunnels:

Case Outcome Prediction → https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction

Contract Analyzer → https://monocable-dollishly-joannie.ngrok-free.app/contractanalyzer

🔑 Steps:

Create Ngrok account
.

Install Ngrok & set auth token.

Run backend with uvicorn:

uvicorn backend:app --host 0.0.0.0 --port 8000


Expose port via Ngrok:

ngrok http 8000

📁 Requirements File

All essential Python dependencies are listed in requirements.txt.

🚀 Running Full System

Start Databases

MySQL for users (cyfuture_db).

MongoDB for contracts & cases.

Run Python Backend (FastAPI + Gemini AI)

uvicorn backend.scripts.backend:app --reload --port 8000


Expose API via Ngrok

ngrok http 8000


Run Node.js Backend (for MySQL auth)

node server.js


Run Frontend (React + Vite)

npm run dev



