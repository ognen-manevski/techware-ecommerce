/**
 * Product model — normalizes API response to consistent shape
 */
export class Product {
  constructor(rawData) {
    // Map from Fake Store API field names to our standard names
    this.id = rawData.id;
    this.name = rawData.title;
    this.price = rawData.price;
    this.description = rawData.description;
    this.category = rawData.category;
    this.image = rawData.image;
    this.rating = rawData.rating?.rate ?? 0;
    this.ratingCount = rawData.rating?.count ?? 0;
    this.stock = 100; // Fake Store API doesn't provide stock, so we default to 100
  }

  /**
   * Check if product is in stock
   */
  get isInStock() {
    return this.stock > 0;
  }

  /**
   * Format price as currency string
   */
  get formattedPrice() {
    return `$${this.price.toFixed(2)}`;
  }

  /**
   * Truncate description to first 150 characters
   */
  get shortDescription() {
    if (this.description.length > 150) {
      return `${this.description.slice(0, 150)}…`;
    }
    return this.description;
  }

  /**
   * Return formatted rating (e.g., "4.5★" or "No ratings")
   */
  get formattedRating() {
    return this.rating > 0 ? `${this.rating}★` : 'No ratings';
  }
}
