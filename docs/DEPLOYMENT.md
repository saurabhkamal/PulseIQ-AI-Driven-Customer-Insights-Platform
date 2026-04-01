# PulseIQ — Deployment Guide

**Cloud Provider:** AWS  
**Containerization:** Docker  
**Orchestration:** ECS Fargate (Kubernetes-ready via EKS)  
**Environments:** `dev` / `staging` / `prod`

---

## Infrastructure Overview

```
┌────────────────────────────────────────────────────────────┐
│                        AWS Account                          │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                     VPC                              │  │
│  │                                                      │  │
│  │  ┌─────────────────┐    ┌──────────────────────┐    │  │
│  │  │  Public Subnets  │    │   Private Subnets    │    │  │
│  │  │                 │    │                      │    │  │
│  │  │  ┌───────────┐  │    │  ┌────────────────┐  │    │  │
│  │  │  │    ALB    │  │    │  │  ECS Fargate   │  │    │  │
│  │  │  │(HTTPS 443)│  │    │  │  - Backend API │  │    │  │
│  │  │  └─────┬─────┘  │    │  │  - Frontend    │  │    │  │
│  │  └────────│─────────┘   │  │  - Workers     │  │    │  │
│  │           │             │  └────────┬───────┘  │    │  │
│  │           └─────────────┼───────────┘          │    │  │
│  │                         │  ┌────────────────┐  │    │  │
│  │                         │  │ AWS ElastiCache│  │    │  │
│  │                         │  │ (Redis)        │  │    │  │
│  │                         │  └────────────────┘  │    │  │
│  │                         └──────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  AWS ECR  │  │  Secrets     │  │  CloudWatch          │  │
│  │(Registry) │  │  Manager     │  │  (Logs + Metrics)    │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────┘

External (managed):
  ┌────────────────┐    ┌──────────────┐
  │   Supabase     │    │  OpenAI API  │
  │ (PostgreSQL)   │    │              │
  └────────────────┘    └──────────────┘
```

---

## AWS Services Used

| Service | Purpose |
|---|---|
| ECS Fargate | Container orchestration for backend, frontend, pipeline workers |
| Application Load Balancer (ALB) | HTTPS routing to ECS services |
| AWS ElastiCache | Redis-compatible caching and coordination |
| AWS ECR | Docker container image registry |
| AWS Secrets Manager | Secrets and API key storage |
| AWS CloudWatch | Logs, metrics, alarms, dashboards |
| AWS VPC | Network isolation (public + private subnets) |
| AWS IAM | Least-privilege roles per service |
| AWS S3 | Export file storage, static asset hosting (optional) |
| AWS CloudFront | CDN for frontend static assets (optional) |
| AWS Route 53 | DNS management |
| AWS ACM | TLS/SSL certificate management |

---

## ECS Services (Web)

### 1. `pulseiq-backend`
- **Image:** `{ECR_REPO}/pulseiq-backend:{tag}`
- **CPU:** 1024 (1 vCPU), **Memory:** 2048 MB (scalable to 4096)
- **Port:** 8000
- **Health check:** `GET /api/v1/health` — 200 OK
- **Auto-scaling:** Target tracking on CPU > 70% (min 2, max 10 tasks)
- **Environment variables (from Secrets Manager):**
  - `DATABASE_URL` — Supabase connection string
  - `OPENAI_API_KEY`
  - `JWT_SECRET`
  - `ELASTICACHE_URL`
  - `ENVIRONMENT` — dev / staging / prod

### 2. `pulseiq-admin`
- **Image:** `{ECR_REPO}/pulseiq-admin:{tag}`
- **CPU:** 512, **Memory:** 1024 MB
- **Port:** 3001
- **Domain:** `admin.pulseiq.io`
- **Health check:** `GET /` — 200 OK
- **Environment variables:**
  - `NEXT_PUBLIC_API_URL` — ALB backend URL
  - `NEXT_PUBLIC_ENV` — dev / staging / prod

### 3. `pulseiq-frontend`
- **Image:** `{ECR_REPO}/pulseiq-frontend:{tag}`
- **CPU:** 512, **Memory:** 1024 MB
- **Port:** 3000
- **Domain:** `app.pulseiq.io`
- **Health check:** `GET /` — 200 OK
- **Environment variables:**
  - `NEXT_PUBLIC_API_URL` — ALB backend URL
  - `NEXT_PUBLIC_ENV` — dev / staging / prod

### 4. `pulseiq-worker`
- **Image:** `{ECR_REPO}/pulseiq-worker:{tag}`
- **CPU:** 2048 (2 vCPU), **Memory:** 4096 MB
- **No public port** — private subnet only
- **Auto-scaling:** Queue depth or schedule-based
- **Environment variables:** Same as backend + worker-specific config

---

## Mobile Web Deployment

The PulseIQ mobile web app is a **Next.js 16+ PWA** deployed the same way as the other web frontends — via Docker + ECS Fargate or S3 + CloudFront. No app stores or native build tools required.

### ECS Service: `pulseiq-mobile`
- **Image:** `{ECR_REPO}/pulseiq-mobile:{tag}`
- **CPU:** 512, **Memory:** 1024 MB
- **Port:** 3002
- **Domain:** `m.pulseiq.io`
- **Health check:** `GET /` — 200 OK
- **Environment variables:**
  - `NEXT_PUBLIC_API_URL` — ALB backend URL
  - `NEXT_PUBLIC_ENV` — dev / staging / prod
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — Web Push VAPID public key (non-secret)

### Mobile Web Dockerfile
Same multi-stage Next.js Dockerfile pattern as Admin Panel and User Interface.

