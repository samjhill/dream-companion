import { fetchUserAttributes } from 'aws-amplify/auth';

// Cache for user attributes to avoid rate limiting
let userAttributesCache: Record<string, any> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

/**
 * Rate-limited wrapper for fetchUserAttributes with retry logic
 */
async function fetchUserAttributesWithRateLimit(): Promise<Record<string, any>> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  // Retry logic for rate limiting
  let retries = 3;
  while (retries > 0) {
    try {
      return await fetchUserAttributes();
    } catch (error: any) {
      if (error.name === 'TooManyRequestsException' && retries > 1) {
        console.warn(`Rate limited, retrying in ${retries * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
        retries--;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded for fetchUserAttributes');
}

/**
 * Retrieves the user's phone number from their Cognito user attributes with caching
 * @returns Promise<string | undefined> - The user's phone number or undefined if not found
 */
export async function getUserPhoneNumber(): Promise<string | undefined> {
  try {
    // Check cache first
    const now = Date.now();
    if (userAttributesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return userAttributesCache.phone_number;
    }

    // Fetch fresh data if cache is expired or empty
    const attributes = await fetchUserAttributesWithRateLimit();
    
    // Update cache
    userAttributesCache = attributes;
    cacheTimestamp = now;
    
    return attributes.phone_number;
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    
    // If we have cached data, return it even if it's stale
    if (userAttributesCache) {
      console.warn('Using stale cached user attributes due to error');
      return userAttributesCache.phone_number;
    }
    
    return undefined;
  }
}

/**
 * Retrieves all user attributes from Cognito with caching
 * @returns Promise<Record<string, string> | undefined> - User attributes or undefined if error
 */
export async function getUserAttributes(): Promise<Record<string, string> | undefined> {
  try {
    // Check cache first
    const now = Date.now();
    if (userAttributesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return userAttributesCache as Record<string, string>;
    }

    // Fetch fresh data if cache is expired or empty
    const attributes = await fetchUserAttributesWithRateLimit();
    
    // Update cache
    userAttributesCache = attributes;
    cacheTimestamp = now;
    
    return attributes as Record<string, string>;
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    
    // If we have cached data, return it even if it's stale
    if (userAttributesCache) {
      console.warn('Using stale cached user attributes due to error');
      return userAttributesCache as Record<string, string>;
    }
    
    return undefined;
  }
}

/**
 * Clear the user attributes cache (useful for logout or when user data changes)
 */
export function clearUserAttributesCache(): void {
  userAttributesCache = null;
  cacheTimestamp = 0;
}