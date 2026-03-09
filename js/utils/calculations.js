//  Calculation utilities

// Returns the base shipping cost tier for a given weight in kg
export function weightCategory(weight) {
    if (weight == null) return null;
    if (weight < 0.5) return 5;
    else if (weight < 5) return 10;
    else return 50;
}