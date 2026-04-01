---
description: RAG rules for AI Customer Support Copilot—OpenAI embeddings, knowledge base
globs: ai/**, rag/**, retrieval/**, embeddings/**, vector/**, ingestion/**, knowledge/**
---

RAG architecture:
- Separate ingestion, parsing, chunking, embedding, indexing, retrieval, reranking, context assembly, and answer generation.
- Keep retrieval logic independent from answer generation logic.
- Preserve source metadata for traceability.

RAG rules:
- Use OpenAI embeddings (e.g. text-embedding-3-small/large) for vector search.
- Support knowledge base sources: help articles, product docs, FAQ, past tickets, internal wiki.
- Never dump raw full documents into prompts when chunking is expected.
- Use deterministic chunking strategies unless explicitly experimenting.
- Maintain chunk metadata such as source, page, section, title, tenant, and timestamps where relevant.
- Prefer source attribution/citations in outputs when the product requires trust and traceability.
- Add configurable retrieval parameters such as top_k, filters, score thresholds, and reranking options.

Ingestion expectations:
- Support clean document ingestion pipelines.
- Normalize and sanitize extracted text.
- Preserve source identity and version if relevant.
- Re-embed only when necessary.

Answering expectations:
- Ground answers in retrieved context.
- Handle no-context and low-confidence cases gracefully.
- Avoid hallucinating unavailable facts.
- Return structured outputs where the product requires it.

Do not:
- Mix ingestion code with runtime answer generation in the same module.
- Make retrieval behavior impossible to inspect or tune.
- Hide retrieval failures silently.