import { CONFIG } from '../config.js';
import { Product } from '../models/Product.js';

/**
 * API Service — all fetch calls and data mapping live here
 */

/**
 * Fetch all products with optional filtering
 * @param {Object} options - { category, limit, skip }
 * @returns {Promise<Product[]>}
 */
export async function fetchProducts(options = {}) {
  const { category, limit = CONFIG.PRODUCTS_PER_PAGE, skip = 0 } = options;

  try {
    let url = `${CONFIG.API_BASE_URL}/products`;

    // If filtering by category, append to URL
    if (category && category !== 'all') {
      url += `/category/${category}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const rawProducts = await response.json();

    // Map raw API responses to Product model instances
    const products = rawProducts.map(raw => new Product(raw));

    // Apply client-side limit and skip for pagination
    return products.slice(skip, skip + limit);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 * @param {number} id
 * @returns {Promise<Product>}
 */
export async function fetchProductById(id) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/products/${id}`);

    if (!response.ok) {
      throw new Error(`Product not found: ${id}`);
    }

    const rawProduct = await response.json();
    return new Product(rawProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Fetch all available categories
 * @returns {Promise<string[]>}
 */
export async function fetchCategories() {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/products/categories`);

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const categories = await response.json();
    return ['all', ...categories]; // Prepend 'all' for "Show all products"
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Fetch products by category with pagination support
 * @param {string} category
 * @param {number} limit
 * @param {number} skip
 * @returns {Promise<Product[]>}
 */
export async function fetchProductsByCategory(category, limit = CONFIG.PRODUCTS_PER_PAGE, skip = 0) {
  return fetchProducts({ category, limit, skip });
}
