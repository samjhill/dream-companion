import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumGate } from './PremiumGate';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

// Mock the usePremiumStatus hook
vi.mock('../hooks/usePremiumStatus');

const mockUsePremiumStatus = vi.mocked(usePremiumStatus);

describe('PremiumGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has premium access', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: true },
      loading: false,
      error: null
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByTestId('premium-content')).toBeInTheDocument();
    expect(screen.getByText('Premium Content')).toBeInTheDocument();
  });

  it('shows loading state when checking premium status', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: null,
      loading: true,
      error: null
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Checking premium status...')).toBeInTheDocument();
    expect(screen.getByTestId('premium-gate-loading')).toHaveClass('premium-gate-loading');
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    const errorMessage = 'Failed to load premium status';
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: null,
      loading: false,
      error: errorMessage
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText(`Error loading premium status: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByTestId('premium-gate-error')).toHaveClass('premium-gate-error');
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
  });

  it('shows premium gate when user does not have premium access', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: false },
      loading: false,
      error: null
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Premium Feature')).toBeInTheDocument();
    expect(screen.getByText('this feature requires a premium subscription to access advanced dream analysis features.')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
  });

  it('shows custom feature name in premium gate message', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: false },
      loading: false,
      error: null
    });

    render(
      <PremiumGate feature="Advanced Dream Analysis">
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Advanced Dream Analysis requires a premium subscription to access advanced dream analysis features.')).toBeInTheDocument();
  });

  it('shows premium features list', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: false },
      loading: false,
      error: null
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByText('Premium features include:')).toBeInTheDocument();
    expect(screen.getByText('🔍 Advanced Dream Analysis')).toBeInTheDocument();
    expect(screen.getByText('🏛️ Dream Archetype Analysis')).toBeInTheDocument();
    expect(screen.getByText('📈 Psychological Pattern Recognition')).toBeInTheDocument();
    expect(screen.getByText('📊 Historical Trend Analysis')).toBeInTheDocument();
    expect(screen.getByText('💡 Personalized Insights & Recommendations')).toBeInTheDocument();
  });

  it('renders fallback content when user does not have premium and fallback is provided', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: false },
      loading: false,
      error: null
    });

    render(
      <PremiumGate fallback={<div data-testid="fallback-content">Fallback Content</div>}>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    mockUsePremiumStatus.mockReturnValue({
      premiumStatus: { has_premium: false },
      loading: false,
      error: null
    });

    render(
      <PremiumGate>
        <div data-testid="premium-content">Premium Content</div>
      </PremiumGate>
    );

    const upgradeButton = screen.getByText('Upgrade to Premium');
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton.closest('a')).toHaveAttribute('href', '/app/premium');
  });
});
