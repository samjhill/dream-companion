import { fetchUserAttributes } from 'aws-amplify/auth';

/**
 * Retrieves the user's phone number from their Cognito user attributes
 * @returns Promise<string | undefined> - The user's phone number or undefined if not found
 */
export async function getUserPhoneNumber(): Promise<string | undefined> {
  try {
    const attributes = await fetchUserAttributes();
    return attributes.phone_number;
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    return undefined;
  }
}