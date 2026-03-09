//  Calculation utilities — helpers for computing values like shipping cost
 
import { formatPrice } from './formatters.js';
 
// to calc commpound weight of all cart items!
// returns shipping cost or n/a
export function shippingCost(distance, weight) {
    let basePrice = weightCategory(weight);
    switch (distance) {
        case 'sameCity': {
            return formatPrice(basePrice);
        }
        case 'sameCountry': {
            return formatPrice(basePrice * 2);
        }
        case 'neighboringCountry': {
            return formatPrice(basePrice * 3);
        }
        case 'international': {
            return formatPrice(basePrice * 4);
        }
        default:
            return 'N/A';
    }
}
//helper for weight category /shipping cost
export function weightCategory(weight) {
    if (weight == null) return null;
    if (weight < 0.5) return 5;
    else if (weight < 5) return 10;
    else return 50;
}