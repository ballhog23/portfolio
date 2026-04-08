# Infrastructure

AWS CDK v2 (TypeScript) infrastructure for [calebpirkle.com](https://calebpirkle.com). Deployed to `us-east-1`.

## Stacks

The infrastructure is split into two stacks separated by change frequency and blast radius:

### RuntimeStack

Long-lived resources that rarely change. Destroying these has real consequences.

- **VPC** — Single public subnet, 1 AZ, no NAT gateway (`10.0.0.0/24`)
- **EC2** — `t4g.nano` (ARM64 Graviton) running Amazon Linux 2023 with Docker installed via user data
- **Elastic IP** — Static IP associated with the EC2 instance for stable DNS
- **Route 53** — Hosted zone for `calebpirkle.com` with A records for bare domain and `www`, both pointing to the Elastic IP
- **ECR** — `calebpirkle/site` repository with mutable tags and a lifecycle policy retaining only the 2 most recent images
- **S3** — Private artifact bucket with 7-day expiration, SSE, and TLS enforcement
- **Security Group** — Inbound on ports 80 and 443 only. No SSH — all access via SSM Session Manager
- **IAM** — Instance role with `AmazonSSMManagedInstanceCore` and `AmazonEC2ContainerRegistryReadOnly`

### PipelineStack

CI/CD resources that are safe to tear down and rebuild without affecting the running site.

- **Source** — GitHub integration via CodeConnections (OAuth), watching `master` branch
- **Build** — CodeBuild on ARM64 Linux (`amazonlinux-aarch64-standard:3.0`, privileged mode for Docker-in-Docker). Builds and pushes Docker images tagged with both `latest` and the git commit SHA
- **Deploy** — EC2Deploy action via SSM Run Command. Runs `scripts/deploy.sh` on the target instance, which pulls the latest image from ECR, stops the old container, and starts the new one with persistent Caddy TLS volumes
- **Pipeline** — CodePipeline V2 in QUEUED execution mode (serialized, one deployment at a time)

## Architecture Diagram

```
CI/CD Pipeline
══════════════
GitHub (master)
    │
    ▼
CodePipeline
    │
    ├─ 1. Source ── pulls code via CodeConnections
    │
    ├─ 2. Build ── CodeBuild (ARM64)
    │                  │
    │                  └─ pushes image → ECR
    │
    └─ 3. Deploy ── SSM RunCommand → EC2
                                      │
                                      └─ pulls image from ECR
                                         restarts Docker container

Request Flow
════════════
Browser → Route 53 (calebpirkle.com) → Elastic IP → EC2 (t4g.nano)
                                                       │
                                                     Docker
                                                       │
                                                     Caddy (ports 80/443)
                                                       │
                                                     Static Site
```

## Commands

```bash
npm run build        # Compile TypeScript
npx cdk synth        # Emit CloudFormation templates
npx cdk diff         # Compare deployed stack with current state
npx cdk deploy --all # Deploy all stacks
```