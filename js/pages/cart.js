/**
 * Shopping Cart Page Script
 * Handles cart display, quantity updates, and item removal
 */

import { cartService } from '../services/cartService.js';
import { renderCartItems, renderCartSummary, updateCartBadge, showToast } from '../utils/render.js';

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const cartSummaryContainer = document.getElementById('cartSummary');
const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
const cartBadge = document.querySelector('.cart-badge');

/**
 * Initialize cart page
 */
async function init() {
  try {
    // Load cart from storage
    await cartService.loadFromStorage();

    // Initial render
    renderCart();

    // Setup event listeners
    setupEventListeners();

    // Listen for cart changes (in case cart was modified in another tab)
    window.addEventListener('cartChanged', renderCart);
  } catch (error) {
    console.error('Error initializing cart page:', error);
    showToast('Error loading cart', 'error');
  }
}

/**
 * Render cart items and summary
 */
function renderCart() {
  const items = cartService.getItems();
  const summary = cartService.getOrderSummary();

  renderCartItems(items, cartItemsContainer);
  renderCartSummary(summary, cartSummaryContainer);
  updateCartBadge(cartService.getItemCount());

  // Attach event listeners to dynamically rendered elements
  attachCartEventListeners();

  // Update checkout button state
  proceedCheckoutBtn.disabled = cartService.isEmpty();
}

/**
 * Attach event listeners to cart items
 */
function attachCartEventListeners() {
  // Remove buttons
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = parseInt(btn.dataset.productId);
      cartService.removeItem(productId);
      showToast('Item removed from cart', 'info');
      renderCart();
    });
  });

  // Quantity decrease buttons
  document.querySelectorAll('.btn-qty-decrease').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.productId);
      const item = cartService.getItems().find(i => i.product.id === productId);
      if (item) {
        item.decrement();
        cartService.saveToStorage();
        cartService.emitChange();
        renderCart();
      }
    });
  });

  // Quantity increase buttons
  document.querySelectorAll('.btn-qty-increase').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = parseInt(btn.dataset.productId);
      const item = cartService.getItems().find(i => i.product.id === productId);
      if (item) {
        item.increment();
        cartService.saveToStorage();
        cartService.emitChange();
        renderCart();
      }
    });
  });

  // Quantity input fields
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const productId = parseInt(input.dataset.productId);
      let quantity = parseInt(e.target.value);

      // Validate quantity
      if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
      }

      const item = cartService.getItems().find(i => i.product.id === productId);
      if (item && quantity <= item.product.stock) {
        cartService.updateQuantity(productId, quantity);
        renderCart();
      } else {
        e.target.value = item.quantity; // Reset if invalid
        showToast('Invalid quantity', 'error');
      }
    });
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  proceedCheckoutBtn.addEventListener('click', () => {
    if (!cartService.isEmpty()) {
      window.location.href = 'checkout.html';
    }
  });
}

// Initialize on page load
init();
