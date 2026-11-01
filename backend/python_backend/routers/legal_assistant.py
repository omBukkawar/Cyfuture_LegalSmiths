import time
from fastapi import APIRouter
from schemas.assistant_schemas import SubmissionRequest, SubmissionResponse
from services.legal_assistant import run_legal_assistant_pipeline

router = APIRouter(tags=["Legal Assistant"])

@router.post("/legalassistant", response_model=SubmissionResponse)
def legal_assistant_endpoint(request: SubmissionRequest):
    """Answers legal questions using the 4-Node Agentic Pipeline (Guardrails -> Search -> Evaluation -> Synthesis)."""
    start_time = time.time()
    answers = []

    for question in request.questions:
        answer = run_legal_assistant_pipeline(question)
        answers.append(answer)

    total_time = time.time() - start_time
    print(f"Legal assistant request processed {len(request.questions)} questions in {total_time:.2f}s")

    return SubmissionResponse(answers=answers)

