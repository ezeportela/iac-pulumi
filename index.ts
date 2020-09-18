import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const config = new pulumi.Config();
const bucketname = config.require('bucketname');

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket(bucketname);

// Configure IAM so that the AWS Lambda can be run.
const lambdaDataLoaderHandlerRole = new aws.iam.Role(
  'lambdaDataLoaderHandlerRole',
  {
    assumeRolePolicy: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
          Sid: '',
        },
      ],
    },
  }
);

new aws.iam.RolePolicyAttachment('lambdaDataLoaderFuncRoleAttach', {
  role: lambdaDataLoaderHandlerRole,
  policyArn: aws.iam.ManagedPolicies.AWSLambdaFullAccess,
});

// Next, create the Lambda function itself:
const lambdaDataLoaderHandlerFunc = new aws.lambda.Function(
  'lambdaDataloader',
  {
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda-dataloader'),
    }),
    runtime: 'python3.8',
    role: lambdaDataLoaderHandlerRole.arn,
    handler: 'main.handler',
  }
);

bucket.onObjectCreated('lambda-dataloader', lambdaDataLoaderHandlerFunc);

// Export the name of the bucket
export const bucketName = bucket.id;
