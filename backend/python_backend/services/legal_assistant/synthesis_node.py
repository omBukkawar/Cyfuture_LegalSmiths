try:
    from langchain.prompts import PromptTemplate
except ImportError:
    class PromptTemplate:
        @classmethod
        def from_template(cls, template: str):
            class _Template:
                def __init__(self, t): self.t = t
                def format(self, **kwargs): return self.t.format(**kwargs)
            return _Template(template)

from services.legal_assistant.state import LegalAssistantState
from models.llm import get_legal_assistant_llm
from config.settings import LEGAL_ASSISTANT_MODELS


SYNTHESIS_PROMPT = """You are an Expert Indian Legal Assistant and Legal Counsel.
Your objective is to provide an accurate, accessible, and legally sound answer to the citizen's legal inquiry under Indian law.

Rules:
1. Direct Plain-Language Answer: Begin with 1–2 simple sentences explaining the legal position in everyday terms that anyone can understand without legalese.
2. Statutory Explanation: Follow with a concise explanation (max 3–5 sentences) detailing rights, conditions, police powers, or court procedures.
3. Modern & Applicable Law: Reference the current legal framework including the Bharatiya Nyaya Sanhita (BNS, 2023), Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023), and classic statutes (IPC, CrPC, Indian Contract Act, Constitution of India) where relevant.
4. Mandatory Citation: Always end the answer with the specific Act, Section, or landmark Indian Supreme Court/High Court judgment in brackets, e.g.:
   [Bharatiya Nagarik Suraksha Sanhita, 2023, Section 35 / Code of Criminal Procedure, Section 41]
5. Context Guidelines:
   - If verified search context is provided below, use it to ensure citations and recent amendments are 100% accurate.
   - If no search context is provided or marked invalid, rely directly on your authoritative legal training in Indian law.

Verified Indian Legal Context:
{context}

Citizen's Question:
{question}

Answer:"""


def synthesis_node(state: LegalAssistantState) -> LegalAssistantState:
    """
    Node 4: Context Injection & Legal Synthesis.
    Injects validated search context (or triggers statutory fallback)
    and invokes OpenRouter LLM to synthesize the final legal advice.
    """
    if not state.get("is_safe", True):
        # Already handled by Node 1 guardrail
        return state

    question = state.get("question", "")
    is_search_valid = state.get("is_search_valid", False)
    curated_context = state.get("curated_context", "")

    context_str = (
        curated_context
        if is_search_valid and curated_context
        else "No external search context approved. Rely strictly on verified Indian statutory provisions and judicial precedents."
    )

    prompt = PromptTemplate.from_template(SYNTHESIS_PROMPT).format(
        context=context_str,
        question=question,
    )

    try:
        llm = get_legal_assistant_llm()
        response = llm.invoke(prompt)
        state["final_answer"] = response.content.strip()
        print(f"[Synthesis Node] Legal response generated via: {response.model_used}")
    except Exception as e:
        print(f"Synthesis Node Error: {e}")
        state["final_answer"] = (
            "Under Indian law, your matter involves statutory provisions that require specific legal evaluation. "
            "Please consult a certified advocate for formal legal representation in your jurisdiction."
        )

    return state
