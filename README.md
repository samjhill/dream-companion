# Dream Companion App 🦉

> An AI-powered dream journal application that helps users track, analyze, and interpret their dreams with personalized insights and guidance.

[![Tests](https://github.com/samjhill/dream-companion/actions/workflows/test.yml/badge.svg)](https://github.com/samjhill/dream-companion/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org)

## 🌟 Features

### Core Functionality
- **📖 Dream Journaling**: Record and organize your dreams with timestamps
- **🤖 AI-Powered Analysis**: Get personalized dream interpretations and insights
- **📊 Pattern Recognition**: Discover recurring themes and symbols in your dreams
- **🗓️ Dream Heatmap**: Visualize your dream frequency over time
- **🎨 Dream Art**: Unique generative art that evolves with your dreams
- **📱 SMS Sharing**: Share your dream art with friends via text message
- **✨ Lucid Dream Guide**: Learn techniques for conscious dreaming
- **🌅 Waking Life Integration**: Connect dream insights to daily life

### Premium Features
- **🔍 Advanced Dream Analysis**: Deep psychological pattern analysis
- **🧠 Personal Memory System**: Build a personal knowledge base
- **📈 Detailed Analytics**: Comprehensive dream statistics and trends
- **🎯 Personalized Insights**: AI-powered recommendations based on your patterns

### User Experience
- **📱 Responsive Design**: Optimized for desktop and mobile
- **🌙 Dark/Light Themes**: Comfortable viewing in any lighting
- **♿ Accessibility**: Full screen reader and keyboard navigation support
- **💬 Feedback System**: Easy way to share thoughts and suggestions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- AWS Account (for deployment)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/samjhill/dream-companion.git
   cd dream-companion-app
   ```

2. **Set up the backend**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r src/requirements.txt
   
   # Run the backend
   python src/run.py
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📚 Documentation

### User Documentation
- [📖 User Guide](docs/user-guide/) - Complete guide for end users
- [🎯 Getting Started](docs/user-guide/getting-started.md) - First steps with the app
- [✨ Features Overview](docs/user-guide/features.md) - Detailed feature explanations
- [💎 Premium Features](docs/user-guide/premium.md) - Premium subscription benefits

### Developer Documentation
- [🛠️ Developer Guide](docs/developer-guide/) - Technical documentation for developers
- [🏗️ Architecture](docs/architecture/) - System design and architecture
- [🔌 API Reference](docs/api-reference/) - Complete API documentation
- [🧪 Testing](docs/developer-guide/testing.md) - Testing guidelines and setup
- [🚀 Deployment](docs/deployment/) - Deployment guides and configurations

### Quick Links
- [📋 Changelog](CHANGELOG.md) - Recent changes and updates
- [🐛 Bug Reports](https://github.com/samjhill/dream-companion/issues) - Report issues
- [💡 Feature Requests](https://github.com/samjhill/dream-companion/issues) - Suggest new features
- [📄 License](LICENSE) - MIT License

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Vite for fast development and builds
- AWS Amplify for authentication
- CSS with modern layout techniques

**Backend**
- Python 3.11+ with Flask
- AWS Lambda for serverless execution
- DynamoDB for data storage
- S3 for file storage

**Infrastructure**
- AWS SAM for deployment
- API Gateway for routing
- Cognito for authentication
- Stripe for payments

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │───▶│   API Gateway   │───▶│   Lambda        │
│   (Frontend)    │    │   (Routing)     │    │   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Cognito       │    │   DynamoDB      │
                       │   (Auth)        │    │   (Data)        │
                       └─────────────────┘    └─────────────────┘
```

## 🧪 Testing

The application has comprehensive test coverage:

```bash
# Run all tests
python run_tests.py

# Frontend tests only
cd frontend && npm test

# Backend tests only
cd src && pytest
```

- **Frontend**: Vitest + React Testing Library
- **Backend**: pytest with comprehensive mocking
- **Coverage**: 80%+ line coverage target

## 🚀 Deployment

### Production Deployment

```bash
# Deploy backend (automated, no confirmation prompts)
./deploy.sh

# Build frontend for production
./deploy-frontend.sh

# Deploy frontend (if using Amplify)
cd frontend && npx amplify publish
```

### Environment Setup
- [🔧 Environment Configuration](docs/deployment/environment.md)
- [🔑 AWS Setup](docs/deployment/aws-setup.md)
- [💳 Stripe Integration](docs/deployment/stripe-setup.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- TypeScript for frontend code
- Python with type hints for backend
- Comprehensive test coverage
- Accessibility compliance
- Responsive design principles

## 📊 Project Status

- ✅ **Core Features**: Dream journaling, AI analysis, theme recognition
- ✅ **Dream Art**: Generative art system with SMS sharing
- ✅ **Authentication**: AWS Cognito integration
- ✅ **Premium System**: Stripe payment integration
- ✅ **Testing**: Comprehensive test suite
- ✅ **Deployment**: Automated AWS SAM deployment pipeline
- ✅ **Documentation**: Complete user and developer guides
- 🔄 **Active Development**: Regular updates and improvements

## 📞 Support

- **Documentation**: Check the [docs](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/samjhill/dream-companion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/samjhill/dream-companion/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the power of dreams and self-reflection
- Thanks to all contributors and users who provide feedback

---

**Made with ☕ and 🌙 by the Dream Companion team**