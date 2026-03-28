#!/bin/bash
set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI=$(aws ecr describe-repositories --repository-name calebpirkle/site --query 'repositories[0].repositoryUri' --output text)

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker pull $ECR_URI:latest
docker stop calebpirklesite || true
docker rm calebpirklesite || true
docker run --name calebpirklesite -d -p 80:80 -p 443:443 -v caddy_data:/data --restart unless-stopped $ECR_URI:latest
for i in 1 2 3 4 5; do
  sleep 3
  curl -fsk --resolve calebpirkle.com:443:127.0.0.1 https://calebpirkle.com && break
  [ $i -eq 5 ] && exit 1
done