import { format, parseISO } from 'date-fns';

// Define the type for a Dream object
interface Dream {
  createdAt: string;
}

// Define the type for the dream data
type DreamData = {
  [date: string]: number;
};

/**
 * Function to process the array of dreams and return a DreamData object
 * where the keys are the dates and the values are the count of dreams for that day.
 * 
 * @param dreams - Array of dream objects with createdAt property
 * @returns DreamData - Object mapping each date (yyyy-MM-dd) to the number of dreams
 */
export const processDreamsForHeatmap = (dreams: Dream[]): DreamData => {
  // Initialize an empty object to store the dream counts by date
  const dreamData: DreamData = {};

  // Iterate over the dreams array
  dreams.forEach((dream) => {
    // Parse the createdAt property into a Date object
    const dreamDate = parseISO(dream.createdAt);

    // Format the date as yyyy-MM-dd
    const dateStr = format(dreamDate, 'yyyy-MM-dd');

    // Increment the count for that date
    if (dreamData[dateStr]) {
      dreamData[dateStr] += 1;
    } else {
      dreamData[dateStr] = 1;
    }
  });

  return dreamData;
};
