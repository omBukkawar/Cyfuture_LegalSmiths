from typing import Any
from config.settings import DEVICE

_embedding_model = None
_reranker_model = None


def get_embedding_model(model_name: str = "BAAI/bge-base-en-v1.5") -> Any:
    """Lazy-loaded HuggingFace embeddings on configured device."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            _embedding_model = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={"device": DEVICE},
            )
        except Exception as e:
            print(f"Notice: Could not load HuggingFaceEmbeddings ({e})")
            raise e
    return _embedding_model


def get_reranker_model(model_name: str = "BAAI/bge-reranker-base") -> Any:
    """Lazy-loaded CrossEncoder reranker model."""
    global _reranker_model
    if _reranker_model is None:
        try:
            from langchain_community.cross_encoders import HuggingFaceCrossEncoder
            _reranker_model = HuggingFaceCrossEncoder(
                model_name=model_name,
                model_kwargs={"device": DEVICE},
            )
        except Exception as e:
            print(f"Notice: Could not load HuggingFaceCrossEncoder ({e})")
            raise e
    return _reranker_model
