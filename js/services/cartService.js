import { CONFIG } from '../config.js';
import { CartItem } from '../models/CartItem.js';
import { fetchProductById } from './apiService.js';

/**
 * Cart Service — manages all cart state and localStorage persistence
 * Emits custom events for UI listeners to react to cart changes
 */

class CartService {
  constructor() {
    this.items = []; // Array of CartItem instances
    this.loadFromStorage();
  }

  /**
   * Add a product to cart or increment quantity if already present
   * @param {Product} product
   * @param {number} quantity
   */
  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      if (existingItem.quantity > product.stock) {
        existingItem.quantity = product.stock;
      }
    } else {
      this.items.push(new CartItem(product, quantity));
    }

    this.saveToStorage();
    this.emitChange();
  }

  /**
   * Remove a product from cart by product ID
   * @param {number} productId
   */
  removeItem(productId) {
    this.items = this.items.filter(item => item.product.id !== productId);
    this.saveToStorage();
    this.emitChange();
  }

  /**
   * Update quantity of an item in cart
   * @param {number} productId
   * @param {number} quantity
   */
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.product.id === productId);
    if (item) {
      item.quantity = Math.max(1, Math.min(quantity, item.product.stock));
      this.saveToStorage();
      this.emitChange();
    }
  }

  /**
   * Get all cart items
   * @returns {CartItem[]}
   */
  getItems() {
    return this.items;
  }

  /**
   * Get total number of items in cart (sum of quantities)
   * @returns {number}
   */
  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get total price of all items
   * @returns {number}
   */
  getCartTotal() {
    return this.items.reduce((total, item) => total + item.lineTotal, 0);
  }

  /**
   * Get formatted cart total
   * @returns {string}
   */
  getFormattedTotal() {
    return `$${this.getCartTotal().toFixed(2)}`;
  }

  /**
   * Calculate tax (simple 10% for demo)
   * @returns {number}
   */
  calculateTax(taxRate = 0.1) {
    return this.getCartTotal() * taxRate;
  }

  /**
   * Calculate shipping (flat $5 or free over $100)
   * @returns {number}
   */
  calculateShipping() {
    return this.getCartTotal() >= 100 ? 0 : 5;
  }

  /**
   * Get order summary with subtotal, tax, shipping
   * @returns {Object}
   */
  getOrderSummary() {
    const subtotal = this.getCartTotal();
    const tax = this.calculateTax();
    const shipping = this.calculateShipping();
    const total = subtotal + tax + shipping;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2),
      itemCount: this.getItemCount()
    };
  }

  /**
   * Clear all items from cart
   */
  clearCart() {
    this.items = [];
    this.saveToStorage();
    this.emitChange();
  }

  /**
   * Check if cart is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Save cart to localStorage
   */
  saveToStorage() {
    try {
      const cartData = this.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
      localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  /**
   * Load cart from localStorage
   * Note: This loads product IDs and quantities, but full Product objects
   * need to be fetched from the API to fully reconstruct CartItems
   */
  async loadFromStorage() {
    try {
      const cartData = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
      if (cartData) {
        const savedItems = JSON.parse(cartData);
        this.items = [];

        // Reconstruct CartItems by fetching full product data
        for (const savedItem of savedItems) {
          try {
            const product = await fetchProductById(savedItem.productId);
            this.items.push(new CartItem(product, savedItem.quantity));
          } catch (error) {
            console.warn(`Could not load product ${savedItem.productId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      this.items = [];
    }
  }

  /**
   * Emit custom event to notify listeners of cart changes
   */
  emitChange() {
    const event = new CustomEvent('cartChanged', {
      detail: {
        itemCount: this.getItemCount(),
        total: this.getCartTotal()
      }
    });
    window.dispatchEvent(event);
  }
}

// Export singleton instance
export const cartService = new CartService();
