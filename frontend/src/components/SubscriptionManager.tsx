import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';

interface SubscriptionStatus {
  is_premium: boolean;
  subscription_type: string | null;
  subscription_end: string | null;
  features: string[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 9.99,
    duration: 1,
    features: [
      'Advanced Dream Analysis',
      'Psychological Pattern Recognition',
      'Dream Archetype Identification',
      'Historical Trend Analysis',
      'Personalized Dream Reports',
      'Priority Support'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Premium',
    price: 24.99,
    duration: 3,
    features: [
      'All Monthly Features',
      'Quarterly Progress Reports',
      'Advanced Pattern Insights',
      'Custom Dream Categories'
    ],
    popular: true
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 89.99,
    duration: 12,
    features: [
      'All Quarterly Features',
      'Annual Dream Summary',
      'Personalized Growth Tracking',
      'Exclusive Dream Analysis Tools',
      '2 Months Free'
    ]
  }
];

const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

export const SubscriptionManager: React.FC = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();
      
      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/premium/subscription/status/${phoneNumber.replace("+", "")}`,
        { headers: { 'Authorization': `Bearer ${session?.tokens?.accessToken}` } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription status: ${response.status}`);
      }
      
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      setError("Failed to load subscription status. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);
      setError(null);
      
      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();
      
      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        setError("Invalid plan selected.");
        return;
      }
      
      // Create Stripe checkout session
      const response = await fetch(
        `${API_BASE_URL}/api/stripe/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.tokens?.accessToken}`
          },
          body: JSON.stringify({
            plan_type: planId,
            phone_number: phoneNumber.replace("+", ""),
            success_url: `${window.location.origin}/app/premium?success=true`,
            cancel_url: `${window.location.origin}/app/premium?canceled=true`
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
      
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to create checkout session. Please try again later.");
    } finally {
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();
      
      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }
      
      // Create Stripe customer portal session
      const response = await fetch(
        `${API_BASE_URL}/api/stripe/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.tokens?.accessToken}`
          },
          body: JSON.stringify({
            phone_number: phoneNumber.replace("+", ""),
            return_url: `${window.location.origin}/app/premium`
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create portal session: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.portal_url;
      
    } catch (error) {
      console.error("Error creating portal session:", error);
      setError("Failed to access subscription management. Please try again later.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const session = await fetchAuthSession();
      const phoneNumber = await getUserPhoneNumber();
      
      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/premium/subscription/cancel/${phoneNumber.replace("+", "")}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.tokens?.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to cancel subscription: ${response.status}`);
      }
      
      // Refresh subscription status
      await fetchSubscriptionStatus();
      
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setError("Failed to cancel subscription. Please try again later.");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Check for success/cancel messages from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success) {
      // Refresh subscription status after successful payment
      fetchSubscriptionStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (canceled) {
      setError("Subscription was canceled. You can try again anytime.");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="subscription-manager">
        <div className="section-header">
          <h2>Premium Subscription</h2>
          <p className="text-muted">Loading subscription status...</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-manager">
        <div className="section-header">
          <h2>Premium Subscription</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={fetchSubscriptionStatus}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-manager">
      <div className="section-header">
        <h2>Premium Subscription</h2>
        <p className="text-muted">
          Unlock advanced dream analysis and insights
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <div className="current-subscription">
          <div className={`status-card ${subscriptionStatus.is_premium ? 'premium' : 'basic'}`}>
            <div className="status-header">
              <h3>
                {subscriptionStatus.is_premium ? '🌟 Premium Active' : '📱 Basic Plan'}
              </h3>
              {subscriptionStatus.is_premium && (
                <span className="status-badge">Active</span>
              )}
            </div>
            
            {subscriptionStatus.is_premium ? (
              <div className="subscription-details">
                <p><strong>Plan:</strong> {subscriptionStatus.subscription_type}</p>
                <p><strong>Expires:</strong> {formatDate(subscriptionStatus.subscription_end || '')}</p>
                <div className="features-list">
                  <h4>Your Premium Features:</h4>
                  <ul>
                    {subscriptionStatus.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="subscription-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleManageSubscription}
                    disabled={processing}
                  >
                    {processing ? 'Loading...' : 'Manage Subscription'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleCancelSubscription}
                    disabled={processing}
                  >
                    {processing ? 'Cancelling...' : 'Cancel Subscription'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="basic-features">
                <p>You currently have access to basic features:</p>
                <ul>
                  <li>✓ Dream storage and basic interpretations</li>
                  <li>✓ Theme analysis</li>
                  <li>✓ Basic dream journaling</li>
                </ul>
                <p className="upgrade-text">
                  Upgrade to Premium for advanced insights and analysis!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {!subscriptionStatus?.is_premium && (
        <div className="subscription-plans">
          <h3>Choose Your Premium Plan</h3>
          <div className="plans-grid">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div 
                key={plan.id} 
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">Most Popular</div>
                )}
                
                <div className="plan-header">
                  <h4>{plan.name}</h4>
                  <div className="plan-price">
                    <span className="price">${plan.price}</span>
                    <span className="period">
                      /{plan.duration === 1 ? 'month' : plan.duration === 3 ? 'quarter' : 'year'}
                    </span>
                  </div>
                </div>
                
                <div className="plan-features">
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <button 
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Subscribe to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Benefits */}
      <div className="premium-benefits">
        <h3>What You Get with Premium</h3>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">🔍</div>
            <h4>Advanced Dream Analysis</h4>
            <p>Deep psychological insights and pattern recognition across your entire dream history.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">🧠</div>
            <h4>Psychological Patterns</h4>
            <p>Identify recurring themes and emotional patterns that reveal your inner landscape.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">🏛️</div>
            <h4>Dream Archetypes</h4>
            <p>Discover universal dream symbols and their personal meanings in your life.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">📊</div>
            <h4>Historical Trends</h4>
            <p>Track how your dreams evolve over time and identify personal growth patterns.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">📝</div>
            <h4>Personalized Reports</h4>
            <p>Get customized insights and recommendations based on your unique dream patterns.</p>
          </div>
          
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h4>Actionable Insights</h4>
            <p>Transform dream insights into practical steps for personal growth and self-awareness.</p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <h4>🔒 Secure Payment Processing</h4>
        <p>
          All payments are processed securely through Stripe, a trusted payment processor used by millions of businesses worldwide. 
          Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  );
};
