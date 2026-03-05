/**
 * CartItem model — represents a product in the shopping cart with quantity
 */
export class CartItem {
  constructor(product, quantity = 1) {
    this.product = product;
    this.quantity = quantity;
  }

  /**
   * Calculate line total (price × quantity)
   */
  get lineTotal() {
    return this.product.price * this.quantity;
  }

  /**
   * Format line total as currency
   */
  get formattedTotal() {
    return `$${this.lineTotal.toFixed(2)}`;
  }

  /**
   * Increment quantity (respecting stock limit)
   */
  increment() {
    if (this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  /**
   * Decrement quantity (minimum 1)
   */
  decrement() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  /**
   * Convert to plain object for localStorage serialization
   */
  toJSON() {
    return {
      productId: this.product.id,
      quantity: this.quantity
    };
  }
}
