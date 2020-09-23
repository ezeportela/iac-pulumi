import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as postgresql from '@pulumi/postgresql';

const config = new pulumi.Config();
const bucketname = config.require('bucketname');

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket(bucketname);

const defaultInstance = new aws.rds.Instance('iac-pulumi', {
  allocatedStorage: 20,
  engine: 'postgres',
  engineVersion: '12.3',
  instanceClass: 'db.t2.micro',
  name: 'iacPulumiPostgres',
  parameterGroupName: 'default.postgres12',
  password: 'foobarbaz',
  storageType: 'gp2',
  username: 'foo',
});

// TO DO: buscar como el destroy de pulumi elimina la base de datos
export const databaseName = defaultInstance.name;

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
