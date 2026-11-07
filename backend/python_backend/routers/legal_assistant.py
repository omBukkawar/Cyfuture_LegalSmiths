import time
import concurrent.futures
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from schemas.assistant_schemas import SubmissionRequest, SubmissionResponse
from services.legal_assistant import run_legal_assistant_pipeline
from services.input_guard import guard_legal_assistant
from services.agents.output_critic import legal_assistant_output_critic
from main import limiter

router = APIRouter(tags=["Legal Assistant"])

PIPELINE_TIMEOUT_SECS = int(__import__("os").getenv("LEGAL_ASSISTANT_TIMEOUT", "90"))

@router.post("/legalassistant", response_model=SubmissionResponse)
@limiter.limit("20/minute")
def legal_assistant_endpoint(request: SubmissionRequest, req: Request):
    """Answers legal questions using the 4-Node Agentic Pipeline."""
    start_time = time.time()
    answers = []

    for question in request.questions:
        is_safe, guard_message = guard_legal_assistant(question)
        if not is_safe:
            answers.append(guard_message)
            continue

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_legal_assistant_pipeline, question)
                answer = future.result(timeout=PIPELINE_TIMEOUT_SECS)
        except concurrent.futures.TimeoutError:
            print(f"[Legal Assistant] Pipeline timeout after {PIPELINE_TIMEOUT_SECS}s")
            answers.append("The legal research pipeline timed out. Please try a more specific question or try again shortly.")
            continue

        decision = legal_assistant_output_critic.review(answer)
        answers.append(decision.fallback_message if not decision.valid else answer)

    print(f"Legal assistant processed {len(request.questions)} question(s) in {time.time()-start_time:.2f}s")
    return SubmissionResponse(answers=answers)

