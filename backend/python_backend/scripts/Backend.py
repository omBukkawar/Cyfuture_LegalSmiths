#step 1:do all imports
from unstructured.partition.auto import partition
from langchain.docstore.document import Document
from fastapi import FastAPI,UploadFile,Form,File
from datasets import load_dataset
import os
from dotenv import load_dotenv
from pydantic import BaseModel,Field
from typing import List
import time
import pickle
import io
#langchain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import torch
from fastapi.middleware.cors import CORSMiddleware
import json
import re
from typing import Dict, Any

#step 2:load dataset and gemini api key
ds = load_dataset("DevToAI/indian_laws_llama2_supported")
ds2 = load_dataset("viber1/indian-law-dataset")
ds3 = load_dataset("mratanusarkar/Indian-Laws")
load_dotenv(dotenv_path="variables.env")
GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")
device="cuda" if torch.cuda.is_available() else "cpu"

#configure gemini llm
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    google_api_key=GEMINI_API_KEY
)

#STEP 3:CONVERTING DATASETS TO DOCUMENT OBJECTS

#converting dataset1 to document objects
docs1=[]

for row in ds["train"]:
    text=row["text"]
    if "Response:" in text:
        q = text.split("Response:", 1)[0].replace("<s>[INST] Instruction:", "").replace("[/INST]", "").strip()
        a = text.split("Response:", 1)[1].strip()
        qa = f"Question: {q}\nAnswer: {a}"
    else:
        qa=text.split()

    docs1.append(Document(page_content=qa, metadata={"source": "devtoAI", "type": "qa", "corpus": "laws"}))

#converting dataset2 to document objects
docs2=[]
for row in ds2["train"]:
    question=row.get("Instruction","").strip()
    answer=row.get("Response","").strip()
    qa = f"Question: {question}\nAnswer: {answer}"
    docs2.append(Document(page_content=qa, metadata={"source": "viber1", "type": "qa", "corpus": "laws"}))

#converting dataset3 to document objects
docs3=[]
for row in ds3["train"]:
    act=row.get("act_title","").strip()
    section=row.get("section","").strip()
    law_text=row.get("law","").strip()

    if law_text:
      docs3.append(Document(page_content=law_text,metadata={"source": "mratanusarkar", "type": "raw_law", "act_title": act, "section": section}))

#STEP 4:EXTRACTING ELEMENTS FROM DOCUMENTS
#extracting elements from datasets for legal assistant
def extract_elements(file_path: str) -> list[Document]:
     elements = partition(filename=file_path, strategy="fast")

     documents = []
     for element in elements:

        metadata = {
            "source": file_path,
            "element_type": element.category,
            "page_number": element.metadata.page_number if hasattr(element.metadata, 'page_number') else -1 # Access page_number directly
        }

        if element.category == "Table":
            content = f"Table from page {metadata['page_number']}:\n" + element.text
        else:
            content = element.text

        documents.append(Document(page_content=content, metadata=metadata))

     return documents
#extracting elements from uploaded contract files 
def advanced_extract_elements(file_stream: io.BytesIO,file_name:str) -> list[Document]:
     
     elements = partition(file=file_stream, strategy="fast")

     documents = []
     for element in elements:

        metadata = {
            "source": file_name,
            "element_type": element.category,
            "page_number": element.metadata.page_number if hasattr(element.metadata, 'page_number') else -1 # Access page_number directly
        }

        if element.category == "Table":
            content = f"Table from page {metadata['page_number']}:\n" + element.text
        else:
            content = element.text

        documents.append(Document(page_content=content, metadata=metadata))
     
     return documents

#STEP 5:DEFINING EMBEDDING MODEL AND RANKER MODEL
embedding_model = HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5", model_kwargs={"device": device})
model_name =HuggingFaceCrossEncoder(model_name= "BAAI/bge-reranker-base",model_kwargs={"device": device})

