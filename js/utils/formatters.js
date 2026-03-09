//  Formatter utilities — helpers for displaying data consistently

//  Format a number as USD currency
  export function formatPrice(num) {
    return `$${num.toFixed(2)}`;
  }

//  Capitalize first letter of string
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//  Format date to readable string (MM/DD/YYYY)
export function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}
