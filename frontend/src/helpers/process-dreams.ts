import { format, parseISO } from 'date-fns';

/**
 * Interface for a Dream object with creation date
 */
interface Dream {
  createdAt: string;
}

/**
 * Type for dream data mapping dates to dream counts
 */
type DreamData = Record<string, number>;

/**
 * Validates if a dream object has the required properties
 * @param dream - Dream object to validate
 * @returns boolean - True if dream is valid
 */
const isValidDream = (dream: unknown): dream is Dream => {
  return (
    typeof dream === 'object' &&
    dream !== null &&
    'createdAt' in dream &&
    typeof (dream as Dream).createdAt === 'string'
  );
};

/**
 * Processes an array of dreams and returns a mapping of dates to dream counts
 * for use in heatmap visualization
 *
 * @param dreams - Array of dream objects with createdAt property
 * @returns DreamData - Object mapping each date (yyyy-MM-dd) to the number of dreams
 *
 * @example
 * ```typescript
 * const dreams = [
 *   { createdAt: '2024-05-24T10:30:00Z' },
 *   { createdAt: '2024-05-24T15:45:00Z' },
 *   { createdAt: '2024-05-25T08:20:00Z' }
 * ];
 * const result = processDreamsForHeatmap(dreams);
 * // Result: { '2024-05-24': 2, '2024-05-25': 1 }
 * ```
 */
export const processDreamsForHeatmap = (dreams: Dream[]): DreamData => {
  const dreamData: DreamData = {};

  if (!Array.isArray(dreams)) {
    console.warn('processDreamsForHeatmap: dreams parameter is not an array');
    return dreamData;
  }

  dreams.forEach((dream, index) => {
    if (!isValidDream(dream)) {
      console.warn(`processDreamsForHeatmap: Invalid dream at index ${index}:`, dream);
      return;
    }

    try {
      const dreamDate = parseISO(dream.createdAt);

      // Check if date is valid
      if (isNaN(dreamDate.getTime())) {
        console.warn(`processDreamsForHeatmap: Invalid date format at index ${index}:`, dream.createdAt);
        return;
      }

      const dateStr = format(dreamDate, 'yyyy-MM-dd');
      dreamData[dateStr] = (dreamData[dateStr] || 0) + 1;
    } catch (error) {
      console.warn(`processDreamsForHeatmap: Error processing dream at index ${index}:`, dream.createdAt, error);
    }
  });

  return dreamData;
};
