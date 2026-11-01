from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

class ContractAnalysis(BaseModel):
    title: Optional[str] = "Contract Analysis"
    parties: Optional[str] = "Not specified"
    dates: Optional[str] = "Not specified"
    payment_terms: Optional[str] = "Not specified"
    obligations: Optional[str] = "Not specified"
    termination: Optional[str] = "Not specified"
    mistakes_ambiguities: Optional[str] = "None identified"
    red_flags: Optional[Union[List[str], str]] = []
    plain_summary: Optional[str] = ""
    risk_level: Optional[str] = "Unknown"
    recommendations: Optional[str] = ""
    raw_response: Optional[str] = None

class ContractSubmissionResponse(BaseModel):
    answers: List[Dict[str, Any]] = Field(..., description="List of structured contract analysis reports")

