import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUserPhoneNumber, getUserAttributes, clearUserAttributesCache } from '../helpers/user';

interface UserData {
  phoneNumber: string | undefined;
  attributes: Record<string, string> | undefined;
  session: any;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Custom hook to manage user data with caching and rate limiting
 * This prevents multiple components from making duplicate calls to Cognito
 */
export const useUserData = (): UserData => {
  const [userData, setUserData] = useState<UserData>({
    phoneNumber: undefined,
    attributes: undefined,
    session: undefined,
    loading: true,
    error: null,
    refresh: () => {}
  });

  const fetchUserData = async () => {
    try {
      setUserData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch session and user data in parallel
      const [session, phoneNumber, attributes] = await Promise.all([
        fetchAuthSession(),
        getUserPhoneNumber(),
        getUserAttributes()
      ]);

      setUserData({
        phoneNumber,
        attributes,
        session,
        loading: false,
        error: null,
        refresh: refreshUserData
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data'
      }));
    }
  };

  const refreshUserData = () => {
    clearUserAttributesCache();
    fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return {
    ...userData,
    refresh: refreshUserData
  };
};
