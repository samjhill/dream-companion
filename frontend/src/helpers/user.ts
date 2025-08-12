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

/**
 * Retrieves all user attributes from Cognito
 * @returns Promise<Record<string, string> | undefined> - User attributes or undefined if error
 */
export async function getUserAttributes(): Promise<Record<string, string> | undefined> {
  try {
    const attributes = await fetchUserAttributes();
    return attributes as Record<string, string>;
  } catch (error) {
    console.error('Error fetching user attributes:', error);
    return undefined;
  }
}