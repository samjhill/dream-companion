# Testing Guide for Dream Companion App

This document provides comprehensive information about the testing setup for the Dream Companion App, including how to run tests, understand coverage, and contribute to the test suite.

## Overview

The Dream Companion App has a comprehensive testing setup with:

- **Frontend Tests**: React components using Vitest and React Testing Library
- **Backend Tests**: Flask API using pytest with comprehensive mocking
- **Integration Tests**: End-to-end API testing
- **Coverage Reporting**: Detailed coverage reports for both frontend and backend
- **CI/CD Pipeline**: Automated testing on GitHub Actions

## Test Structure

```
dream-companion-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── *.test.tsx          # Component tests
│   │   │   └── *.tsx               # Components
│   │   └── test/
│   │       └── setup.ts            # Test setup and mocks
│   ├── vitest.config.ts            # Vitest configuration
│   └── package.json                # Test scripts
├── src/
│   ├── tests/
│   │   ├── conftest.py             # Pytest fixtures
│   │   ├── test_routes.py          # API route tests
│   │   ├── test_premium.py         # Premium feature tests
│   │   └── test_stripe_integration.py # Stripe integration tests
│   └── requirements.txt            # Test dependencies
├── pytest.ini                     # Pytest configuration
├── run_tests.py                    # Test runner script
└── .github/workflows/test.yml      # CI/CD pipeline
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm or yarn
- pip

### Running All Tests

```bash
# Install dependencies and run all tests
python run_tests.py --install

# Run tests without installing dependencies
python run_tests.py

# Run tests with coverage
python run_tests.py --no-coverage false

# Run only frontend tests
python run_tests.py --frontend-only

# Run only backend tests
python run_tests.py --backend-only
```

### Frontend Testing

#### Setup
```bash
cd frontend
npm install
```

#### Available Commands
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

#### Test Configuration
- **Framework**: Vitest (faster alternative to Jest)
- **Testing Library**: React Testing Library
- **Environment**: jsdom
- **Coverage**: v8 provider
- **Mocks**: AWS Amplify, Framer Motion, React Router

#### Writing Frontend Tests
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Backend Testing

#### Setup
```bash
cd src
pip install -r requirements.txt
```

#### Available Commands
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_routes.py

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_routes.py::TestHealthCheck::test_health_check_success
```

#### Test Configuration
- **Framework**: pytest
- **Coverage**: pytest-cov
- **Mocking**: pytest-mock, responses
- **Database**: moto (for AWS services)
- **Flask**: pytest-flask

#### Writing Backend Tests
```python
import pytest
from unittest.mock import patch, Mock

def test_api_endpoint(client):
    """Test an API endpoint."""
    response = client.get('/api/endpoint')
    assert response.status_code == 200
    data = response.get_json()
    assert 'expected_key' in data

@patch('src.app.external_service.call')
def test_external_service_integration(mock_call, client):
    """Test integration with external service."""
    mock_call.return_value = {'status': 'success'}
    
    response = client.post('/api/endpoint', json={'data': 'test'})
    assert response.status_code == 200
    mock_call.assert_called_once()
```

## Test Categories

### Frontend Tests

#### Component Tests
- **Rendering**: Components render without crashing
- **Props**: Components handle props correctly
- **State**: State changes work as expected
- **Events**: User interactions trigger correct behavior
- **Accessibility**: Components are accessible

#### Hook Tests
- **Custom Hooks**: Test custom React hooks
- **State Management**: Test state updates
- **Side Effects**: Test useEffect behavior

#### Integration Tests
- **API Integration**: Test API calls and responses
- **Routing**: Test navigation between pages
- **Authentication**: Test auth flows

### Backend Tests

#### Unit Tests
- **Routes**: Test API endpoints
- **Business Logic**: Test core functionality
- **Utilities**: Test helper functions
- **Validation**: Test input validation

#### Integration Tests
- **Database**: Test database operations
- **External APIs**: Test third-party integrations
- **Authentication**: Test auth middleware
- **Error Handling**: Test error scenarios

#### API Tests
- **Endpoints**: Test all API endpoints
- **Authentication**: Test protected routes
- **Validation**: Test request/response validation
- **Error Cases**: Test error handling

