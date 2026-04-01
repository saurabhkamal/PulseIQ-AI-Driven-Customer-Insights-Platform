---
description: Agentic-AI rules for PulseIQ — behavior analysis, trend prediction, recommendations
paths:
  - "backend/agents/**"
  - "backend/services/**"
  - "ai/**"
  - "agents/**"
  - "workflows/**"
  - "orchestration/**"
---

Agentic-AI architecture for PulseIQ:
- PulseIQ uses agentic-AI workflows to autonomously analyze consumer behavior, detect trends, and generate marketing recommendations.
- Separate planner, executor, tools, memory, state, and evaluation logic.
- Each agent is role-specific and scoped to its domain.
- Tool calls must be explicit, validated, and logged.

Core agent types:
- BehaviorAnalysisAgent — analyzes consumer event streams; produces funnel metrics, cohort summaries, and heatmap signals
- TrendPredictionAgent — analyzes sales and behavior data aggregates; forecasts emerging product and market trends
- SentimentAgent — processes customer feedback and reviews; produces sentiment labels and scores
- RecommendationAgent — synthesizes analysis outputs into prioritized marketing and sales recommendations

Agent rules:
- Use OpenAI API (GPT-4o) for reasoning, synthesis, and natural language generation within each agent.
- Agents must not directly access databases or external APIs — all data access goes through a tool layer.
- Prompts must be templated and stored separately from orchestration logic.
- Keep critical business workflows deterministic where possible.
- Add output validation and fallback behavior for every agent.
- Use structured schemas (Pydantic models) for agent outputs in all production paths.
- Prefer supervisor/orchestrator logic for coordinating multi-agent workflows (e.g. full insights generation pipeline).

Tooling rules:
- Every tool must have:
  - A clear, single purpose
  - Input schema (Pydantic model)
  - Output schema (Pydantic model)
  - Explicit failure/error behavior
- Tools should be side-effect aware and logged.
- Data-reading tools must enforce org_id scoping — no cross-tenant data access.
- Write-side tools must validate authorization before execution.

Agent orchestration rules:
- An orchestrator/supervisor routes tasks to the appropriate agent based on context and trigger type.
- Triggers: new data ingestion completed, scheduled periodic analysis, user-requested insight refresh.
- Agent outputs must be persisted to Supabase (insights, trend_predictions, sentiment_results tables).
- Emit structured status events so the frontend can reflect insight generation progress.

Memory/state rules:
- Short-term state (current run context) lives in ElastiCache with a TTL.
- Long-term memory (historical trends, past recommendation effectiveness) lives in Supabase.
- Track provenance: each generated insight must link to the source data, agent, model, and timestamp.

Do not:
- Let agents perform unrestricted actions against the database or external systems.
- Hide tool errors or swallow agent exceptions.
- Mix prompt text deeply into service/business code.
- Run agents synchronously inside API request handlers — use async workers/tasks.
- Generate recommendations without tracing them back to source data.
