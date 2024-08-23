// Options for formatting
const options: Intl.DateTimeFormatOptions = {
  weekday: 'long',  // "Friday"
  year: 'numeric',  // "2024"
  month: 'long',  // "May"
  day: 'numeric',  // "24"
  hour: '2-digit',  // "04"
  minute: '2-digit',  // "34"
  second: '2-digit',  // "36"
  hour12: true,  // "PM"
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', options);
};
