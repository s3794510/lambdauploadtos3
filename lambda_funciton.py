import json
import boto3


def lambda_handler(event, context):
    
    header = {
        'headers': {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        }
    }
    
    response = {}
    response.update(header)
    
    
    # Parse the request body from the event object if body type is already a dictionary
    if (type(event['body']) is dict):
        request_body = event['body']
    else:
        # Parse the request body from the event object
        request_body = json.loads(event['body'])
        
    # Initialize Boto3 S3 client
    s3_client = boto3.client('s3')
    
    # Define bucket name and object key
    bucket_name = 'commet-testing'
    object_key = 'path/'
    
    # Initiate the multipart upload
    response_s3 = s3_client.create_multipart_upload(
        Bucket=bucket_name,
        Key=object_key
    )
    
    # Extract upload ID
    upload_id = response_s3['UploadId']
    
    # Construct the API response
    response.update({
        'statusCode':200,
        'body':upload_id
    })
    
    return response