/**
 * Formatter utilities — helpers for displaying data consistently
 */

/**
 * Format a number as USD currency
 * @param {number} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Truncate text to a maximum character length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Capitalize first letter of string
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format category name (replace hyphens/underscores with spaces, capitalize)
 * @param {string} category
 * @returns {string}
 */
export function formatCategory(category) {
  return category
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Format rating as star display (e.g., "⭐⭐⭐⭐☆")
 * @param {number} rating - 0 to 5
 * @returns {string}
 */
export function formatRating(rating) {
  if (!rating || rating < 0) return 'Not rated';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let stars = '⭐'.repeat(fullStars);
  if (hasHalfStar && fullStars < 5) {
    stars += '✨'; // Half star placeholder
  }
  stars += '☆'.repeat(5 - Math.ceil(rating));
  
  return stars;
}

/**
 * Format date to readable string (MM/DD/YYYY)
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}
