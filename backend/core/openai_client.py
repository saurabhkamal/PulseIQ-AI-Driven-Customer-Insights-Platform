"""
Centralized OpenAI client.
All OpenAI calls throughout the app must go through this module.
Never call OpenAI directly from routes, repositories, or pipeline workers.
"""
from functools import lru_cache
from openai import AsyncOpenAI
from .config import get_settings
from .logging import get_logger

logger = get_logger(__name__)


@lru_cache
def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    if not settings.openai_api_key:
        logger.warning("openai_api_key not set — AI features will fail at runtime")
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def chat_completion(
    messages: list[dict],
    model: str | None = None,
    response_format: dict | None = None,
    temperature: float = 0.2,
    org_id: str | None = None,
    task_type: str | None = None,
) -> str:
    """
    Call the OpenAI chat completion API.
    Logs every call with model, token counts, latency, org_id, and task_type.
    Returns the content string.
    """
    import time

    settings = get_settings()
    client = get_openai_client()
    model = model or settings.openai_model_default

    kwargs: dict = {"model": model, "messages": messages, "temperature": temperature}
    if response_format:
        kwargs["response_format"] = response_format

    start = time.monotonic()
    try:
        response = await client.chat.completions.create(**kwargs)
    except Exception as exc:
        logger.error(
            "openai_error",
            model=model,
            org_id=org_id,
            task_type=task_type,
            error=str(exc),
        )
        raise

    latency_ms = int((time.monotonic() - start) * 1000)
    usage = response.usage

    logger.info(
        "openai_call",
        model=model,
        prompt_tokens=usage.prompt_tokens if usage else None,
        completion_tokens=usage.completion_tokens if usage else None,
        latency_ms=latency_ms,
        org_id=org_id,
        task_type=task_type,
    )

    content = response.choices[0].message.content or ""
    return content


async def create_embedding(text: str, org_id: str | None = None) -> list[float]:
    """Generate a text-embedding-3-large embedding for the given text."""
    import time

    settings = get_settings()
    client = get_openai_client()
    start = time.monotonic()

    try:
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=text,
        )
    except Exception as exc:
        logger.error("openai_embedding_error", org_id=org_id, error=str(exc))
        raise

    latency_ms = int((time.monotonic() - start) * 1000)
    logger.info(
        "openai_embedding",
        model=settings.openai_embedding_model,
        latency_ms=latency_ms,
        org_id=org_id,
    )

    return response.data[0].embedding
