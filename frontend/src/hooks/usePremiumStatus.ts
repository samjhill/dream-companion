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

      console.log("Premium Status Debug:", { 
        hasSession: !!session, 
        hasPhoneNumber: !!phoneNumber, 
        phoneNumber: phoneNumber 
      });

      if (!phoneNumber) {
        setError("No phone number found. Please check your profile settings.");
        return;
      }

      const url = `${API_BASE_URL}/api/premium/subscription/status/${phoneNumber.replace("+", "")}`;
      console.log("Fetching premium status from:", url);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session?.tokens?.idToken?.toString()}` }
      });

      console.log("Premium status response:", { 
        status: response.status, 
        ok: response.ok 
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Premium status API error:", errorText);
        throw new Error(`Failed to fetch premium status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Premium status data:", data);
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
