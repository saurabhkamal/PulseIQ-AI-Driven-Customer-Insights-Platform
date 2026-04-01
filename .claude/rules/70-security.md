---
description: Security rules for PulseIQ — PII, GDPR, RBAC, audit logging
---

Security rules:
- Never hardcode secrets, API keys, tokens, credentials, or private URLs anywhere in code.
- Never log passwords, tokens, raw secrets, or sensitive user content.
- Validate and sanitize all user inputs at every system boundary.
- Treat uploads, URLs, user-submitted data, and external content as untrusted.
- Enforce authentication and authorization checks on all protected resources.
- Use least-privilege access patterns across the platform.
- Add rate limiting to all sensitive, expensive, or public-facing endpoints.
- Use secure defaults throughout.

PulseIQ-specific security:
- All data must be scoped to the user's organization (org_id) — enforce at the service and repository layers.
- Role-based access control must be enforced for all roles: Admin, Analyst, Marketer, Viewer.
  - Admin: full platform access
  - Analyst: dashboards, reports, insights — no user/settings management
  - Marketer: recommendations, export — no raw data or admin access
  - Viewer: read-only on assigned dashboards only
- Maintain immutable audit logs for all user actions and data mutations (GDPR compliance).
- Enforce JWT expiry and refresh token rotation.
- Support SSO (Google, Microsoft) via OAuth2; validate tokens server-side.
- API keys issued to organizations for REST API access must be hashed before storage.
- Support GDPR rights: data export per user/org, and data deletion (right to erasure) workflows.

AI-specific security:
- Anonymize or pseudonymize customer PII before sending data to OpenAI API.
- Add prompt injection resistance: sanitize all user-provided text before injecting into LLM prompts.
- Validate OpenAI tool inputs and outputs; never trust raw model output in critical paths.
- Protect system prompts and internal AI configuration from exposure.
- Handle unsafe or unexpected model output before returning it to the user.

Data security:
- Encrypt all data in transit (TLS/HTTPS) and at rest (Supabase encryption, AWS KMS for secrets).
- Do not store raw PII in logs — mask or hash where needed.
- Treat ingested customer data (sales, feedback, events) as sensitive; apply appropriate access controls.

AWS/infra security hygiene:
- Use AWS Secrets Manager for all secrets and API keys (OpenAI, Supabase connection strings, etc.).
- Avoid broad wildcard IAM permissions; use least-privilege policies.
- Do not expose internal services (ElastiCache, pipeline workers) publicly.
- Enable VPC isolation for backend and data services.
- Enable CloudTrail and CloudWatch for infrastructure-level audit logging.

Do not:
- Assume client-side validation is sufficient — always validate server-side.
- Return internal exception details or stack traces to API consumers.
- Trust LLM output without validation in any business-critical path.
- Allow cross-organization data access under any circumstances.
- Skip audit logging for any user-initiated write action.
