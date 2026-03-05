/**
 * Main Home Page Script
 * Handles product listing, filtering, sorting, and cart interactions
 */

import { fetchProducts, fetchCategories, fetchProductById } from './services/apiService.js';
import { cartService } from './services/cartService.js';
import {
  renderProductGrid,
  renderLoadingState,
  renderErrorState,
  renderCategoryFilter,
  updateCartBadge,
  showToast,
  showLoadingOverlay
} from './utils/render.js';

// State
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSort = 'featured';
let currentPage = 1;
let itemsPerPage = 12;

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const categoryFilters = document.getElementById('categoryFilters');
const sortSelect = document.getElementById('sortSelect');
const limitSelect = document.getElementById('limitSelect');
const pagination = document.getElementById('pagination');
const productModal = document.getElementById('productModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const cartBadge = document.querySelector('.cart-badge');
const shopNowBtn = document.getElementById('shopNowBtn');

/**
 * Initialize the home page
 */
async function init() {
  try {
    // Load initial data
    await Promise.all([loadCategories(), loadProducts()]);

    // Update cart badge on load
    updateCartBadge(cartService.getItemCount());

    // Setup event listeners
    setupEventListeners();

    // Listen for cart changes
    window.addEventListener('cartChanged', (e) => {
      updateCartBadge(e.detail.itemCount);
    });
  } catch (error) {
    console.error('Error initializing app:', error);
    renderErrorState(productsGrid, 'Failed to load products. Please refresh the page.');
  }
}

/**
 * Load categories and render filter buttons
 */
async function loadCategories() {
  try {
    const categories = await fetchCategories();
    renderCategoryFilter(categories, categoryFilters, currentCategory);
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Load all products from API
 */
async function loadProducts() {
  renderLoadingState(productsGrid, 12);

  try {
    const products = await fetchProducts({ category: currentCategory });
    allProducts = products;
    applyFiltersAndSort();
  } catch (error) {
    console.error('Error loading products:', error);
    renderErrorState(productsGrid, 'Failed to load products. Please try again.');
  }
}

/**
 * Apply current filters and sorting to products
 */
function applyFiltersAndSort() {
  // Start with all products
  filteredProducts = [...allProducts];

  // Apply sorting
  filteredProducts = sortProducts(filteredProducts, currentSort);

  // Render products with pagination
  renderPaginatedProducts();
}

/**
 * Sort products based on current sort option
 */
function sortProducts(products, sortBy) {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'featured':
    default:
      return sorted;
  }
}

/**
 * Render products with pagination
 */
function renderPaginatedProducts() {
  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(start, end);

  // Render products grid
  renderProductGrid(paginatedProducts, productsGrid);

  // Render pagination controls
  renderPaginationControls(totalPages);

  // Add event listeners to product cards
  attachProductCardListeners();
}

/**
 * Render pagination buttons
 */
function renderPaginationControls(totalPages) {
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}">← Previous</button>`;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage ? 'active' : '';
    paginationHTML += `<button class="pagination-btn ${isActive}" data-page="${i}">${i}</button>`;
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}">Next →</button>`;
  }

  pagination.innerHTML = paginationHTML;

  // Add event listeners
  document.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPaginatedProducts();
      productsGrid.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/**
 * Attach event listeners to product cards
 */
function attachProductCardListeners() {
  // Add to cart buttons
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const productId = parseInt(btn.dataset.productId);
      const product = allProducts.find(p => p.id === productId);

      if (product) {
        cartService.addItem(product, 1);
        showToast(`${product.name} added to cart!`, 'success');
      }
    });
  });

  // Product card clicks (open modal)
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-add-to-cart')) return; // Don't open modal if add to cart was clicked

      const productId = parseInt(card.dataset.productId);
      await showProductDetail(productId);
    });
  });
}

/**
 * Show product detail in modal
 */
async function showProductDetail(productId) {
  try {
    const product = await fetchProductById(productId);

    const detailHTML = `
      <div class="product-detail">
        <div class="detail-image">
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="detail-info">
          <h2>${product.name}</h2>
          <p class="detail-category">${product.category}</p>
          <div class="detail-rating">
            <span class="stars">${'⭐'.repeat(Math.floor(product.rating))}${product.rating % 1 !== 0 ? '✨' : ''}</span>
            <span>(${product.ratingCount} reviews)</span>
          </div>
          <p class="detail-price">${product.formattedPrice}</p>
          <p class="detail-description">${product.description}</p>
          <p class="detail-stock ${product.isInStock ? 'in-stock' : 'out-of-stock'}">
            ${product.isInStock ? '✓ In Stock' : 'Out of Stock'}
          </p>
          <div class="detail-actions">
            <button class="btn-primary" id="modalAddToCart" ${!product.isInStock ? 'disabled' : ''}>
              ${product.isInStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button class="btn-secondary" id="modalClose">Close</button>
          </div>
        </div>
      </div>
    `;

    modalBody.innerHTML = detailHTML;
    productModal.classList.add('active');

    // Event listeners for modal
    document.getElementById('modalAddToCart').addEventListener('click', () => {
      cartService.addItem(product, 1);
      showToast(`${product.name} added to cart!`, 'success');
      productModal.classList.remove('active');
    });

    document.getElementById('modalClose').addEventListener('click', () => {
      productModal.classList.remove('active');
    });
  } catch (error) {
    console.error('Error loading product detail:', error);
    showToast('Failed to load product details', 'error');
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Category filter
  categoryFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      // Update category and reload
      currentCategory = e.target.dataset.category;
      currentPage = 1;
      loadProducts();
    }
  });

  // Sort select
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Items per page
  limitSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Shop now button
  shopNowBtn.addEventListener('click', () => {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });

  // Modal close
  closeModal.addEventListener('click', () => {
    productModal.classList.remove('active');
  });

  // Click outside modal to close
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      productModal.classList.remove('active');
    }
  });
}

// Initialize on page load
init();
