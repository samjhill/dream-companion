import React from 'react';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { Link } from 'react-router-dom';

interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  fallback,
  feature = "this feature"
}) => {
  const { premiumStatus, loading, error } = usePremiumStatus();

  if (loading) {
    return (
      <div className="premium-gate-loading" data-testid="premium-gate-loading">
        <div className="loading-spinner"></div>
        <p>Checking premium status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-gate-error" data-testid="premium-gate-error">
        <p>Error loading premium status: {error}</p>
      </div>
    );
  }

  if (!premiumStatus?.has_premium) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="premium-gate-blocked">
        <div className="premium-upgrade-card">
          <div className="premium-icon">💎</div>
          <h3>Premium Feature</h3>
          <p>
            {feature} requires a premium subscription to access advanced dream analysis features.
          </p>
          <div className="premium-features-list">
            <h4>Premium features include:</h4>
            <ul>
              <li>🔍 Advanced Dream Analysis</li>
              <li>🏛️ Dream Archetype Analysis</li>
              <li>📈 Psychological Pattern Recognition</li>
              <li>📊 Historical Trend Analysis</li>
              <li>💡 Personalized Insights & Recommendations</li>
            </ul>
          </div>
          <div className="premium-actions">
            <Link to="/app/premium" className="btn btn-primary">
              Upgrade to Premium
            </Link>
            <p className="premium-note">
              Start your journey to deeper dream understanding today!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
