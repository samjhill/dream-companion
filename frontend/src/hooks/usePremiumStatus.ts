import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber } from '../helpers/user';

interface PremiumStatus {
  has_premium: boolean;
  subscription_type: string | null;
  subscription_end: string | null;
  days_remaining: number;
  features: string[];
}

interface PremiumStatusHook {
  premiumStatus: PremiumStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE_URL = "https://jj1rq9vx9l.execute-api.us-east-1.amazonaws.com/Prod";

export const usePremiumStatus = (): PremiumStatusHook => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPremiumStatus = async () => {
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
        { headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` } }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Premium endpoint doesn't exist yet, return default free status
          setPremiumStatus({
            has_premium: false,
            subscription_type: null,
            subscription_end: null,
            days_remaining: 0,
            features: []
          });
          return;
        }
        throw new Error(`Failed to fetch premium status: ${response.status}`);
      }

      const data = await response.json();
      setPremiumStatus(data);
    } catch (error) {
      console.error("Error fetching premium status:", error);
      setError("Failed to load premium status. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  return {
    premiumStatus,
    loading,
    error,
    refetch: fetchPremiumStatus
  };
};
