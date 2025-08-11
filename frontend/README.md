# Dream Companion Frontend

A React TypeScript application for the Dream Companion App, providing an intuitive interface for users to track, analyze, and interpret their dreams.

## Features

- **Dream Journal**: Record and view your dreams with AI-powered interpretations
- **Theme Analysis**: Discover recurring patterns and themes in your dreams
- **Lucid Dream Guide**: Learn techniques for lucid dreaming
- **Waking Life Integration**: Connect dream insights to daily life
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Authentication**: Secure user authentication with AWS Cognito

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with CSS Variables and modern layout techniques
- **Authentication**: AWS Amplify
- **State Management**: React Hooks
- **Routing**: React Router DOM
- **UI Components**: Custom components with accessibility features
- **Date Handling**: date-fns library
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS account with Amplify configured

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure AWS Amplify:
   - Copy your `aws-exports.js` file to the `src` directory
   - Ensure your AWS Cognito user pool is properly configured

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── DreamList.tsx   # Dream journal component
│   ├── Greet.tsx       # Welcome component
│   ├── Themes.tsx      # Dream themes component
│   ├── HeatMap.tsx     # Dream frequency visualization
│   └── ...             # Other components
├── helpers/            # Utility functions
│   ├── date.ts         # Date formatting utilities
│   ├── numbers.ts      # Number utilities
│   ├── user.ts         # User-related utilities
│   └── process-dreams.ts # Dream processing utilities
├── assets/             # Static assets (images, icons)
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Component Architecture

The application follows a component-based architecture with:

- **Functional Components**: All components use React hooks and functional syntax
- **TypeScript Interfaces**: Proper type definitions for all props and state
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

## Styling

The application uses:
- CSS Custom Properties (variables) for consistent theming
- Modern CSS features like Grid, Flexbox, and CSS Variables
- Responsive design principles
- Smooth animations and transitions
- Consistent spacing and typography system

## State Management

State is managed using React hooks:
- `useState` for local component state
- `useEffect` for side effects and API calls
- Custom hooks for reusable logic

## API Integration

The frontend integrates with:
- AWS Cognito for authentication
- Custom backend API for dream data
- S3 for file storage

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules and configurations
- Use functional components with hooks
- Implement proper error handling
- Add accessibility features

### Component Structure
- One component per file
- Export components as named exports
- Use proper TypeScript interfaces
- Implement proper prop validation

### Error Handling
- Implement try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors for debugging
- Implement retry mechanisms where appropriate

## Testing

Run the test suite:
```bash
npm test
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Deployment

The frontend is automatically deployed when pushing to the main branch. The build process:

1. Compiles TypeScript to JavaScript
2. Bundles all assets using Vite
3. Optimizes and minifies the output
4. Deploys to the configured hosting service

## Contributing

1. Follow the established code style
2. Add proper TypeScript types
3. Include accessibility features
4. Test your changes thoroughly
5. Update documentation as needed

## Troubleshooting

### Common Issues

- **Build Errors**: Ensure all dependencies are installed and TypeScript is properly configured
- **Authentication Issues**: Verify AWS Amplify configuration and Cognito settings
- **API Errors**: Check network connectivity and API endpoint configuration

### Getting Help

- Check the console for error messages
- Verify environment variables and configuration
- Review AWS Amplify documentation
- Check the backend API status

## License

This project is part of the Dream Companion App and follows the same licensing terms.
