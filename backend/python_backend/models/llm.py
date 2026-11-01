import os
from typing import Any, Optional
from config.settings import (
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL_NAME,
    OPENROUTER_BASE_URL,
    LEGAL_ASSISTANT_MODELS,
    CONTRACT_ANALYZER_MODELS,
    CASE_PREDICTOR_MODELS,
)


class LLMResponse:
    """Standardized response container matching LangChain's response interface."""
    def __init__(self, content: str, model_used: str = ""):
        self.content = content
        self.model_used = model_used  # Actual model that handled the request

    def __str__(self) -> str:
        return self.content


class OpenRouterLLMWrapper:
    """
    OpenRouter LLM wrapper with priority fallback chain support.
    Tries models in order, skips any that return 404 (unavailable/deprecated),
    and logs which model was actually used.
    """
    def __init__(
        self,
        models: list,
        temperature: float = 0.0,
    ):
        # Accept either a single model string or a priority list
        if isinstance(models, str):
            self.models = [models]
        else:
            self.models = models
        self.temperature = temperature
        self._init_client()

    def _init_client(self):
        if not OPENROUTER_API_KEY:
            raise RuntimeError(
                "OPENROUTER_API_KEY is not set. Please add your key to backend/python_backend/.env"
            )
        from openai import OpenAI
        self.client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
        )

    def invoke(self, prompt: Any) -> LLMResponse:
        """
        Tries each model in priority order.
        On 404 (model deprecated/unavailable), moves to the next.
        Logs which model was actually used.
        """
        prompt_text = prompt.to_string() if hasattr(prompt, "to_string") else str(prompt)

        last_error = None
        for model in self.models:
            try:
                completion = self.client.chat.completions.create(
                    model=model,
                    temperature=self.temperature,
                    messages=[{"role": "user", "content": prompt_text}],
                )
                actual_model = getattr(completion, "model", model)
                content = completion.choices[0].message.content or ""
                print(f"[LLM] Model used: {actual_model}")
                return LLMResponse(content=content, model_used=actual_model)
            except Exception as e:
                err_str = str(e)
                # 404 = model deprecated/unavailable on free tier — try next
                if "404" in err_str or "unavailable" in err_str.lower():
                    print(f"[LLM] Model '{model}' unavailable (404), trying next in chain...")
                    last_error = e
                    continue
                # 402 = no credits — try next (free model may work)
                elif "402" in err_str:
                    print(f"[LLM] Model '{model}' requires credits (402), trying next in chain...")
                    last_error = e
                    continue
                # Any other error (network, server) — raise immediately
                else:
                    print(f"[LLM] Model '{model}' failed: {e}")
                    raise e

        # All models in chain exhausted
        print(f"[LLM] All models in fallback chain exhausted. Last error: {last_error}")
        raise last_error


# Cache keyed by (tuple(models), temperature)
_llm_cache: dict = {}


def get_llm(
    model: Optional[str] = None,
    models: Optional[list] = None,
    temperature: float = 0.0,
) -> OpenRouterLLMWrapper:
    """
    Returns a cached OpenRouterLLMWrapper.
    - Pass `models` (list) for a fallback chain.
    - Pass `model` (str) for a single model.
    - Pass neither to use the global default.
    """
    if models is not None:
        resolved = models
    elif model is not None:
        resolved = [model]
    else:
        resolved = [OPENROUTER_MODEL_NAME]

    cache_key = (tuple(resolved), temperature)
    if cache_key not in _llm_cache:
        _llm_cache[cache_key] = OpenRouterLLMWrapper(models=resolved, temperature=temperature)
    return _llm_cache[cache_key]


def get_legal_assistant_llm(temperature: float = 0.0) -> OpenRouterLLMWrapper:
    """Returns LLM configured with the Legal Assistant model priority chain."""
    return get_llm(models=LEGAL_ASSISTANT_MODELS, temperature=temperature)


def get_contract_analyzer_llm(temperature: float = 0.0) -> OpenRouterLLMWrapper:
    """Returns LLM configured with the Contract Analyzer model priority chain."""
    return get_llm(models=CONTRACT_ANALYZER_MODELS, temperature=temperature)


def get_case_predictor_llm(temperature: float = 0.0) -> OpenRouterLLMWrapper:
    """Returns LLM configured with the Case Predictor model priority chain."""
    return get_llm(models=CASE_PREDICTOR_MODELS, temperature=temperature)


def invoke_llm(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.0,
) -> str:
    """Direct helper to run a prompt via OpenRouter and return the string response."""
    llm = get_llm(model=model, temperature=temperature)
    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
    return llm.invoke(full_prompt).content
