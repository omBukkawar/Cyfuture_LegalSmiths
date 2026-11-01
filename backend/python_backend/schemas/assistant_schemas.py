from pydantic import BaseModel, Field
from typing import List

class SubmissionRequest(BaseModel):
    questions: List[str] = Field(..., description="List of legal questions to answer")

class SubmissionResponse(BaseModel):
    answers: List[str] = Field(..., description="List of generated plain-language legal answers")

