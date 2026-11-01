from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

class Precedent(BaseModel):
    case: Optional[str] = ""
    citation: Optional[str] = ""
    explanation: Optional[str] = ""

class CaseAdvisory(BaseModel):
    title: Optional[str] = "Legal Case Analysis"
    petitioner: Optional[str] = "Not specified"
    respondent: Optional[str] = "Not specified"
    successProbability: Optional[str] = "N/A"
    likelyOutcome: Optional[str] = ""
    strongPoints: Optional[Union[List[str], str]] = []
    weakPoints: Optional[Union[List[str], str]] = []
    legalPrecedents: Optional[Union[List[Precedent], List[Dict[str, str]], List[str], str]] = []
    strategies: Optional[Union[List[str], str]] = []
    penalties: Optional[Union[List[str], str]] = []
    finalAdvisory: Optional[str] = ""

class CasePredictionRequest(BaseModel):
    questions: List[str] = Field(..., description="List of case fact statements to predict")

class CasePredictionResponse(BaseModel):
    answers: List[Dict[str, Any]] = Field(..., description="List of structured court advisory predictions")

