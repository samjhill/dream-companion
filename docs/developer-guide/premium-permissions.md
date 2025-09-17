# Premium Permissions Setup

This document outlines the comprehensive premium permissions system that has been implemented to properly lock users out of premium features.

## 🎯 Overview

The premium permissions system ensures that only users with active premium subscriptions can access advanced dream analysis features. The system includes both backend API protection and frontend UI controls.

## 🔧 Backend Implementation

### 1. Premium Module (`src/app/premium.py`)

**Key Functions:**
- `require_premium()` - Decorator for protecting premium routes
- `is_premium_user()` - Check if user has active premium subscription
- `check_premium_access()` - Get detailed premium status information
- `get_premium_table()` - DynamoDB table management

**Features:**
- ✅ Real-time subscription status checking
- ✅ Detailed error messages with upgrade URLs
- ✅ Comprehensive premium status information
- ✅ Automatic table creation if needed

### 2. Dream Analysis Protection (`src/app/dream_analysis.py`)

**Protected Endpoints:**
- `/api/analysis/advanced/<phone_number>` - Advanced dream analysis
- `/api/analysis/archetypes/<phone_number>` - Dream archetype analysis  
- `/api/analysis/patterns/<phone_number>` - Psychological pattern analysis

**New Endpoint:**
- `/api/analysis/premium-status/<phone_number>` - Public premium status check

**Features:**
- ✅ All advanced analysis routes protected with `@require_premium`
- ✅ Proper error handling for premium access violations
- ✅ Public endpoint for frontend premium status checks

### 3. Stripe Integration Updates (`src/app/stripe_integration.py`)

**Webhook Handlers Updated:**
- `handle_subscription_created()` - Creates premium user record
- `handle_subscription_deleted()` - Removes premium access
- `handle_payment_succeeded()` - Extends premium access

**Features:**
- ✅ Automatic premium status updates on subscription events
- ✅ Proper subscription duration calculation
- ✅ Error handling and logging

## 🎨 Frontend Implementation

### 1. Premium Status Hook (`frontend/src/hooks/usePremiumStatus.ts`)

**Features:**
- ✅ Real-time premium status fetching
- ✅ Loading and error states
- ✅ Automatic refetch capability
- ✅ TypeScript interfaces for type safety

### 2. Premium Gate Component (`frontend/src/components/PremiumGate.tsx`)

**Features:**
- ✅ Conditional rendering based on premium status
- ✅ Beautiful upgrade prompt for non-premium users
- ✅ Customizable feature descriptions
- ✅ Direct link to premium upgrade page

### 3. Advanced Dream Analysis Updates (`frontend/src/components/AdvancedDreamAnalysis.tsx`)

**Features:**
- ✅ Wrapped with PremiumGate component
- ✅ Enhanced error handling for 403 responses
- ✅ Graceful degradation for non-premium users

### 4. App Navigation Updates (`frontend/src/App.tsx`)

**Features:**
- ✅ Premium status integration in navigation
- ✅ Visual indicators for premium features
- ✅ Disabled state for locked features
- ✅ Premium badges and active indicators

### 5. Premium Styling (`frontend/src/App.css`)

**New CSS Classes:**
- `.premium-feature` - Base premium feature styling
- `.premium-locked` - Locked premium features
- `.premium-badge` - Premium upgrade badges
- `.premium-active` - Active premium indicators
- `.premium-upgrade-card` - Upgrade prompt styling

## 🔒 Security Features

### 1. Backend Protection
- ✅ All premium endpoints protected with decorators
- ✅ Real-time subscription validation
- ✅ Proper HTTP status codes (403 for premium required)
- ✅ Detailed error messages with upgrade URLs

### 2. Frontend Protection
- ✅ UI-level access control
- ✅ Graceful error handling
- ✅ User-friendly upgrade prompts
- ✅ Visual indicators for premium status

### 3. Data Integrity
- ✅ DynamoDB table with proper schema
- ✅ Automatic subscription status updates
- ✅ Webhook-based real-time updates
- ✅ Error handling and logging

## 🧪 Testing

### Test Script (`test_premium_permissions.py`)

**Test Coverage:**
- ✅ Premium status endpoint functionality
- ✅ Premium-protected endpoint blocking
- ✅ Subscription creation and management
- ✅ Access control verification
- ✅ Cleanup procedures

**Usage:**
```bash
python test_premium_permissions.py
```

## 📋 Premium Features List

### Basic Features (Free)
- Basic dream storage
- Basic dream interpretations
- Dream journal access
- Theme exploration

### Premium Features (Paid)
- 🔍 Advanced Dream Analysis
- 🏛️ Dream Archetype Analysis
- 📈 Psychological Pattern Recognition
- 📊 Historical Trend Analysis
- 💡 Personalized Insights & Recommendations

## 🚀 Deployment Notes

### Environment Variables Required
- `PREMIUM_TABLE_NAME` - DynamoDB table for premium users
- `STRIPE_SECRETS_ARN` - AWS Secrets Manager ARN for Stripe keys

### AWS Permissions Required
- DynamoDB read/write access for premium table
- S3 access for dream storage
- Secrets Manager access for Stripe configuration

### Frontend Build
- No additional environment variables needed
- Premium status fetched dynamically from API

## 🔄 Workflow

### User Journey
1. **Free User** - Can access basic features, sees premium upgrade prompts
2. **Upgrade** - User subscribes via Stripe checkout
3. **Webhook** - Stripe webhook updates DynamoDB premium status
4. **Access** - User immediately gains access to premium features
5. **Expiry** - Premium access automatically expires based on subscription

### Admin Monitoring
- Premium status changes logged to console
- Webhook events tracked
- Error handling with detailed logging
- Test script for verification

## 🎉 Benefits

### For Users
- Clear understanding of premium vs free features
- Smooth upgrade experience
- Immediate access after payment
- Beautiful, intuitive UI

### For Business
- Proper revenue protection
- Clear feature differentiation
- Automated subscription management
- Comprehensive access control

### For Developers
- Clean, maintainable code
- Comprehensive error handling
- Easy to extend and modify
- Well-documented system

## 🔧 Maintenance

### Regular Tasks
- Monitor webhook delivery
- Check premium status accuracy
- Review error logs
- Test subscription flows

### Updates
- Add new premium features by wrapping with `@require_premium`
- Update frontend with new premium components
- Extend test coverage as needed
- Monitor Stripe webhook reliability

---

**Status: ✅ Complete and Ready for Production**

The premium permissions system is now fully implemented and ready to protect your premium features while providing a smooth user experience for both free and premium users.
