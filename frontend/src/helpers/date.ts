/**
 * Date formatting options for consistent date display across the application
 */
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',    // "Friday"
  year: 'numeric',    // "2024"
  month: 'long',      // "May"
  day: 'numeric',     // "24"
  hour: '2-digit',    // "04"
  minute: '2-digit',  // "34"
  second: '2-digit',  // "36"
  hour12: true,       // "PM"
};

/**
 * Formats a date string into a human-readable format
 * @param dateStr - ISO date string to format
 * @returns Formatted date string (e.g., "Friday, May 24, 2024 at 04:34:36 PM")
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
  } catch (error) {
    console.warn('Error formatting date:', dateStr, error);
    return 'Invalid date';
  }
};

/**
 * Formats a date string into a short format (e.g., "May 24, 2024")
 * @param dateStr - ISO date string to format
 * @returns Short formatted date string
 */
export const formatShortDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting short date:', dateStr, error);
    return 'Invalid date';
  }
};