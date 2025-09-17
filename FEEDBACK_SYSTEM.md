# Feedback System Documentation

## Overview

The Dream Companion App now includes a comprehensive feedback system that allows users to provide thumbs up/down ratings and optional text comments. The system stores feedback data in DynamoDB and provides both user-facing components and admin analytics.

## Features

### User Features
- **Thumbs Up/Down Rating**: Simple binary rating system
- **Optional Text Comments**: Users can provide detailed feedback (up to 1000 characters)
- **Feedback Categories**: Users can categorize their feedback (general, feature request, bug report, UI, performance, other)
- **Multiple Access Points**: Feedback can be accessed via:
  - Floating button (bottom-right corner)
  - Minimal button in header
  - Inline component for embedding in specific sections

### Admin Features
- **Feedback Analytics**: View satisfaction rates, feedback counts, and type breakdowns
- **User Feedback History**: View individual user feedback (with proper access controls)
- **Statistics Dashboard**: Track overall app satisfaction and trends

## Technical Implementation

### Backend (Python/Flask)

#### API Endpoints
- `POST /api/feedback/submit` - Submit new feedback
- `GET /api/feedback/user/{user_id}` - Get user's feedback history
- `GET /api/feedback/stats` - Get feedback statistics (admin)

#### Database Schema
**Table**: `dream-companion-feedback`

**Primary Key**: `feedback_id` (String)

**Attributes**:
- `feedback_id`: Unique identifier (UUID)
- `user_id`: User's phone number (normalized)
- `rating`: 'thumbs_up' or 'thumbs_down'
- `comment`: Optional text feedback
- `type`: Feedback category
- `created_at`: ISO timestamp
- `user_agent`: Browser information
- `ip_address`: User's IP (for analytics)

**Global Secondary Index**: `user-feedback-index`
- Partition Key: `user_id`
- Sort Key: `created_at`

### Frontend (React/TypeScript)

#### Components
- `FeedbackForm`: Main feedback form component
- `FeedbackButton`: Reusable button component with multiple variants
- `FeedbackForm.css`: Styling with dark theme support
- `FeedbackButton.css`: Button styling with responsive design

#### Integration Points
- **App Header**: Minimal feedback button
- **Floating Button**: Always-visible feedback access
- **Modal Overlay**: Full-screen feedback form

## Usage Examples

### Basic Feedback Submission
```typescript
// User clicks thumbs up with comment
{
  rating: 'thumbs_up',
  comment: 'Love the dream analysis feature!',
  type: 'feature'
}
```

### Admin Analytics
```json
{
  "total_feedback": 150,
  "thumbs_up": 120,
  "thumbs_down": 30,
  "satisfaction_rate": 80.0,
  "type_breakdown": {
    "general": 50,
    "feature": 40,
    "bug": 30,
    "ui": 20,
    "performance": 10
  },
  "recent_feedback_30_days": 25
}
```

## Security & Privacy

- **Authentication Required**: All feedback endpoints require valid Cognito authentication
- **User Access Control**: Users can only view their own feedback history
- **Data Sanitization**: Sensitive information (IP addresses) removed from user-facing responses
- **Input Validation**: All feedback data validated before storage

## Testing

The feedback system includes comprehensive tests covering:
- Database table creation and structure
- Data validation and sanitization
- Statistics calculation logic
- User access control validation
- Feedback type categorization

Run tests with:
```bash
python -m pytest src/tests/test_feedback.py -v
```

## Environment Variables

Add to your environment configuration:
```bash
FEEDBACK_TABLE_NAME=dream-companion-feedback
```

## Future Enhancements

Potential improvements for the feedback system:
- **Email Notifications**: Alert admins to negative feedback
- **Feedback Response**: Allow admins to respond to user feedback
- **Advanced Analytics**: Trend analysis, sentiment analysis
- **Feedback Widgets**: Embeddable feedback forms for specific features
- **User Satisfaction Tracking**: Track satisfaction over time per user
