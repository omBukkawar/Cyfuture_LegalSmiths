Cyfuture LegalSmiths

LegalSmiths is an AI-powered legal assistant and case outcome prediction system built for the Cyfuture AI Hackathon 1.0.

It provides:
1] Legal Assistant – Answers legal queries in plain language.
2] Contract Analyzer – Analyzes uploaded contracts and extracts structured insights.
3] Case Outcome Predictor – Predicts the likely outcome of legal cases using AI models.

Repository Structure
<img width="808" height="635" alt="image" src="https://github.com/user-attachments/assets/16e4ef9e-bbdc-4bfd-8841-b7e126dbac46" />

Frontend Layer
 Tech Used
React + Vite
Axios (API calls)
Bcrypt (password hashing)
Node.js

Setup
# Install dependencies
npm install

# Install additional packages
npm install vite axios bcrypt

# Node.js runtime
npm install node

# Database libraries 
npm install mysql        # for SQL
npm install mongoose     # if using MongoDB

 Run Frontend
npm run dev

Components
Login / Register – Uses MySQL (cyfuture_db.users) with bcrypt-hashed passwords.
Services-Provides list of services offered by our application.
Legal Assistant – Asks legal questions, gets AI answers.
Contract Analyzer – Uploads contracts, gets structured analysis.
Case Outcome Predictor – Predicts case outcomes.
Contact Us – Basic contact form/page.


Database Layer
MySQL (User Authentication)
Install mysql 
Then open command prompt and type mysql -u root -p
Enter your username and password
Create database as follows:
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
Passwords are hashed with bcrypt.


MongoDB
This NoSQL database handles our legal data as follows:
Contract documents
Legal assistant chats
Case details

Backend + AI Layer
 Tech Used

FastAPI (REST APIs)
LangChain (RAG pipeline)
FAISS + BM25 (semantic + keyword search)
HuggingFace Embeddings (BAAI/bge-base-en-v1.5)
CrossEncoder (BAAI/bge-reranker-base)
Unstructured (document parsing)
Google Generative AI (Gemini 2.5) (LLM for legal Q&A & contracts)
HuggingFace Datasets (Indian law datasets)
dotenv, pickle, JSON
CORS Middleware (frontend-backend communication)

Install Dependencies

From /backend/:
pip install -r requirements.txt

If you need to install manually:
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

 AI Layer Workflow
1. Legal Assistant (/legalassistant)
Retrieves legal texts & QAs.
Runs RAG (Retriever-Augmented Generation) using FAISS ( Facebook Similarity Search Database).
Returns plain-language legal answers with references.

2. Contract Analyzer (/contractanalyzer)
Uploads contracts → parses text.
Splits into chunks → builds FAISS + BM25 indexes.
Uses Gemini LLM to output structured JSON:
Parties, Dates, Payment terms, Obligations, Termination clauses, Ambiguities, Red flags, Plain summary, Risk level, Recommendations.

This is the colab file link for legal assistant and smart contract analyzer:
https://colab.research.google.com/drive/1EtG6lfml7WMJUNBrByXRkDWLbNajbKcO#scrollTo=Bj43NmKboq-5
Contract Analyzer → https://monocable-dollishly-joannie.ngrok-free.app/contractanalyzer

3. Case Outcome Predictor (/caseoutcomeprediction)
Takes case facts as input.
Preprocesses → passes through ML model.
Predicts favorable/unfavorable outcome.

 Deployment (with Ngrok)
Since AI models run on Colab/Kaggle (GPU needed), we expose APIs via Ngrok tunnels:
Case Outcome Prediction → https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction
Kaggle File Link: https://www.kaggle.com/code/pavankumar1185/legalsmiths-case-outcome-prediction-fastapi/edit

 Steps:
Create Ngrok account.
Install Ngrok & set auth token.
Run backend with uvicorn:
Eg:
uvicorn backend:app --host 0.0.0.0 --port 8000
This command is already listed in notebooks.

 Requirements File

All essential Python dependencies are listed in requirements.txt.

Running the System
1. Start Databases

Run MySQL (cyfuture_db) for user login.
Run MongoDB for contracts, chats, cases.

2. Run Python Backend (AI APIs)
uvicorn backend.scripts.backend:app --reload --port 8000

3. Expose via Ngrok
ngrok http 8000

4. Run Node.js Backend (Auth APIs)
node server.js

5. Run React Frontend
npm run dev

Deployment with Ngrok

Because models are GPU-heavy and run on Colab/Kaggle, we use Ngrok tunnels to expose APIs:

Case Outcome Prediction →
https://stylish-onie-slung.ngrok-free.app/caseoutcomeprediction

Contract Analyzer →
https://monocable-dollishly-joannie.ngrok-free.app/contractanalyzer

Key Features

Secure login/register (MySQL + bcrypt).
AI Legal Assistant with Indian law datasets.
Contract Analyzer with JSON-structured results.
Case Outcome Prediction using gemini 2.5 flash llm model.
Ngrok-based deployment for Colab/Kaggle-hosted models.
