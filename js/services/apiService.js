import { CONFIG } from '../config.js';
import { Product, ProductDetails } from '../models/Product.js';
import { Category } from '../models/Category.js';

//get dynamic category values for filter dropdown
export async function fetchCategories() {
    return await fetch(`${CONFIG.API_BASE_URL}/categories.json`)
        .then(res => res.json()
            .then(categories => {
                return categories.map(cat => {
                    return new Category(cat);
                });
            }))
        .catch(err => err);
}

//get all products for cards
export async function fetchProducts() {
    return await fetch(`${CONFIG.API_BASE_URL}/products.json`)
        .then(res => res.json())
        .then(products => {
            return products.map(product => {
                return new Product(product);
            });
        })
        .catch(err => err);
}

//get product details for single product page
export async function fetchProductDetails(id) {
    return await fetch(`${CONFIG.API_BASE_URL}/products/${id}.json`)
        .then(res => res.json())
        .then(product => {
            return new ProductDetails(product);
        })
        .catch(err => err);
}
