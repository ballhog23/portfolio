# Launch Guide

## Cost Estimate (us-east-1, monthly)

| Service | Detail | Est. Cost |
|---------|--------|-----------|
| EC2 t4g.nano | 1 instance, 24/7, on-demand ($0.0042/hr) | ~$3.07 |
| Elastic IP | Associated with running instance | $3.65 |
| EBS (gp3) | 8 GB default root volume ($0.08/GB) | ~$0.64 |
| Route 53 | 1 hosted zone + minimal queries | ~$0.50 |
| ECR | ~200 MB storage (2 images) at $0.10/GB | ~$0.02 |
| CodePipeline V2 | ~3 actions x ~5 min per deploy | ~$0.03/deploy |
| CodeBuild | arm1.small, ~5 min per build ($0.0034/min) | ~$0.02/build |
| S3 (artifacts) | Minimal storage, 7-day expiry | ~$0.01 |
| Data Transfer | Minimal for a portfolio site | ~$0.00 |
| **Total (idle)** | **No deploys, site running** | **~$7.88/mo** |
| **Total (active)** | **~10 deploys/month** | **~$8.40/mo** |

### Notes

- CodeBuild free tier: 100 build-min/month on arm1.small — covers ~20 five-minute builds for free
- CodePipeline V2 free tier: 100 action-execution-min/month
- ECR free tier: 500 MB/month for 12 months (new accounts)
- Elastic IP: $0.005/hr (~$3.65/mo) charged regardless of association status as of Feb 2024
- With free tier credits, real cost is closer to **$7-8/mo** (mostly EC2 + EIP + Route 53)

---

## Launch Steps

### Pre-deploy (local)

1. Make sure AWS CLI is configured for account/region
   ```bash
   aws sts get-caller-identity
   ```

2. Bootstrap CDK (one-time)
   ```bash
   cd infra
   cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
   ```

3. Set environment variables in `infra/.env`
   ```
   GITHUB_CONNECTION_ARN=<your-connection-arn>
   ```

4. Fix `.gitignore` — make sure `Dockerfile`, `Caddyfile`, `infra/`, `buildspec.yml`, and `scripts/` are all tracked

5. Commit everything to `master`

### Deploy

6. Deploy RuntimeStack first
   ```bash
   cd infra
   cdk deploy RuntimeStack
   ```

7. Update domain nameservers — the new hosted zone has its own NS records, point the registered domain to them
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id <id> --query "ResourceRecordSets[?Type=='NS']"
   aws route53domains update-domain-nameservers --domain-name calebpirkle.com --nameservers Name=<ns1> Name=<ns2> Name=<ns3> Name=<ns4>
   ```

8. Deploy PipelineStack
   ```bash
   cdk deploy PipelineStack
   ```

### Verify

9. Trigger the pipeline (or push to `master`)
   ```bash
   aws codepipeline start-pipeline-execution --name calebpirkle.com
   ```

10. Watch pipeline progress
    ```bash
    aws codepipeline get-pipeline-execution --pipeline-name calebpirkle.com --pipeline-execution-id <id>
    ```

11. Verify the site is live
    ```bash
    curl -I https://calebpirkle.com
    ```
    Confirm: valid TLS cert, security headers present, HTTP 200

### If something goes wrong

- Check pipeline status: **AWS Console > CodePipeline**
- Check build logs: **AWS Console > CodeBuild > Build history**
- SSH into instance via SSM: `aws ssm start-session --target <instance-id>`
- Check container: `docker ps` and `docker logs calebpirklesite`