folder_path = "/content/drive/MyDrive/Legal_contract"
#STEP 6:RAG PART
def split_text_into_chunks(documents: list[Document],index_name:str):

   splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=250
    )
   split_docs = splitter.split_documents(documents)

   #vector_store = FAISS.from_documents(split_docs, embedding_model)
   faiss_index = os.path.join(folder_path, f"faiss_index_{index_name}")
   bm25_path = os.path.join(folder_path, f"bm25_index_{index_name}.pkl")

   if os.path.exists(faiss_index):
       vector_store=FAISS.load_local(faiss_index,embedding_model,allow_dangerous_deserialization=True)

   else:
       vector_store=FAISS.from_documents(split_docs, embedding_model)
       vector_store.save_local(faiss_index)

   if os.path.exists(bm25_path):
       with open(bm25_path, "rb") as f:
           bm25_retriever = pickle.load(f)
   else:
       bm25_retriever = BM25Retriever.from_documents(split_docs)
       bm25_retriever.k = 10
       with open(bm25_path, "wb") as f:
           pickle.dump(bm25_retriever, f)
       
   faiss_retriever = vector_store.as_retriever(search_type="mmr",
        search_kwargs={
            "k": 15,
            "fetch_k": 40,
            "lambda_mult": 0.7
        })

   ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, faiss_retriever], weights=[0.7, 0.3]
   )

   compressor = CrossEncoderReranker(
    model=model_name,
    top_n=15
   )

   reranked_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=ensemble_retriever
  )

   multi_query_retriever = MultiQueryRetriever.from_llm(
        retriever=reranked_retriever,
        llm=gemini_llm,
        prompt=PromptTemplate.from_template("Generate multiple search queries to retrieve information for:\n\n{question}")
    )

   return multi_query_retriever


#STEP 7: CREATING RETRIEVERS
retriever_question_answer=split_text_into_chunks(docs1+docs2,"question_answer_index")
retriever_acts_text=split_text_into_chunks(docs3,"legal_text_index")

#STEP 8:PASSING CONTEXT AND QUESTION TO GEMINI
def gemini_rag_query(question,custom_prompt):

    category_prompt = """Classify the question into one of the categories:
    1. qa - if it is a direct Q&A style legal question.
    2. legaltext - if it is asking for raw law text, sections, or verbatim legal provisions.
    3. mixed - if it needs both.

    Question: {question}
    Category:"""
    category_filled = category_prompt.format(question=question)

    category = gemini_llm.invoke(category_filled).content.strip().lower()

    if category=="qa":
        docs=retriever_question_answer.get_relevant_documents(question)

    elif category=="legaltext":
        docs=retriever_acts_text.get_relevant_documents(question)

    elif category=="mixed":
        docs=retriever_question_answer.get_relevant_documents(question)+retriever_acts_text.get_relevant_documents(question)

    else:
         docs=retriever_question_answer.get_relevant_documents(question)+retriever_acts_text.get_relevant_documents(question)

    context_text = "\n\n".join([doc.page_content for doc in docs])

    prompt_filled = custom_prompt.format(context=context_text, question=question)

    response = gemini_llm.invoke(prompt_filled)
    return response.content

#STEP 9: CREATING FASTAPI APP
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#STEP 10:DEFINE REQUEST AND RESPONSE MODELS LIKE WHAT FIELDS THEY SHOULD EXPECT
class SubmissionRequest(BaseModel):
    questions: List[str] = Field(...)


class SubmissionResponse(BaseModel):
    answers: List[str] = Field(...)
class ContractSubmissionResponse(BaseModel):
    answers: List[Dict[str, Any]] = Field(...)

#STEP 14:THIS FUNCTION IS FOR ANALYZING CONTRACTS
def analyze_contracts(question,retriever,custom_prompt):
    docs=retriever.get_relevant_documents(question)

    context="\n".join([doc.page_content for doc in docs])

    prompt=custom_prompt.format(context=context)

    response=gemini_llm.invoke(prompt)

    return response.content

#STEP 11:CREATING GET API ENDPOINTS
@app.get("/")
def read_root():
    return {"Status of legal assistant & contract analyzer": "API is running"}

