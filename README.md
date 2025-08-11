# Dream Companion App

A dream journal application that helps users track, analyze, and interpret their dreams using AI-powered insights.

## Features

- Dream journaling and tracking
- AI-powered dream interpretation
- Theme analysis and patterns
- Lucid dreaming guidance
- Waking life integration

## Project Structure

- `frontend/` - React TypeScript frontend application
- `src/` - Python Flask backend API
- `template.yml` - AWS SAM deployment configuration

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r src/requirements.txt

# Run the application
python3 src/run.py
```

## Deployment

### Backend
```bash
cd src
eb deploy
```

### Frontend
Automatically deployed on push to main GitHub branch.

## Technologies

- **Frontend**: React, TypeScript, Vite, AWS Amplify
- **Backend**: Python, Flask, AWS Lambda
- **Infrastructure**: AWS SAM, S3, Cognito

