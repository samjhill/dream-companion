# Personal Memory Management System

## Overview

This is a **personal memory management system** designed for individual users to manage their own memories, traits, and life context. It's **NOT** an admin dashboard - each user can only see and manage their own personal data.

## Features

### 🧠 Personal Memory Profile
- **User-specific data**: Each user's memories are stored with their unique user ID
- **Private and secure**: Only the authenticated user can access their own data
- **Premium feature**: Requires an active premium subscription

### 📝 Three Main Categories

#### 1. **Memories**
- Personal observations, insights, experiences, and reflections
- Categorized by type (observation, insight, experience, reflection)
- Importance levels (low, medium, high)
- Timestamp tracking

#### 2. **Traits**
- Personal personality traits and characteristics
- Confidence levels for each trait
- Helps Clara understand the user better

#### 3. **Life Context**
- **Life Events**: Important events in the user's life
- **Goals & Aspirations**: Personal goals and aspirations
- Importance levels and source tracking

## Technical Implementation

### Frontend Components

- **`PersonalMemoryManager.tsx`**: Main component with tabbed interface
- **`MemoryCard.tsx`**: Displays individual memory/trait/context items
- **`AddMemoryForm.tsx`**: Form for adding new items
- **CSS files**: Styled components with dark/light theme support

### Backend Integration

- Uses existing `/api/memories/user/{userId}` endpoints
- Requires Cognito authentication
- Requires premium subscription
- Stores data in DynamoDB table `dream-companion-memories`

### User Experience

- **Clear personal focus**: All language emphasizes "your" and "personal"
- **Intuitive interface**: Tabbed navigation with clear icons
- **Responsive design**: Works on desktop and mobile
- **Error handling**: Clear error messages and retry options
- **Loading states**: Smooth loading indicators

## Security & Privacy

- **Authentication required**: Users must be logged in
- **Premium gated**: Only premium users can access
- **User isolation**: Each user can only access their own data
- **No admin features**: No way to view other users' data

## Usage

1. User navigates to "Memory Management" tab (🧠 icon)
2. System checks authentication and premium status
3. User can add/edit memories, traits, and life context
4. Data is stored securely in DynamoDB
5. Information helps personalize dream interpretations

## Key Differences from Admin Dashboard

| Feature | Personal System | Admin Dashboard |
|---------|----------------|-----------------|
| **Data Access** | Own data only | All users' data |
| **Purpose** | Personal memory management | User management |
| **UI Focus** | "Your memories" | "All users" |
| **Permissions** | Premium users only | Admin only |
| **Data Scope** | Individual user | System-wide |

This system is designed to help users build a personal memory profile that enhances their dream interpretation experience with Clara.
