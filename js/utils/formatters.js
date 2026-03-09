//  Formatter utilities — helpers for displaying data consistently

//  Format a number as USD currency
export function formatPrice(num) {
    return `$${num.toFixed(2)}`;
}

//  Capitalize first letter of string
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Prepend ../ to root-relative image paths (for pages one level deep in /pages/)
export function imgSrc(src) {
    if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('../')) return src;
    return `../${src}`;
}
