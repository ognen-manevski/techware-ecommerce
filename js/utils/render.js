import { formatPrice, truncateText, formatCategory, formatRating } from './formatters.js';

/**
 * Render utilities — all DOM manipulation functions
 * These are pure functions that return HTML strings or update DOM elements
 */

/**
 * Render a single product card HTML
 * @param {Product} product
 * @returns {string} HTML
 */
export function renderProductCard(product) {
  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.name}" class="product-image" />
        ${product.isInStock ? '' : '<span class="out-of-stock">OUT OF STOCK</span>'}
      </div>
      <div class="product-info">
        <h3 class="product-name">${truncateText(product.name, 50)}</h3>
        <p class="product-category">${formatCategory(product.category)}</p>
        <p class="product-description">${product.shortDescription}</p>
        <div class="product-rating">
          <span class="stars">${formatRating(product.rating)}</span>
          <span class="rating-count">(${product.ratingCount})</span>
        </div>
        <div class="product-footer">
          <span class="product-price">${product.formattedPrice}</span>
          <button class="btn-add-to-cart" data-product-id="${product.id}" ${!product.isInStock ? 'disabled' : ''}>
            ${product.isInStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render product grid (multiple product cards)
 * @param {Product[]} products
 * @param {HTMLElement} container
 */
export function renderProductGrid(products, container) {
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No products found</p></div>';
    return;
  }

  container.innerHTML = products.map(product => renderProductCard(product)).join('');
}

/**
 * Render a loading skeleton (multiple placeholder cards)
 * @param {HTMLElement} container
 * @param {number} count
 */
export function renderLoadingState(container, count = 12) {
  if (!container) return;

  const skeletons = Array(count).fill(null).map(() => `
    <div class="product-card skeleton">
      <div class="skeleton-image"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-description"></div>
      <div class="skeleton-footer"></div>
    </div>
  `).join('');

  container.innerHTML = skeletons;
}

/**
 * Render error message
 * @param {HTMLElement} container
 * @param {string} message
 */
export function renderErrorState(container, message = 'Something went wrong. Please try again.') {
  if (!container) return;
  
  container.innerHTML = `
    <div class="error-state">
      <p class="error-icon">⚠️</p>
      <p class="error-message">${message}</p>
      <button class="btn-retry">Retry</button>
    </div>
  `;
}

/**
 * Render cart items list
 * @param {CartItem[]} cartItems
 * @param {HTMLElement} container
 */
export function renderCartItems(cartItems, container) {
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <p class="empty-icon">🛒</p>
        <p class="empty-text">Your cart is empty</p>
        <a href="/index.html" class="btn-continue-shopping">Continue Shopping</a>
      </div>
    `;
    return;
  }

  container.innerHTML = cartItems.map(item => `
    <div class="cart-item" data-product-id="${item.product.id}">
      <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-image" />
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.product.name}</h4>
        <p class="cart-item-price">${item.product.formattedPrice}</p>
      </div>
      <div class="cart-item-quantity">
        <button class="btn-qty-decrease" data-product-id="${item.product.id}">−</button>
        <input 
          type="number" 
          class="qty-input" 
          value="${item.quantity}" 
          min="1" 
          max="${item.product.stock}"
          data-product-id="${item.product.id}"
        />
        <button class="btn-qty-increase" data-product-id="${item.product.id}">+</button>
      </div>
      <div class="cart-item-total">
        <p>${item.formattedTotal}</p>
      </div>
      <button class="btn-remove" data-product-id="${item.product.id}">✕</button>
    </div>
  `).join('');
}

/**
 * Render cart summary with totals
 * @param {Object} summary - from cartService.getOrderSummary()
 * @param {HTMLElement} container
 */
export function renderCartSummary(summary, container) {
  if (!container) return;

  container.innerHTML = `
    <div class="order-summary">
      <div class="summary-row">
        <span>Subtotal (${summary.itemCount} items):</span>
        <span>${formatPrice(summary.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping:</span>
        <span>${formatPrice(summary.shipping)}</span>
      </div>
      <div class="summary-row">
        <span>Tax (10%):</span>
        <span>${formatPrice(summary.tax)}</span>
      </div>
      <div class="summary-row summary-total">
        <span>Total:</span>
        <span>${formatPrice(summary.total)}</span>
      </div>
    </div>
  `;
}

/**
 * Render category filter buttons
 * @param {string[]} categories
 * @param {HTMLElement} container
 * @param {string} activeCategory
 */
export function renderCategoryFilter(categories, container, activeCategory = 'all') {
  if (!container) return;

  container.innerHTML = categories.map(category => `
    <button 
      class="filter-btn ${category === activeCategory ? 'active' : ''}" 
      data-category="${category}"
    >
      ${formatCategory(category)}
    </button>
  `).join('');
}

/**
 * Update cart badge with item count
 * @param {number} count
 */
export function updateCartBadge(count) {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Show toast notification
 * @param {string} message
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation (add class after a frame)
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show loading spinner overlay
 * @param {boolean} show
 */
export function showLoadingOverlay(show = true) {
  let overlay = document.querySelector('.loading-overlay');
  
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  } else {
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
}