## Coverage

### Frontend Coverage
- **Target**: 80% line coverage
- **Report**: HTML report in `frontend/coverage/`
- **Thresholds**: Configured in `vitest.config.ts`

### Backend Coverage
- **Target**: 80% line coverage
- **Report**: HTML report in `src/htmlcov/`
- **Thresholds**: Configured in `pytest.ini`

### Viewing Coverage Reports
```bash
# Frontend
open frontend/coverage/index.html

# Backend
open src/htmlcov/index.html
```

## Mocking Strategy

### Frontend Mocks
- **AWS Amplify**: Mocked for testing without AWS
- **Framer Motion**: Mocked for consistent testing
- **React Router**: Mocked for navigation testing
- **Date Functions**: Mocked for consistent date handling

### Backend Mocks
- **AWS Services**: Using moto for S3, DynamoDB, Secrets Manager
- **Stripe**: Mocked Stripe API calls
- **External APIs**: Mocked with responses library
- **Database**: In-memory test database

## CI/CD Pipeline

### GitHub Actions Workflow
The CI/CD pipeline runs on every push and pull request:

1. **Frontend Tests**: Lint, test, and coverage
2. **Backend Tests**: Lint, test, and coverage
3. **Integration Tests**: End-to-end testing
4. **Security Scan**: Vulnerability scanning
5. **Build & Deploy**: Production deployment (main branch only)

### Pipeline Stages
- **Linting**: Code quality checks
- **Unit Tests**: Individual component/function tests
- **Integration Tests**: API and component integration
- **Coverage**: Coverage reporting and thresholds
- **Security**: Vulnerability scanning
- **Deployment**: Automated deployment

## Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Descriptive Names**: Use clear, descriptive test names
4. **Single Responsibility**: One test, one behavior
5. **Mock External Dependencies**: Isolate units under test

### Test Data
1. **Use Factories**: Create test data with factories
2. **Consistent Data**: Use consistent test data
3. **Edge Cases**: Test boundary conditions
4. **Error Cases**: Test error scenarios

### Maintenance
1. **Keep Tests Updated**: Update tests when code changes
2. **Remove Dead Tests**: Remove tests for removed features
3. **Refactor Tests**: Keep tests clean and maintainable
4. **Monitor Coverage**: Track coverage trends

## Troubleshooting

### Common Issues

#### Frontend Tests
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with debug info
npm run test -- --reporter=verbose
```

#### Backend Tests
```bash
# Clear Python cache
find . -type d -name __pycache__ -delete
find . -name "*.pyc" -delete

# Run tests with debug info
pytest -v -s --tb=long
```

#### Coverage Issues
```bash
# Check coverage configuration
cat vitest.config.ts  # Frontend
cat pytest.ini       # Backend

# Generate fresh coverage reports
npm run test:coverage  # Frontend
pytest --cov=app --cov-report=html  # Backend
```

### Debug Mode
```bash
# Frontend debug
npm run test -- --reporter=verbose --no-coverage

# Backend debug
pytest -v -s --tb=long --no-cov
```

## Contributing

### Adding New Tests
1. **Follow Naming Conventions**: Use descriptive test names
2. **Add to Appropriate Category**: Unit, integration, or e2e
3. **Update Coverage**: Ensure new code is covered
4. **Document Complex Tests**: Add comments for complex test logic

### Test Review Checklist
- [ ] Tests cover the main functionality
- [ ] Edge cases are tested
- [ ] Error cases are tested
- [ ] Tests are readable and maintainable
- [ ] Mocks are appropriate and minimal
- [ ] Coverage thresholds are met

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [pytest Documentation](https://docs.pytest.org/)
- [Flask Testing](https://flask.palletsprojects.com/en/2.0.x/testing/)

### Tools
- [Vitest UI](https://vitest.dev/guide/ui.html)
- [Coverage Reports](https://vitest.dev/guide/coverage.html)
- [pytest-html](https://pytest-html.readthedocs.io/)

### Examples
- See existing test files for examples
- Check the test runner script for advanced usage
- Review CI/CD pipeline for automated testing
