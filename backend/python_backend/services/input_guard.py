"""
LegalSmiths — Input Guard (Thin Facade)
=========================================
Delegates all input validation to the InputCriticAgent in services/agents/input_critic.py.

This module exists as a stable public API surface so routers and guardrail nodes
can import a simple guard_* function without caring about the agent internals.

Architecture:
  guard_*() → InputCriticAgent.check()
    → Layer 1: Structural regex (XSS, path traversal, flooding, size limit)
    → Layer 2: LLM Semantic Critic (off-topic, injection intent, illicit advice)
  Returns: (is_safe: bool, user_message: str)
"""

from typing import Tuple
from services.agents.input_critic import (
    legal_assistant_critic,
    contract_analyzer_critic,
    case_predictor_critic,
)


def guard_legal_assistant(question: str) -> Tuple[bool, str]:
    """
    Full guardrail for the Legal Assistant module.
    Returns (is_safe, user_facing_message). Empty message means safe.
    """
    decision = legal_assistant_critic.check(question)
    return decision.safe, decision.user_message


def guard_contract_analyzer(request_text: str) -> Tuple[bool, str]:
    """
    Full guardrail for the Contract Analyzer module.
    Returns (is_safe, user_facing_message). Empty message means safe.
    """
    decision = contract_analyzer_critic.check(request_text)
    return decision.safe, decision.user_message


def guard_case_predictor(case_facts: str) -> Tuple[bool, str]:
    """
    Full guardrail for the Case Outcome Predictor module.
    Returns (is_safe, user_facing_message). Empty message means safe.
    """
    decision = case_predictor_critic.check(case_facts)
    return decision.safe, decision.user_message
