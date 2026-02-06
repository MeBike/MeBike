/**
 * Format date to Vietnamese format without timezone conversion
 * @param dateString - ISO date string from backend (already in Vietnam timezone)
 * @returns Formatted date string in Vietnamese format
 */
export const formatDateVN = (dateString: string | Date): string => {
  const date = new Date(dateString);
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format date to short Vietnamese format (only date, no time)
 * @param dateString - ISO date string from backend
 * @returns Formatted date string (dd/mm/yyyy)
 */
export const formatDateOnlyVN = (dateString: string | Date): string => {
  const date = new Date(dateString);
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};
