---
description: OpenAI API usage rules for PulseIQ analytics, insights, and sentiment
paths:
  - "backend/services/**"
  - "backend/integrations/**"
  - "backend/pipelines/**"
  - "ai/**"
---

OpenAI usage in PulseIQ:
- OpenAI is the primary AI provider for all analysis, prediction, and generation tasks.
- All OpenAI API access must go through a centralized client in backend/core/ or backend/integrations/openai/.
- Never call the OpenAI API directly from routes, repositories, or pipeline workers without going through a service layer.

Model usage guidelines:
- Sentiment analysis: GPT-4o or gpt-4o-mini (classify feedback as positive/neutral/negative with confidence score)
- Consumer behavior summarization: GPT-4o (summarize cohort/funnel patterns into actionable language)
- Trend prediction: GPT-4o (analyze aggregated sales and behavior signals to forecast trends)
- Marketing recommendations: GPT-4o (generate targeted, organization-specific marketing and sales recommendations)
- Embeddings: text-embedding-3-large (for semantic search over historical insights, feedback, and trends)

Prompt engineering rules:
- Store all prompts as versioned templates — never inline prompts directly in service code.
- Prompts must be parameterized (inject org context, data summaries, and constraints).
- System prompts must define clear scope and constraints to reduce hallucination risk.
- Include explicit instructions for output format (JSON where structured output is needed).
- Use OpenAI's structured output / JSON mode where the downstream consumer expects structured data.

Output handling rules:
- Always validate OpenAI output before storing or returning it.
- Handle refusals, empty outputs, and malformed JSON explicitly — never assume success.
- Parse and store structured outputs (sentiment score, trend signals, recommendation list) into Supabase.
- Log every OpenAI call with: model, prompt_tokens, completion_tokens, latency, org_id, and task_type.
- Cache AI-generated outputs in ElastiCache where appropriate to avoid redundant API calls.

Cost and rate limit management:
- Use ElastiCache to cache insights and avoid recomputing when source data has not changed.
- Prefer batch processing for bulk sentiment analysis over per-record calls.
- Set per-organization daily token budgets via config; emit warnings when nearing limits.
- Use gpt-4o-mini for high-volume, lower-complexity tasks (e.g. sentiment classification at scale).

Security rules:
- Never include raw PII in prompts — anonymize or pseudonymize customer data before sending to OpenAI.
- Store the OpenAI API key exclusively in environment variables / AWS Secrets Manager.
- Add prompt injection resistance: sanitize user-provided text before injecting into prompts.

Do not:
- Call OpenAI synchronously inside the ingestion pipeline's request-response path.
- Mix prompt template text deeply into service/business logic code.
- Ignore OpenAI errors or rate limit responses.
- Return raw, unvalidated model output directly to the frontend.
- Store OpenAI API keys anywhere other than secrets management.
