# Changelog

All notable changes to the Dream Companion App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dream Art System**: Unique generative art that evolves with user dreams
- **SMS Sharing**: Share dream art with friends via text message
- **Automated Deployment**: Scripts for seamless backend and frontend deployment
- **Public Art Sharing**: Public URLs for shared dream art (no login required)
- **Art Style Detection**: Automatic style selection based on dream themes
- **Interactive Canvas**: Mouse-responsive generative art elements
- Comprehensive feedback system with thumbs up/down ratings
- User feedback history and admin analytics
- Floating and inline feedback buttons
- Feedback categorization (general, feature, bug, UI, performance, other)
- Responsive feedback form with dark theme support

### Changed
- **Deployment Process**: Automated deployment with no confirmation prompts
- **Dream Art Visibility**: Enhanced shape visibility with contrasting colors
- **Canvas Rendering**: Fixed CSS background conflicts with drawn content
- Improved documentation structure and organization
- Enhanced README with comprehensive project overview
- Reorganized documentation into logical sections

### Fixed
- **Dream Art Rendering**: Resolved CSS background covering canvas content
- **CORS Issues**: Fixed cross-origin requests for premium endpoints
- **Lambda Syntax Errors**: Corrected Python syntax in routes.py
- **Premium Endpoint**: Graceful handling of missing premium features
- **Canvas Visibility**: Made generative art shapes clearly visible
- Documentation links and navigation
- Missing documentation for new features

## [2.0.0] - 2024-09-17

### Added
- **Feedback System**: Complete user feedback collection and analytics
- **Premium Permissions**: Comprehensive premium feature protection
- **Personal Memory System**: Individual user memory management
- **Advanced Dream Analysis**: Deep psychological pattern analysis
- **Stripe Integration**: Complete payment processing system
- **Comprehensive Testing**: Full test suite with 70+ tests
- **Documentation**: Complete user and developer guides

### Changed
- **Architecture**: Migrated to serverless AWS architecture
- **Authentication**: Enhanced Cognito integration
- **UI/UX**: Improved responsive design and accessibility
- **Performance**: Optimized frontend and backend performance

### Fixed
- Authentication flow issues
- Data persistence problems
- UI responsiveness on mobile devices
- API error handling

## [1.0.0] - 2024-08-23

### Added
- **Core Dream Journal**: Basic dream recording and storage
- **AI Dream Analysis**: Initial AI-powered dream interpretation
- **Theme Recognition**: Basic theme identification
- **Dream Heatmap**: Calendar visualization of dream frequency
- **User Authentication**: AWS Cognito integration
- **Responsive Design**: Mobile and desktop optimization
- **Dark/Light Themes**: Theme switching capability

### Technical
- React 18 with TypeScript frontend
- Python Flask backend
- AWS Lambda serverless architecture
- DynamoDB for data storage
- S3 for file storage
- API Gateway for routing

---

## Version History

- **v2.0.0**: Major release with premium features, feedback system, and comprehensive documentation
- **v1.0.0**: Initial release with core dream journaling functionality

## Release Notes

### v2.0.0 Release Notes

This major release introduces premium features, a comprehensive feedback system, and enhanced user experience:

**New Features:**
- Premium subscription system with Stripe integration
- Advanced dream analysis with psychological insights
- Personal memory management system
- User feedback collection and analytics
- Enhanced security and permissions

**Improvements:**
- Better performance and scalability
- Improved user interface and experience
- Comprehensive testing and documentation
- Enhanced accessibility features

**Breaking Changes:**
- Updated API endpoints for premium features
- Changed authentication flow for enhanced security
- Modified data storage structure for better performance

### v1.0.0 Release Notes

Initial release of Dream Companion App with core functionality:

**Core Features:**
- Dream journaling and storage
- AI-powered dream interpretation
- Theme analysis and visualization
- User authentication and profiles
- Responsive web interface

**Technical Foundation:**
- Modern React/TypeScript frontend
- Python Flask backend
- AWS serverless architecture
- Comprehensive testing setup

---

## Contributing

When contributing to this project, please update this changelog with your changes:

1. Add your changes to the "Unreleased" section
2. Use the format specified above
3. Include breaking changes, new features, bug fixes, and improvements
4. Update the version number when releasing

## Links

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Releases](https://github.com/samjhill/dream-companion/releases)
