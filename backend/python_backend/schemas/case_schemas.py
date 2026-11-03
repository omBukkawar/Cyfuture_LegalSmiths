from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class CasePredictionRequest(BaseModel):
    questions: List[str] = Field(..., description="List of case fact statements to analyze")
    case_type: Optional[str] = Field("unspecified", description="Type of legal case (e.g., criminal, civil, consumer)")
    jurisdiction: Optional[str] = Field("India", description="Jurisdiction (e.g., Delhi High Court, Supreme Court)")
    incident_date: Optional[str] = Field("", description="Incident or relevant date for the case")


# ---------------------------------------------------------------------------
# Response — mirrors the LangGraph judge JSON schema
# ---------------------------------------------------------------------------

class ScoreCard(BaseModel):
    legal_rule_application: Optional[int] = 0
    evidence_fit: Optional[int] = 0
    reasoning: Optional[int] = 0
    rebuttal_tactics: Optional[int] = 0
    authority_quality: Optional[int] = 0
    score_rationale: Optional[str] = ""


class SideBySideScorecard(BaseModel):
    claimant: Optional[ScoreCard] = None
    defence: Optional[ScoreCard] = None


class CaseTheory(BaseModel):
    claimant_theory: Optional[str] = ""
    defence_theory: Optional[str] = ""
    central_dispute: Optional[str] = ""


class WinningPoint(BaseModel):
    point: Optional[str] = ""
    legal_rule_or_element: Optional[str] = ""
    fact_and_evidence_link: Optional[str] = ""
    why_it_is_persuasive: Optional[str] = ""
    opponent_counterattack: Optional[str] = ""
    best_tactical_response: Optional[str] = ""
    support_status: Optional[str] = ""


class WeakPoint(BaseModel):
    weakness: Optional[str] = ""
    why_it_matters: Optional[str] = ""
    how_defence_can_exploit_it: Optional[str] = ""
    how_claimant_can_exploit_it: Optional[str] = ""
    repair_strategy: Optional[str] = ""


class SideAnalysis(BaseModel):
    position_actually_taken: Optional[str] = ""
    winning_points: Optional[List[Dict[str, Any]]] = []
    weak_points_and_exposure: Optional[List[Dict[str, Any]]] = []


class PointClash(BaseModel):
    issue: Optional[str] = ""
    claimant_position: Optional[str] = ""
    defence_position: Optional[str] = ""
    stronger_on_this_point: Optional[str] = ""
    reason: Optional[str] = ""
    evidence_that_would_resolve_it: Optional[str] = ""


class PrecedentEntry(BaseModel):
    authority_name_and_citation: Optional[str] = ""
    legal_proposition: Optional[str] = ""
    material_facts_and_holding: Optional[str] = ""
    analogy_or_distinction_for_claimant: Optional[str] = ""
    analogy_or_distinction_for_defence: Optional[str] = ""
    source_url: Optional[str] = ""
    verification_status: Optional[str] = ""
    research_action: Optional[str] = ""


class NextStep(BaseModel):
    priority: Optional[str] = ""
    action: Optional[str] = ""
    which_side_it_helps: Optional[str] = ""
    why_it_matters: Optional[str] = ""
    evidence_or_document_to_obtain: Optional[str] = ""


class RealWorldAssessment(BaseModel):
    status: Optional[str] = "INSUFFICIENT_EVIDENCE"
    assessment: Optional[str] = ""
    key_uncertainties: Optional[List[str]] = []
    do_not_treat_as_calibrated_probability: Optional[bool] = True


class AdversarialQuality(BaseModel):
    claimant_argued_assigned_side: Optional[bool] = True
    defence_argued_assigned_side: Optional[bool] = True
    adversarial_failure: Optional[bool] = False
    explanation: Optional[str] = ""


class DebateVerdict(BaseModel):
    """Full structured output from the LangGraph adversarial debate pipeline."""
    schema_version: Optional[str] = "1.0"
    comparative_verdict: Optional[str] = "INSUFFICIENT_ARGUMENTS"
    winning_side: Optional[str] = "none"
    verdict_summary: Optional[str] = ""
    confidence_score: Optional[int] = 0
    confidence_basis: Optional[str] = ""
    case_theory: Optional[Dict[str, Any]] = {}
    side_by_side_scorecard: Optional[Dict[str, Any]] = {}
    claimant_analysis: Optional[Dict[str, Any]] = {}
    defence_analysis: Optional[Dict[str, Any]] = {}
    point_by_point_clashes: Optional[List[Dict[str, Any]]] = []
    precedent_and_authority_analysis: Optional[List[Dict[str, Any]]] = []
    tactical_next_steps_for_lawyer: Optional[List[Dict[str, Any]]] = []
    overall_comparative_reasoning: Optional[str] = ""
    real_world_case_assessment: Optional[Dict[str, Any]] = {}
    adversarial_quality: Optional[Dict[str, Any]] = {}
    source_verification_warnings: Optional[List[str]] = []
    disclaimer: Optional[str] = ""


class CasePredictionResponse(BaseModel):
    answers: List[Dict[str, Any]] = Field(..., description="List of structured debate verdict predictions")
