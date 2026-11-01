import io
import time
from typing import List
from fastapi import APIRouter, UploadFile, File, Form
from schemas.contract_schemas import ContractSubmissionResponse
from services.document_service import extract_elements_from_stream
from services.contract_analyzer import run_contract_analyzer_pipeline

router = APIRouter(tags=["Contract Analyzer"])

@router.post("/contractanalyzer", response_model=ContractSubmissionResponse)
async def contract_analyzer_endpoint(
    request: str = Form("Please analyze this contract."),
    files: List[UploadFile] = File(...),
):
    """Analyzes uploaded contracts via the 4-Node Agentic Pipeline (Ingestion -> Extraction -> Risk Audit -> Synthesis)."""
    start_time = time.time()
    docs = []

    for f in files:
        content = await f.read()
        file_stream = io.BytesIO(content)
        extracted = extract_elements_from_stream(file_stream, f.filename)
        docs.extend(extracted)

    analysis_result = run_contract_analyzer_pipeline(request, docs)
    total_time = time.time() - start_time
    print(f"Contract analysis processed {len(files)} files in {total_time:.2f}s")

    return ContractSubmissionResponse(answers=[analysis_result])

