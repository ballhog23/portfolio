#!/bin/bash
set -e

container_diagnostics() {
    docker inspect --format='Status={{.State.Status}} ExitCode={{.State.ExitCode}} Error={{.State.Error}} OOMKilled={{.State.OOMKilled}} Restarts={{.RestartCount}} Path={{.Path}} Args={{json .Args}}' calebpirklesite || true
    docker logs --tail 100 calebpirklesite || true
}

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI=$(aws ecr describe-repositories --repository-name calebpirkle/site --query 'repositories[0].repositoryUri' --output text)

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker pull $ECR_URI:latest
docker stop calebpirklesite || true
docker rm calebpirklesite || true
docker run --name calebpirklesite -d \
  -p 80:80 \
  -p 443:443 \
  -p 443:443/udp \
  -v caddy_data:/data \
  --restart unless-stopped \
  $ECR_URI:latest

if ! docker inspect --format='{{.State.Running}}' calebpirklesite 2>/dev/null | grep -q true; then
    echo "Container failed to start"
    container_diagnostics
    exit 1
fi

echo "Waiting for container to become healthy..."
for i in $(seq 1 10); do
    if curl -sf -o /dev/null -H "Host: calebpirkle.com" http://localhost; then
        echo "Health check passed"
        exit 0
    fi
    sleep 2
done

echo "Health check failed — container did not respond in time"
container_diagnostics
exit 1
