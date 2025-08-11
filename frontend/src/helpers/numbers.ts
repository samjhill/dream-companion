/**
 * Generates a random integer between 0 (inclusive) and the specified length (exclusive)
 * @param length - The upper bound for the random number generation
 * @returns A random integer between 0 and length-1
 */
export const generateRandomIndex = (length: number): number => {
  return Math.floor(Math.random() * length);
};

/**
 * Generates a random integer between 0 (inclusive) and the specified length (exclusive)
 * @param length - The upper bound for the random number generation
 * @returns A random integer between 0 and length-1
 */
export const generateRandomNumber = (length: number): number => {
  return Math.floor(Math.random() * length);
};