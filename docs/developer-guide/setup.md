# Development Setup Guide

This guide will help you set up a local development environment for the Dream Companion App.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **AWS CLI** ([Download](https://aws.amazon.com/cli/))
- **AWS SAM CLI** ([Download](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/samjhill/dream-companion.git
cd dream-companion-app
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r src/requirements.txt

# Set up environment variables
cp src/env.example src/.env
# Edit src/.env with your configuration
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Set up AWS Amplify (if needed)
npx amplify configure
```

### 4. Run the Application

```bash
# Terminal 1: Backend
cd src
python run.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Detailed Setup

### Backend Configuration

#### Environment Variables

Create a `.env` file in the `src/` directory:

```bash
# Flask Configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# AWS Configuration
S3_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_QUARTERLY_PRICE_ID=price_your_quarterly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id

# DynamoDB Tables
PREMIUM_TABLE_NAME=dream-companion-premium-users
MEMORIES_TABLE_NAME=dream-companion-memories
FEEDBACK_TABLE_NAME=dream-companion-feedback
```

#### AWS Configuration

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

2. **Set up AWS Services**:
   - S3 bucket for dream storage
   - DynamoDB tables for user data
   - Cognito user pool for authentication
   - Lambda function for API

3. **Create Required Resources**:
   ```bash
   # Create S3 bucket
   aws s3 mb s3://your-bucket-name
   
   # Create DynamoDB tables (will be created automatically on first use)
   ```

### Frontend Configuration

#### AWS Amplify Setup

1. **Initialize Amplify**:
   ```bash
   cd frontend
   npx amplify init
   ```

2. **Add Authentication**:
   ```bash
   npx amplify add auth
   ```

3. **Configure Cognito**:
   - Set up user pool
   - Configure authentication flow
   - Set up user attributes

#### Development Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 🧪 Testing Setup

### Backend Testing

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-mock moto

# Run tests
cd src
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_routes.py
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Integration Testing

```bash
# Run all tests
python run_tests.py

# Run with coverage
python run_tests.py --no-coverage false

# Run only frontend tests
python run_tests.py --frontend-only

# Run only backend tests
python run_tests.py --backend-only
```

## 🗄️ Database Setup

### DynamoDB Tables

The application uses several DynamoDB tables:

1. **dream-companion-premium-users**: Premium subscription data
2. **dream-companion-memories**: User memory and trait data
3. **dream-companion-feedback**: User feedback data

Tables are created automatically when first accessed, or you can create them manually:

```bash
# Create premium users table
aws dynamodb create-table \
    --table-name dream-companion-premium-users \
    --attribute-definitions AttributeName=phone_number,AttributeType=S \
    --key-schema AttributeName=phone_number,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create memories table
aws dynamodb create-table \
    --table-name dream-companion-memories \
    --attribute-definitions AttributeName=user_id,AttributeType=S \
    --key-schema AttributeName=user_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create feedback table
aws dynamodb create-table \
    --table-name dream-companion-feedback \
    --attribute-definitions \
        AttributeName=feedback_id,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
    --key-schema AttributeName=feedback_id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=user-feedback-index,KeySchema='[{AttributeName=user_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}]',Projection='{ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST
```

### S3 Bucket Setup

```bash
# Create S3 bucket
aws s3 mb s3://your-dream-companion-bucket

# Set up CORS (if needed)
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors.json
```

## 🔐 Authentication Setup

### Cognito User Pool

1. **Create User Pool**:
   ```bash
   aws cognito-idp create-user-pool \
       --pool-name dream-companion-users \
       --policies '{
           "PasswordPolicy": {
               "MinimumLength": 8,
               "RequireUppercase": true,
               "RequireLowercase": true,
               "RequireNumbers": true,
               "RequireSymbols": false
           }
       }'
   ```

2. **Create User Pool Client**:
   ```bash
   aws cognito-idp create-user-pool-client \
       --user-pool-id your-user-pool-id \
       --client-name dream-companion-client \
       --generate-secret
   ```

3. **Configure Amplify**:
   Update `frontend/src/aws-exports.ts` with your Cognito configuration.

## 🚀 Deployment Setup

### Local Deployment Testing

```bash
# Build the application
sam build

# Test locally
sam local start-api

# Deploy to AWS
sam deploy --guided
```

### Environment-Specific Configuration

Create different configuration files for different environments:

```bash
# Development
cp src/env.example src/.env.development

# Staging
cp src/env.example src/.env.staging

# Production
cp src/env.example src/.env.production
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

**Import Errors**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r src/requirements.txt
```

**AWS Connection Issues**:
```bash
# Check AWS configuration
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

**Database Connection Issues**:
```bash
# Check DynamoDB tables exist
aws dynamodb list-tables

# Check S3 bucket exists
aws s3 ls
```

#### Frontend Issues

**Build Errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Amplify Issues**:
```bash
# Reconfigure Amplify
npx amplify configure
```

**Authentication Issues**:
- Verify Cognito user pool configuration
- Check `aws-exports.ts` file
- Ensure user pool client is properly configured

### Debug Mode

#### Backend Debug
```bash
# Run with debug logging
FLASK_DEBUG=1 python src/run.py
```

#### Frontend Debug
```bash
# Run with verbose logging
npm run dev -- --verbose
```

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Getting Help

If you encounter issues during setup:

1. **Check the logs** for specific error messages
2. **Verify prerequisites** are installed correctly
3. **Check AWS configuration** and permissions
4. **Review environment variables** are set correctly
5. **Open an issue** on GitHub with detailed error information

---

**Happy coding!** 🚀
