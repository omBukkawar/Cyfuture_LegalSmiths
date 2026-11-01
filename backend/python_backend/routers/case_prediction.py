import time
from fastapi import APIRouter
from schemas.case_schemas import CasePredictionRequest, CasePredictionResponse
from services.case_service import predict_case_outcome

router = APIRouter(tags=["Case Outcome Prediction"])

@router.post("/caseoutcomeprediction", response_model=CasePredictionResponse)
def case_outcome_prediction_endpoint(request: CasePredictionRequest):
    """Predicts case outcomes, likelihood of success, legal precedents, and court advisory."""
    start_time = time.time()
    answers = []

    for question in request.questions:
        prediction = predict_case_outcome(question)
        answers.append(prediction)

    total_time = time.time() - start_time
    print(f"Case prediction processed {len(request.questions)} cases in {total_time:.2f}s")

    return CasePredictionResponse(answers=answers)

