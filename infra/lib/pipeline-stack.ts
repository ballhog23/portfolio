import * as s3 from "aws-cdk-lib/aws-s3";
import * as cb from "aws-cdk-lib/aws-codebuild";
import * as cp from "aws-cdk-lib/aws-codepipeline";
import * as cp_actions from "aws-cdk-lib/aws-codepipeline-actions";
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { Repository } from "aws-cdk-lib/aws-ecr";
import type { IRole } from "aws-cdk-lib/aws-iam";

// these props are exported from RuntimeStack and wired in bin/infra.ts
interface PipelineStackProps extends StackProps {
  HOST_INSTANCE_TAG_NAME: string;
  INSTANCE_ROLE: IRole;
  ECR_REPOSITORY: Repository;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    const instanceRole = props.INSTANCE_ROLE;
    const hostInstanceTagName = props.HOST_INSTANCE_TAG_NAME;
    const ecrRepository = props.ECR_REPOSITORY;
    const ecrRepositoryURI = ecrRepository.repositoryUri;

    const s3ArtifactBucket = new s3.Bucket(this, 's3ArtifactBucket', {
      bucketName: 'calebpirkle.com',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      eventBridgeEnabled: false,
      transferAcceleration: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: Duration.days(7)
        }
      ]
    });
    s3ArtifactBucket.grantRead(instanceRole);

    const codeBuild = new cb.Project(this, 'CodeBuild', {
      buildSpec: cb.BuildSpec.fromSourceFilename('buildspec.yml'),
      environment: {
        buildImage: cb.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
        computeType: cb.ComputeType.SMALL,
        privileged: true, // required for Docker build
        environmentVariables: {
          ecrURI: {
            value: ecrRepositoryURI,
            type: cb.BuildEnvironmentVariableType.PLAINTEXT
          },
        },
      },
      // we will let cdk handle role creation, by default cdk creates a role with least privilege
    });
    ecrRepository.grantPullPush(codeBuild);

    const sourceOutput = new cp.Artifact();
    const buildOutput = new cp.Artifact();

    // make sure github connection arn is set in .env
    const githubConnectionARN = process.env.GITHUB_CONNECTION_ARN;
    if (!githubConnectionARN)
      throw new Error("You must set the Github connection arn in the env file");

    new cp.Pipeline(this, 'CodePipeline', {
      artifactBucket: s3ArtifactBucket,
      pipelineName: 'calebpirkle.com',
      pipelineType: cp.PipelineType.V2,
      executionMode: cp.ExecutionMode.QUEUED,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new cp_actions.CodeStarConnectionsSourceAction({
              actionName: 'GitHub_Source',
              owner: 'ballhog23',
              repo: 'portfolio',
              branch: 'master',
              connectionArn: githubConnectionARN,
              output: sourceOutput,
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new cp_actions.CodeBuildAction({
              actionName: 'Docker_Build',
              project: codeBuild,
              input: sourceOutput,
              outputs: [buildOutput],
            })
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new cp_actions.Ec2DeployAction({
              actionName: 'Ec2Deploy',
              input: buildOutput,
              instanceTagKey: 'Name',
              instanceTagValue: hostInstanceTagName,
              instanceType: cp_actions.Ec2InstanceType.EC2,
              deploySpecifications: cp_actions.Ec2DeploySpecifications.inline({
                targetDirectory: '/home/ec2-user/deploy',
                postScript: 'scripts/deploy.sh',
              }),
            })
          ]
        }
      ],
      // we will let cdk handle role creation, by default cdk creates a role with least privilege
    });
  }
}