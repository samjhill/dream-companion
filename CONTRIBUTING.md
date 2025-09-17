# Contributing to Dream Companion

Thank you for your interest in contributing to Dream Companion! We welcome contributions from the community and appreciate your help in making this project better.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Reports**: Report issues you've found
- **✨ Feature Requests**: Suggest new features or improvements
- **📝 Documentation**: Improve or add documentation
- **💻 Code Contributions**: Submit bug fixes or new features
- **🧪 Testing**: Add or improve tests
- **🎨 UI/UX**: Improve user interface and experience

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dream-companion.git
   cd dream-companion-app
   ```
3. **Set up the development environment** (see [Development Setup](docs/developer-guide/setup.md))
4. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Workflow

### 1. Making Changes

- **Follow the coding standards** (see below)
- **Write tests** for new functionality
- **Update documentation** as needed
- **Ensure all tests pass** before submitting

### 2. Testing Your Changes

```bash
# Run all tests
python run_tests.py

# Run frontend tests only
cd frontend && npm test

# Run backend tests only
cd src && pytest
```

### 3. Submitting Changes

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub

## 📝 Coding Standards

### General Guidelines

- **Write clean, readable code**
- **Use meaningful variable and function names**
- **Add comments for complex logic**
- **Follow existing code patterns**
- **Keep functions small and focused**

### Frontend (React/TypeScript)

- **Use TypeScript** for all new code
- **Follow React best practices**:
  - Use functional components with hooks
  - Implement proper prop validation
  - Use proper TypeScript interfaces
- **Follow naming conventions**:
  - Components: PascalCase (`MyComponent.tsx`)
  - Files: kebab-case (`my-component.css`)
  - Variables: camelCase (`myVariable`)
- **Accessibility**: Include ARIA labels and keyboard navigation
- **Responsive Design**: Ensure mobile compatibility

### Backend (Python/Flask)

- **Use Python 3.11+ features**
- **Follow PEP 8** style guidelines
- **Use type hints** for function parameters and returns
- **Write docstrings** for functions and classes
- **Handle errors gracefully** with proper error messages
- **Use meaningful variable names**

### Testing

- **Write tests** for all new functionality
- **Aim for 80%+ code coverage**
- **Test edge cases** and error conditions
- **Use descriptive test names**
- **Mock external dependencies**

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details**:
   - Operating system
   - Browser version (for frontend issues)
   - Python/Node.js versions
5. **Screenshots** or error messages (if applicable)

### Feature Requests

When requesting features, please include:

1. **Clear description** of the feature
2. **Use case** and why it would be valuable
3. **Proposed implementation** (if you have ideas)
4. **Mockups or examples** (if applicable)

## 🔍 Code Review Process

### Pull Request Guidelines

- **Keep PRs focused** on a single feature or bug fix
- **Write clear descriptions** of what the PR does
- **Link to related issues** using GitHub keywords
- **Ensure all tests pass** and coverage is maintained
- **Update documentation** as needed

### Review Criteria

We review PRs based on:

- **Code quality** and adherence to standards
- **Test coverage** and quality
- **Documentation** completeness
- **Performance** implications
- **Security** considerations
- **Accessibility** compliance

## 🏗️ Project Structure

Understanding the project structure helps with contributions:

```
dream-companion-app/
├── docs/                    # Documentation
│   ├── user-guide/         # User documentation
│   ├── developer-guide/    # Developer documentation
│   ├── architecture/       # Architecture docs
│   └── deployment/         # Deployment guides
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── helpers/        # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/        # API services
│   └── tests/              # Frontend tests
├── src/                    # Python backend
│   ├── app/                # Flask application
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
└── docs/                   # Project documentation
```

## 🧪 Testing Guidelines

### Frontend Testing

- **Use Vitest** and React Testing Library
- **Test component rendering** and user interactions
- **Mock external dependencies** (AWS Amplify, etc.)
- **Test accessibility** features
- **Test responsive behavior**

### Backend Testing

- **Use pytest** for all backend tests
- **Mock AWS services** using moto
- **Test API endpoints** with various inputs
- **Test error handling** and edge cases
- **Test authentication** and authorization

### Integration Testing

- **Test API integration** between frontend and backend
- **Test authentication flows**
- **Test data persistence**
- **Test error scenarios**

## 📚 Documentation Guidelines

### Writing Documentation

- **Use clear, simple language**
- **Include examples** and code snippets
- **Keep documentation up-to-date** with code changes
- **Use consistent formatting**
- **Include screenshots** for UI documentation

### Documentation Types

- **User Guides**: How to use the application
- **Developer Guides**: How to develop and contribute
- **API Documentation**: Endpoint specifications
- **Architecture Docs**: System design and patterns

## 🚀 Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version numbers are bumped
- [ ] Release notes are written
- [ ] Deployment is tested

## 🎯 Areas for Contribution

### High Priority

- **Bug fixes** and performance improvements
- **Accessibility** enhancements
- **Mobile experience** improvements
- **Test coverage** improvements
- **Documentation** improvements

### Medium Priority

- **New features** (discuss first)
- **UI/UX** improvements
- **API** enhancements
- **Security** improvements

### Low Priority

- **Code refactoring**
- **Performance optimizations**
- **Developer experience** improvements

## 💡 Ideas for Contributions

### Beginner-Friendly

- **Documentation improvements**
- **Bug fixes** with clear reproduction steps
- **UI/UX** improvements
- **Accessibility** enhancements

### Intermediate

- **New features** (with discussion)
- **API enhancements**
- **Performance improvements**
- **Test coverage** improvements

### Advanced

- **Architecture improvements**
- **Security enhancements**
- **Scalability** improvements
- **Advanced features**

## 🤔 Questions?

If you have questions about contributing:

1. **Check existing issues** and discussions
2. **Read the documentation** thoroughly
3. **Ask in GitHub Discussions** for general questions
4. **Open an issue** for specific problems
5. **Join our community** discussions

## 📞 Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Documentation**: Comprehensive guides in the `docs/` directory
- **Code Comments**: Inline documentation in the codebase

## 🙏 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

Thank you for contributing to Dream Companion! Your efforts help make dream analysis accessible to everyone. 🌙✨
