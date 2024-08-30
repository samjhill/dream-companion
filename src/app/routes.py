import json
from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from flask_jwt_extended import jwt_required
from flask_cognito import cognito_auth_required, current_user, current_cognito_jwt

import boto3
import os
import urllib.parse

from dotenv import load_dotenv

load_dotenv()

routes_bp = Blueprint('routes_bp', __name__)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)

@routes_bp.route('/', methods=['GET'])
def api_health_check():
    print("Received health check request")
    return jsonify({"status": "OK"}), 200

@routes_bp.route('/dreams/<phone_number>', methods=['GET'])
@cognito_auth_required
@cross_origin(supports_credentials=True)
def get_dreams(phone_number):
    try:
        print(current_cognito_jwt['username'])
        # List all objects in the user's S3 directory
        response = s3_client.list_objects_v2(
            Bucket=os.getenv('S3_BUCKET_NAME'),
            Prefix=f'{phone_number}/'
        )

        print(response)

        if 'Contents' in response:
            dreams = [{'key': obj['Key']} for obj in response['Contents']]
            return jsonify(dreams), 200
        else:
            return jsonify({"msg": "No dreams found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/dreams/<phone_number>/<dream_id>', methods=['GET'])
@cognito_auth_required
@cross_origin(supports_credentials=True)
def get_dream(phone_number, dream_id):
    try:
        # Retrieve the specific dream object from S3
        key = f'{phone_number}/{dream_id}'
        response = s3_client.get_object(
            Bucket=os.getenv('S3_BUCKET_NAME'),
            Key=key
        )

        dream_content = json.loads(response['Body'].read().decode('utf-8'))
        
        to_return = {
            **dream_content,
            "response": " ".join(dream_content["response"]),
            "dream_content": urllib.parse.unquote_plus(dream_content["dreamContent"])
        }
        return jsonify(to_return), 200

    except s3_client.exceptions.NoSuchKey:
        return jsonify({"msg": "Dream not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

