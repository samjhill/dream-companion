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
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
};