#STEP 12:SENDING QUERIES TO LEGAL ASSISTANT ENDPOINT
@app.post("/legalassistant", response_model=SubmissionResponse)
def legal_Assistant(request:SubmissionRequest):

    # DEFINING CUSTOM PROMPT FOR GEMINI
    custom_prompt = PromptTemplate.from_template(
    """
    You are a helpful Indian Legal Assistant.

    Rules:
    1. Use the provided context to answer the question whenever relevant.
    2. If the context is incomplete or does not contain the answer, use your own legal knowledge to fill the gaps.
    3. Give one single, clear answer — do not split into context vs. general knowledge.
    4. Begin with a short, plain-language answer (1–2 sentences) explaining the law in everyday terms without legal jargon.
    5. Then give a brief explanation (max 4–5 sentences) adding important details or examples.
    6. Avoid legal terms like “imputation” or “hereby” unless necessary — use words an 8th-grade student,people from rural areas  can understand.
    7. Do not give procedural steps unless the user’s question clearly asks for “how to” or “process”.
    8. Mention the relevant Act, Section, or Case Title only at the end of the answer in brackets, e.g., [Indian Penal Code, Section 302].

    Context:
    {context}

    Question:
    {question}

    Answer:
    """
    )
    print(" New Request Received ")
    start_time = time.time()

    print(f"Received {len(request.questions)} questions")

    answers=[]
    for question in request.questions:
        answer=gemini_rag_query(question,custom_prompt)
        answers.append(answer)

    print("Generated answers.")

    total_time = time.time() - start_time

    print(f"Request was processed in {total_time:.2f} seconds.")

    return SubmissionResponse(answers=answers)


#STEP 13:THIS API ENDPOINT IS FOR ANALYZING CONTRACTS
    
@app.post("/contractanalyzer",response_model=ContractSubmissionResponse)
def contract_analyzer(*,request:str=Form(...),files: list[UploadFile]=File(...)):
    custom_prompt = PromptTemplate.from_template(
        """
    You are a Contract Analyzer AI.

    Read the provided contract carefully and return output in **JSON format** with the following structure:

    {{
        "title": "Contract Analysis for [Contract Type/Name]",
        "parties": "List all contracting parties with names/roles if available",
        "dates": "Extract key dates such as signing, start, end, deadlines",
        "payment_terms": "Summarize payment obligations, amounts, penalties, and who bears costs",
        "obligations": "Summarize duties and responsibilities of each party",
        "termination": "Summarize termination or default conditions, and consequences",
        "mistakes_ambiguities": "List any unclear, missing, contradictory, or incomplete clauses",
        "red_flags": "Highlight risky, unfair, or one-sided clauses",
        "plain_summary": "Give a short, plain-language summary in 3–4 sentences that a non-lawyer can understand",
        "risk_level": "Low / Medium / High, with a one-line reason",
        "recommendations": "Suggest next steps to be taken in simplest way so that a lawyer or non lawyer can understand"
    }}

    Make sure to return valid JSON format only, no additional text or formatting.

    Contract Text:
    {context}

    Analysis:
    """
    )

    print("New Contract Analysis Request Received")
    start_time = time.time()

    docs = []
    for f in files:
        content = f.file.read()
        file_stream = io.BytesIO(content)
        docs.extend(advanced_extract_elements(file_stream, f.filename))

    retriever = split_text_into_chunks(docs, 'contracts')
    answers = []
  
    raw_answer = analyze_contracts(request, retriever, custom_prompt)
    
    try:
        json_match = re.search(r'\{.*\}', raw_answer, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            parsed_answer = json.loads(json_str)
        else:
            parsed_answer = json.loads(raw_answer)
            
        answers.append(parsed_answer)
        
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"Failed to parse JSON: {e}")
        fallback_answer = {
            "title": "Contract Analysis",
            "parties": "Could not extract structured data",
            "dates": "Could not extract structured data", 
            "payment_terms": "Could not extract structured data",
            "obligations": "Could not extract structured data",
            "termination": "Could not extract structured data",
            "mistakes_ambiguities": "Could not extract structured data",
            "red_flags": "Could not extract structured data",
            "plain_summary": "Could not extract structured data",
            "risk_level": "Unknown",
            "recommendations": "Please review the contract manually",
            "raw_response": raw_answer
        }
        answers.append(fallback_answer)

    print("Generated structured contract analysis.")
    total_time = time.time() - start_time
    print(f"Contract analysis request was processed in {total_time:.2f} seconds.")
    return ContractSubmissionResponse(answers=answers)

