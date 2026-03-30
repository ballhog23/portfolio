import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { RuntimeStack } from '../lib/runtime-stack';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new cdk.App();

const runtime = new RuntimeStack(app, 'RuntimeStack', {
  env
});

new PipelineStack(app, 'PipelineStack', {
  env,
  HOST_INSTANCE_TAG_NAME: runtime.HOST_INSTANCE_TAG_NAME,
  ECR_REPOSITORY: runtime.ECR_REPOSITORY,
  S3_ARTIFACT_BUCKET: runtime.S3_ARTIFACT_BUCKET,
});