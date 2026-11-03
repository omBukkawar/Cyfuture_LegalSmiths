import time
import traceback
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from schemas.case_schemas import CasePredictionRequest, CasePredictionResponse
from services.case_service import predict_case_outcome

router = APIRouter(tags=["Case Outcome Prediction"])


@router.post("/caseoutcomeprediction", response_model=CasePredictionResponse)
def case_outcome_prediction_endpoint(request: CasePredictionRequest):
    """
    Runs the streamlined professional legal analysis pipeline for each case in the request.

    Pipeline stages:
      1. Legal research (Serper web search + official-domain Indian law page fetch)
      2. Claimant Counsel Brief (statutes, concrete facts, Indian precedents)
      3. Defence Counsel Written Statement (defences, limits, factual distinctions)
      4. Statutory citation audit
      5. Judicial Bench Evaluation — structured comparative ruling JSON
    """
    start_time = time.time()
    answers = []

    try:
        for question in request.questions:
            prediction = predict_case_outcome(
                case_facts=question,
                case_type=request.case_type or "unspecified",
                jurisdiction=request.jurisdiction or "India",
                incident_date=request.incident_date or "",
            )
            answers.append(prediction)
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
