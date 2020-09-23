import boto3
import csv

def handler(event, context):
  s3_client = boto3.client('s3')
  bucket = event['Records'][0]['s3']['bucket']['name']
  filename = event['Records'][0]['s3']['object']['key']

  download_path = f'/tmp/{filename}'
  s3_client.download_file(bucket, filename, download_path)

  with open(download_path) as file:
    rows = csv.reader(file)
    
    for i, row in enumerate(rows):
      print(i, row)