### Web Push (PWA Notifications)
- VAPID key pair generated once and stored in AWS Secrets Manager
- Public VAPID key injected as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var (safe to expose)
- Private VAPID key stored at `pulseiq/{env}/vapid-private-key` in Secrets Manager
- Backend uses private VAPID key to sign and send Web Push notifications

### Mobile Web Secrets
| Secret | Storage |
|---|---|
| `pulseiq/{env}/vapid-private-key` | AWS Secrets Manager |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Environment variable (non-secret) |

---

## Docker

### Backend Dockerfile (multi-stage)
```dockerfile
# Stage 1: Build
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (multi-stage)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Rules:
- Never bake secrets or `.env` files into images
- Pin base image versions (e.g. `python:3.11-slim`, `node:20-alpine`)
- Use multi-stage builds to minimize image size
- Push all images to ECR; tag with git SHA and `latest`

---

## Secrets Management

All secrets stored in **AWS Secrets Manager** — never in environment files committed to version control.

| Secret Name | Contents |
|---|---|
| `pulseiq/{env}/database-url` | Supabase PostgreSQL connection string |
| `pulseiq/{env}/openai-api-key` | OpenAI API key |
| `pulseiq/{env}/jwt-secret` | JWT signing secret |
| `pulseiq/{env}/elasticache-url` | ElastiCache connection URL |
| `pulseiq/{env}/supabase-anon-key` | Supabase anon key |
| `pulseiq/{env}/supabase-service-key` | Supabase service role key |

ECS task definitions reference secrets via `secretsManager` ARN — injected as environment variables at runtime.

---

## CI/CD Pipeline (GitHub Actions)

```
Push to branch
    │
    ▼
[CI] Lint + Type-check + Tests
    │
    ├── Fail → Block merge
    └── Pass
          │
          ▼
    [CI] Build Docker images
          │
          ▼
    [CI] Push to ECR ({git_sha} tag)
          │
          ▼
    Merge to main
          │
          ├── Auto-deploy → Staging (ECS rolling update)
          │
          └── Manual approval → Production (ECS blue/green deploy)
```

### Workflow files:
- `.github/workflows/ci.yml` — lint, type-check, test on every PR
- `.github/workflows/deploy-staging.yml` — build + push + deploy on merge to main
- `.github/workflows/deploy-prod.yml` — manual trigger for production deploy

---

## Environment Configuration

| Variable | Dev | Staging | Prod |
|---|---|---|---|
| `ENVIRONMENT` | dev | staging | prod |
| `LOG_LEVEL` | DEBUG | INFO | WARNING |
| `CORS_ORIGINS` | * | staging domain | prod domain |
| `RATE_LIMIT_ENABLED` | false | true | true |
| ECS task count (backend) | 1 | 2 | 2–10 (autoscaled) |
| ElastiCache node type | cache.t3.micro | cache.t3.small | cache.r6g.large |

---

## Networking & Security

- **VPC:** Custom VPC with public and private subnets across 2+ AZs
- **ALB:** Public-facing HTTPS (port 443), terminates TLS via ACM certificate
- **ECS tasks:** Run in private subnets; only ALB can reach them via security groups
- **ElastiCache:** Private subnet only; accessible from ECS security groups only
- **Supabase:** External managed service; backend connects via SSL
- **IAM:** Each ECS task has a dedicated task role with minimal permissions
- **Security groups:** Principle of least privilege — only required port/service combinations allowed

---

## Observability

### Logging
- All services emit structured JSON logs to **CloudWatch Logs**
- Log groups: `/pulseiq/{env}/backend`, `/pulseiq/{env}/frontend`, `/pulseiq/{env}/worker`
- Log retention: 30 days (dev), 90 days (staging), 1 year (prod)
- Every log entry includes: `service`, `environment`, `request_id`, `org_id` (where applicable), `level`, `message`

### Metrics & Alarms
| Alarm | Threshold | Action |
|---|---|---|
| Backend CPU > 80% | 5 min sustained | Scale out + notify |
| Backend 5xx error rate > 1% | 1 min | PagerDuty alert |
| Worker queue depth > 1000 | 5 min | Scale out workers |
| ElastiCache memory > 80% | 5 min | Notify |
| ALB latency p99 > 2s | 5 min | Notify |

---

## Rollback Strategy

- **ECS rolling update:** Previous task definition kept active; ALB drains before replacing
- **Blue/green (prod):** Two target groups; traffic shifted after health check passes; instant rollback by shifting back
- **Database:** Supabase migrations are forward-only; keep rollback SQL scripts for manual use if needed
- **Secrets:** Previous secret versions retained in Secrets Manager for 7 days

---

## Environments Summary

| | Dev | Staging | Prod |
|---|---|---|---|
| Branch | feature/* | main | main (manual) |
| Admin Panel domain | admin.dev.pulseiq.io | admin.staging.pulseiq.io | admin.pulseiq.io |
| Web App domain | dev.pulseiq.io | staging.pulseiq.io | app.pulseiq.io |
| API domain | api.dev.pulseiq.io | api.staging.pulseiq.io | api.pulseiq.io |
| ECS cluster | pulseiq-dev | pulseiq-staging | pulseiq-prod |
| Supabase project | pulseiq-dev | pulseiq-staging | pulseiq-prod |
| ElastiCache | t3.micro | t3.small | r6g.large |
| CloudWatch | DEBUG logs | INFO logs | WARNING logs |
| Mobile Web domain | m.dev.pulseiq.io | m.staging.pulseiq.io | m.pulseiq.io |
| Mobile Web ECS service | pulseiq-mobile-dev | pulseiq-mobile-staging | pulseiq-mobile-prod |
