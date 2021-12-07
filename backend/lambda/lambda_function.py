import boto3
from botocore import exceptions
from datetime import datetime
import json
import os

s3 = boto3.client('s3')
sagemaker = boto3.client('sagemaker')
bucket = os.getenv('BUCKET')
path = os.getenv('PATH')
headers = {
    'Content-Type': 'application/json'
}

def lambda_handler(event, context):
    try:
        message = 'An error has occurred'
        status_code = 500
        
        print('INPUT PATH')
        print( os.path.join(f's3://{bucket}', path, json.loads(event['body'])['folder_name']))
        print('NEXT STEPS')
        response = s3.list_objects(Bucket=bucket, Prefix=os.path.join(path, json.loads(event['body'])['folder_name'], '') )
        if 'Contents' not in response:
            raise Exception('FolderNotFound')
       
        for item in response['Contents']:
            if item['Key'].endswith('.csv'):
                break
        else:
            raise Exception('FileNotFound')
       
       #Creation of the training Job
        response = sagemaker.create_training_job(
            TrainingJobName=json.loads(event['body'])['folder_name'],
            HyperParameters={
                'time_left_for_this_task':'120', #ON prod 3600
                'per_run_time_limit':'30', #ON prod 180
                'validation_size':'0.15',
                'test_size':'0.15',
                'initial_configurations_via_metalearning':'30' 
            },
            AlgorithmSpecification={
                'TrainingImage': os.getenv('TRAINING_IMAGE'),
                'TrainingInputMode': 'File'
            },
            RoleArn=os.getenv('ROLE_ARN'),
            InputDataConfig=[
                {
                    'ChannelName': 'training',
                    'DataSource': {
                        'S3DataSource': {
                            'S3DataType': 'S3Prefix',
                            'S3Uri': os.path.join(f's3://{bucket}', path, json.loads(event['body'])['folder_name']), 
                            'S3DataDistributionType': 'FullyReplicated'
                        }
                    },
                    'ContentType': 'text/csv',
                    'CompressionType': 'None',
                    'RecordWrapperType': 'None'
                },
            ],
            OutputDataConfig={
                'S3OutputPath': os.path.join(f's3://{bucket}',path)
            },
            ResourceConfig={
                'InstanceType': 'ml.c5.xlarge',
                'InstanceCount': 1,
                'VolumeSizeInGB': 10
            },
           
            StoppingCondition={
                'MaxRuntimeInSeconds': 3780  # 1 hora + 3 min, if this exceeds this quota then stop the process.
            }
        )
       
        message = f"Training job {response['TrainingJobArn']} was launched"
        status_code = 200
    except exceptions.ClientError as error:
        if error.response['Error']['Code'] == 'ResourceInUse':
            message = 'This training job already exists'
            status_code = 400
        else:
            raise error
    except Exception as error:
        if error.args[0] == 'FolderNotFound':
            message = 'No training folder was found'
            status_code = 404
        elif error.args[0] == 'FileNotFound':
            message = 'No training dataset was found'
            status_code = 404
        else:
            raise error
    finally:
        response = {
            'message': message
        }
        print(message)
   
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(response),
        'isBase64Encoded': False
    }
