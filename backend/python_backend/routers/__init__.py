from .legal_assistant import router as assistant_router
from .contract_analyzer import router as contract_router
from .case_prediction import router as case_router

__all__ = [
    "assistant_router",
    "contract_router",
    "case_router",
]

