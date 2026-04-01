---
description: Docker, CI/CD, and AWS deployment for PulseIQ
paths:
  - "infra/**"
  - "docker/**"
  - ".github/**"
  - "deployment/**"
  - "terraform/**"
  - "ecs/**"
  - "aws/**"
---

Deployment stack:
- Docker for packaging all services (backend, frontend, pipeline workers)
- AWS for hosting: ECS (Fargate) or EKS (Kubernetes-ready)
- AWS ElastiCache (Redis-compatible) for caching and coordination
- Supabase (hosted) for database and auth — no self-managed PostgreSQL
- AWS Secrets Manager for all secrets and API keys
- AWS CloudFront + S3 for static frontend assets (optional)
- AWS CloudWatch for logs, metrics, and alarms
- CI/CD for validation, testing, and automated release
- Separate environments: dev / staging / prod

DevOps rules:
- All services must be containerized and container-friendly.
- Keep builds reproducible and deterministic.
- Use environment-driven configuration — no hardcoded environment values.
- Separate build-time config from runtime config.
- Add health check endpoints to all backend services (/health or /api/v1/health).
- Keep services stateless unless statefulness is intentional and documented.
- Ensure all logs are structured (JSON), include service name, environment, request_id, org_id where applicable.

Docker expectations:
- Keep Dockerfiles clean and optimized.
- Use multi-stage builds for backend (build → runtime) and frontend (build → nginx/static).
- Never bake secrets, credentials, or API keys into Docker images.
- Minimize image size: use slim/alpine base images where practical.
- Pin base image versions for reproducibility.

AWS expectations:
- Use ECS Fargate for containerized backend and pipeline worker services.
- Use EKS if Kubernetes orchestration is required for advanced scaling.
- Use AWS ElastiCache (Redis mode) for caching — do not self-host Redis.
- Use AWS ALB (Application Load Balancer) for routing to ECS services.
- Use least-privilege IAM roles per service — no wildcard * permissions.
- Use VPC with private subnets for backend, ElastiCache, and pipeline workers.
- Expose only ALB and CloudFront endpoints publicly.
- Use AWS Secrets Manager for: OpenAI API key, Supabase connection string, JWT secrets, and all other credentials.
- Support observability via CloudWatch logs, metrics, and alarms (CPU, memory, API error rates, pipeline lag).
- Design for rollback-safe deployments (blue/green or rolling updates on ECS/EKS).
- Use AWS ECR for container image registry.

CI/CD expectations:
- Run lint, type-check, tests, and build validation before merge/deploy.
- Build and push Docker images to ECR on merge to main.
- Deploy to staging automatically; require manual approval for production.
- Keep all deployment configuration (task definitions, Kubernetes manifests, Terraform) version-controlled.
- Environment-specific config injected via environment variables and Secrets Manager — never in code.

Do not:
- Hardcode AWS account IDs, ARNs, region strings, or secrets in application code.
- Mix deployment-only hacks into application logic.
- Assume local-only paths or config in production code.
- Use root AWS credentials anywhere.
- Store secrets in environment files committed to version control.
