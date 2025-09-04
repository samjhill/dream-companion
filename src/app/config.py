import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class"""

    # Flask configuration
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'dev-secret-key')

    # JWT configuration
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret')

    # AWS configuration
    S3_BUCKET_NAME: str = os.environ.get('S3_BUCKET_NAME', '')
    AWS_ACCESS_KEY_ID: str = os.environ.get('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY: str = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
    AWS_REGION: str = os.environ.get('AWS_REGION', 'us-east-1')

    # Cognito configuration
    COGNITO_REGION: str = 'us-east-1'
    COGNITO_USERPOOL_ID: str = 'us-east-1_A7pHyJ90V'
