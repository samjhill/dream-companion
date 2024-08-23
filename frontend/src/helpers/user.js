import { fetchUserAttributes } from 'aws-amplify/auth';

export async function getUserPhoneNumber() {
    const attributes = await fetchUserAttributes();
    return attributes.phone_number;
  }