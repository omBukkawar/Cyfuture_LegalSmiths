import time
import traceback
import concurrent.futures
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from schemas.case_schemas import CasePredictionRequest, CasePredictionResponse
from services.case_service import predict_case_outcome
from services.input_guard import guard_case_predictor
from services.agents.output_critic import case_predictor_output_critic
from limiter import limiter

router = APIRouter(tags=["Case Outcome Prediction"])

PIPELINE_TIMEOUT_SECS = int(__import__("os").getenv("CASE_PREDICTOR_TIMEOUT", "180"))


@router.post("/caseoutcomeprediction", response_model=CasePredictionResponse)
@limiter.limit("10/minute")
def case_outcome_prediction_endpoint(request: CasePredictionRequest, req: Request):
    """
    Runs the LangGraph adversarial legal analysis pipeline for each case.
    Protected by multi-layer guardrails: prompt injection, XSS, SQL injection,
    off-topic detection, flooding, and illicit advice solicitation.

    Pipeline stages:
      1. Legal research (Serper web search + official-domain Indian law page fetch)
      2. Claimant Counsel Brief (statutes, concrete facts, Indian precedents)
      3. Defence Counsel Written Statement (defences, limits, factual distinctions)
      4. Statutory citation audit
      5. Judicial Bench Evaluation — structured comparative ruling JSON
    """
    start_time = time.time()
    answers = []

    for question in request.questions:
        # --- Guardrail: Validate each case fact statement ---
        is_safe, guard_message = guard_case_predictor(question)
        if not is_safe:
            print(f"[Guardrail] Case Predictor: blocked input (len={len(question)})")
            answers.append({
                "error": True,
                "blocked": True,
                "verdict_summary": guard_message,
                "comparative_verdict": "BLOCKED",
                "winning_side": "none",
                "confidence_score": 0,
                "disclaimer": guard_message,
            })
            continue

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    predict_case_outcome,
                    question,
                    request.case_type or "unspecified",
                    request.jurisdiction or "India",
                    request.incident_date or "",
                )
                prediction = future.result(timeout=PIPELINE_TIMEOUT_SECS)

            # --- Output critic ---
            decision = case_predictor_output_critic.review(prediction)
            if not decision.valid:
                answers.append({
                    "error": True,
                    "verdict_summary": decision.fallback_message,
                    "comparative_verdict": "ANALYSIS_FAILED",
                    "winning_side": "none",
                    "confidence_score": 0,
                    "disclaimer": decision.fallback_message,
                })
            else:
                answers.append(prediction)
        except concurrent.futures.TimeoutError:
            print(f"[Case Prediction] Pipeline timeout after {PIPELINE_TIMEOUT_SECS}s")
            answers.append({
                "error": True,
                "verdict_summary": "The case analysis pipeline timed out. Please try again shortly.",
                "comparative_verdict": "TIMEOUT",
                "winning_side": "none",
                "confidence_score": 0,
                "disclaimer": "Analysis timed out.",
            })
            continue
        except Exception as exc:
            total_time = time.time() - start_time
            print(f"[Case Prediction] ❌ Unhandled error after {total_time:.2f}s: {exc}")
            traceback.print_exc()
            return JSONResponse(
                status_code=500,
                content={"message": f"Pipeline failed: {type(exc).__name__}: {exc}"},
            )

    total_time = time.time() - start_time
    print(f"[Case Prediction] ✅ Processed {len(request.questions)} case(s) in {total_time:.2f}s")

    return CasePredictionResponse(answers=answers)
