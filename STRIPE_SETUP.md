# Stripe Integration Setup Guide

## Overview
This guide will help you set up Stripe payment processing for your Dream Companion App's premium subscriptions.

## Prerequisites
1. A Stripe account (create one at https://stripe.com)
2. AWS SAM CLI installed and configured
3. Your Flask app deployed on AWS Lambda

## Step 1: Configure Stripe Dashboard

### 1.1 Get Your API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **API keys**
3. Copy your **Secret key** (starts with `sk_`)
4. Copy your **Publishable key** (starts with `pk_`) - you'll need this for the frontend

### 1.2 Create Subscription Products
1. Go to **Products** in your Stripe Dashboard
2. Click **Add product**
3. Create three products:
   - **Monthly Premium** (recurring monthly)
   - **Quarterly Premium** (recurring every 3 months)
   - **Yearly Premium** (recurring yearly)
4. Set your desired prices
5. Copy the **Price ID** for each product (starts with `price_`)

### 1.3 Set Up Webhook Endpoint
1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-api-gateway-url.amazonaws.com/Prod/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 2: Update Environment Variables

### 2.1 For Local Development
1. Copy `src/env.example` to `src/.env`
2. Fill in your Stripe values:
   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
   STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
   STRIPE_QUARTERLY_PRICE_ID=price_your_quarterly_price_id
   STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
   ```

### 2.2 For AWS Deployment
1. Update your `samconfig.toml` file with these parameters:
   ```toml
   [default.deploy.parameters]
   parameter_overrides = "StripeSecretKey=sk_test_your_key StripeWebhookSecret=whsec_your_secret StripeMonthlyPriceId=price_monthly StripeQuarterlyPriceId=price_quarterly StripeYearlyPriceId=price_yearly"
   ```

## Step 3: Test Your Configuration

### 3.1 Local Testing
```bash
cd src
python test_stripe.py
```

This will verify:
- All environment variables are set
- Stripe API connection works
- Price IDs are valid

### 3.2 Test the API Endpoint
```bash
curl -X POST 'http://localhost:8888/api/stripe/create-checkout-session' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your_jwt_token' \
  -d '{
    "plan_type": "quarterly",
    "phone_number": "1234567890",
    "success_url": "https://clarasdreamguide.com/app/premium?success=true",
    "cancel_url": "https://clarasdreamguide.com/app/premium?canceled=true"
  }'
```

## Step 4: Deploy to AWS

### 4.1 Build and Deploy
```bash
sam build
sam deploy --guided
```

When prompted, enter your Stripe parameter values.

### 4.2 Verify Deployment
1. Check CloudWatch logs for any errors
2. Test the endpoint with your production URL
3. Verify webhook delivery in Stripe Dashboard

## Step 5: Frontend Integration

### 5.1 Update Frontend Configuration
Make sure your frontend is calling the correct endpoint:
```typescript
const response = await fetch('/api/stripe/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    plan_type: 'quarterly',
    phone_number: userPhone,
    success_url: 'https://clarasdreamguide.com/app/premium?success=true',
    cancel_url: 'https://clarasdreamguide.com/app/premium?canceled=true'
  })
});
```

### 5.2 Handle Success/Cancel URLs
- **Success URL**: Redirect user to premium features
- **Cancel URL**: Show cancellation message

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check CloudWatch logs
   - Verify all environment variables are set
   - Ensure Stripe API key is valid

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check Authorization header format

3. **Invalid Price ID**
   - Verify price IDs exist in Stripe Dashboard
   - Check environment variable values

4. **Webhook Failures**
   - Verify webhook endpoint URL is correct
   - Check webhook secret matches
   - Ensure endpoint is publicly accessible

### Debug Mode
The updated code includes extensive logging. Check CloudWatch logs for:
- Authentication status
- Request data validation
- Stripe API responses
- Error details

## Security Notes

1. **Never expose your Stripe secret key** in frontend code
2. **Use environment variables** for all sensitive data
3. **Verify webhook signatures** (already implemented)
4. **Validate all input data** (already implemented)
5. **Use HTTPS** in production

## Support

If you encounter issues:
1. Check CloudWatch logs first
2. Verify Stripe Dashboard configuration
3. Test with the provided test script
4. Check Stripe's [API documentation](https://stripe.com/docs/api)

## Next Steps

After successful setup:
1. Test subscription creation
2. Verify webhook handling
3. Test subscription management
4. Monitor payment processing
5. Set up Stripe Analytics for insights
