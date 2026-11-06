import io
import time
from typing import List
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from schemas.contract_schemas import ContractSubmissionResponse
from services.document_service import extract_elements_from_stream
from services.contract_analyzer import run_contract_analyzer_pipeline
from services.input_guard import guard_contract_analyzer

router = APIRouter(tags=["Contract Analyzer"])

# Allowed file types and max file size
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024   # 20 MB per file
MAX_FILES = 5


@router.post("/contractanalyzer", response_model=ContractSubmissionResponse)
async def contract_analyzer_endpoint(
    request: str = Form("Please perform a complete evidence-backed contract risk audit."),
    files: List[UploadFile] = File(...),
):
    """
    Analyzes uploaded contracts via the 4-Node Agentic Pipeline.
    Protected by multi-layer guardrails: input validation, file type/size checks,
    prompt injection, XSS, SQL injection, path traversal, and off-topic detection.
    """
    start_time = time.time()

    # --- Guardrail: Validate the request instruction text ---
    is_safe, guard_message = guard_contract_analyzer(request)
    if not is_safe:
        print(f"[Guardrail] Contract Analyzer: blocked request text")
        return ContractSubmissionResponse(answers=[{
            "error": True,
            "message": guard_message,
            "title": "Request Blocked",
            "plain_summary": guard_message,
        }])

    # --- Guardrail: File count limit ---
    if len(files) == 0:
        return ContractSubmissionResponse(answers=[{
            "error": True,
            "message": "📄 I am LegalSmiths Contract Analyzer. Please upload at least one contract file (PDF, DOCX, or TXT).",
            "title": "No File Provided",
            "plain_summary": "No file uploaded.",
        }])

    if len(files) > MAX_FILES:
        return ContractSubmissionResponse(answers=[{
            "error": True,
            "message": f"📄 I am LegalSmiths Contract Analyzer. A maximum of {MAX_FILES} files can be analyzed at once.",
            "title": "Too Many Files",
            "plain_summary": f"Maximum {MAX_FILES} files allowed per request.",
        }])

    docs = []
    for f in files:
        # --- Guardrail: File extension check ---
        filename_lower = (f.filename or "").lower()
        ext = "." + filename_lower.rsplit(".", 1)[-1] if "." in filename_lower else ""
        if ext not in ALLOWED_EXTENSIONS:
            return ContractSubmissionResponse(answers=[{
                "error": True,
                "message": (
                    f"📄 I am LegalSmiths Contract Analyzer. The file '{f.filename}' has an unsupported format. "
                    f"Please upload a PDF, DOCX, DOC, or TXT file."
                ),
                "title": "Unsupported File Type",
                "plain_summary": f"Unsupported file type: {ext}",
            }])

        # --- Guardrail: File size check ---
        content = await f.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            return ContractSubmissionResponse(answers=[{
                "error": True,
                "message": (
                    f"📄 I am LegalSmiths Contract Analyzer. The file '{f.filename}' exceeds the 20 MB size limit. "
                    f"Please upload a smaller file."
                ),
                "title": "File Too Large",
                "plain_summary": f"File exceeds 20 MB limit.",
            }])

        # --- Guardrail: Empty file check ---
        if len(content) == 0:
            return ContractSubmissionResponse(answers=[{
                "error": True,
                "message": f"📄 I am LegalSmiths Contract Analyzer. The file '{f.filename}' appears to be empty.",
                "title": "Empty File",
                "plain_summary": "Uploaded file is empty.",
            }])

        file_stream = io.BytesIO(content)
        extracted = extract_elements_from_stream(file_stream, f.filename)
        docs.extend(extracted)

    # --- Guardrail: Check extracted text is not empty ---
    if not docs:
        return ContractSubmissionResponse(answers=[{
            "error": True,
            "message": (
                "📄 I am LegalSmiths Contract Analyzer. No readable text could be extracted from the uploaded file(s). "
                "Please ensure the document is not password-protected, scanned-only, or corrupted."
            ),
            "title": "Text Extraction Failed",
            "plain_summary": "Could not extract text from uploaded file.",
        }])

    # --- Guardrail: Validate extracted document text content ---
    full_extracted_sample = " ".join([getattr(d, "page_content", "") for d in docs])[:3500].strip()
    is_doc_safe, doc_guard_msg = guard_contract_analyzer(full_extracted_sample)
    if not is_doc_safe:
        print(f"[Guardrail] Contract Analyzer: blocked document content")
        return ContractSubmissionResponse(answers=[{
            "error": True,
            "message": doc_guard_msg,
            "title": "Document Content Blocked",
            "plain_summary": doc_guard_msg,
        }])

    # Run the analysis pipeline
    try:
        analysis_result = run_contract_analyzer_pipeline(request, docs)
    except Exception as exc:
        print(f"[Contract Analyzer] Pipeline error: {exc}")
        return JSONResponse(status_code=500, content={
            "message": f"Contract analysis failed: {type(exc).__name__}: {exc}"
        })

    total_time = time.time() - start_time
    print(f"[Contract Analyzer] ✅ Analyzed {len(files)} file(s) in {total_time:.2f}s")

    return ContractSubmissionResponse(answers=[analysis_result])
