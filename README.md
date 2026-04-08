# calebpirkle.com

My online portfolio. Deployed on AWS with infrastructure provisioned by the AWS CDK.

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Frontend           | HTML, CSS, JavaScript                           |
| Web Server         | Caddy 2 (Alpine)                                |
| Container          | Docker                                          |
| Container Registry | AWS ECR                                         |
| Compute            | AWS EC2 (t4g.nano, ARM64 Graviton)              |
| DNS                | AWS Route 53                                    |
| CI/CD              | AWS CodePipeline + CodeBuild                    |
| IaC                | AWS CDK v2 (TypeScript)                         |

## Project Structure

```
.
├── site/                # Static site files (HTML, CSS, JS, favicon)
├── infra/               # CDK infrastructure (TypeScript)
│   ├── bin/             # CDK app entry point
│   └── lib/             # Stack definitions
├── scripts/             # Deployment scripts (runs on EC2)
├── Dockerfile           # Caddy-based container image
├── Caddyfile            # Web server config, security headers, TLS
└── buildspec.yml        # CodeBuild build specification
```

## The Site

A single-page portfolio with a dark terminal aesthetic — monospace fonts, CRT scanline overlay, and a red/green-on-black color scheme. Sections include bio, skills, featured projects, and contact info.

No frameworks. No bundlers. Just semantic HTML, CSS variables and animations, and a small vanilla JS file for scroll-based reveal animations and active nav highlighting via Intersection Observer.

## Infrastructure

Two CDK stacks split by change frequency and blast radius:

- **RuntimeStack** — VPC, EC2 instance, Route 53 DNS, ECR repository, S3 artifact bucket. Long-lived, rarely changed.
- **PipelineStack** — CodePipeline with GitHub source (CodeConnections), CodeBuild for Docker image builds, and SSM Run Command for deploys to EC2. Safe to iterate on.

See [infra/README.md](infra/README.md) for full infrastructure details.

## Deployment Flow

```
git push to master
    → CodePipeline triggered via GitHub CodeConnections
    → CodeBuild: docker build & push to ECR (ARM64)
    → SSM Run Command: EC2 pulls latest image, swaps containers
```

Caddy handles automatic HTTPS via Let's Encrypt, with TLS certs persisted in a Docker volume across deployments.

## Design Decisions

- **ARM64 everywhere** — EC2 (Graviton), CodeBuild, and container images all run ARM64 for cost savings
- **No SSH** — EC2 access is exclusively through AWS Systems Manager Session Manager
- **No CloudFront** — Caddy handles TLS termination, compression (zstd + gzip), and security headers directly on the instance
- **Strict CSP** — Content-Security-Policy defaults to `none` with explicit allowlists for scripts, styles, and images
- **Minimal image retention** — ECR keeps only the 2 most recent images; S3 artifacts expire after 7 days
- **Queued pipeline** — CodePipeline V2 in QUEUED mode prevents concurrent deployments
