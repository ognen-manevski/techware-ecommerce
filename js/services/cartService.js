import { LocalStorageService } from './localStorageService.js';
import { CartItem } from '../models/CartItem.js';

const KEY = 'cart';

// localStorage stores plain objects — revive them as CartItem instances
function getCart() {
    const raw = LocalStorageService.getItem(KEY) || [];
    return raw.map(i => Object.assign(new CartItem(i, i.quantity), i));
}

function saveCart(cart) {
    LocalStorageService.setItem(KEY, cart);
    updateCartBadge();
}

// Add product to cart (or increment qty if already present)
// Accepts a plain product object with at least: sku, name, brand, price, thumbnail
export function addItem(product, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.sku === product.sku);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push(new CartItem(product, qty));
    }
    saveCart(cart);
}

export function removeItem(sku) {
    saveCart(getCart().filter(i => i.sku !== sku));
}

export function updateQty(sku, qty) {
    if (qty < 1) { removeItem(sku); return; }
    const cart = getCart();
    const item = cart.find(i => i.sku === sku);
    if (item) { item.quantity = qty; saveCart(cart); }
}

export function clearCart() {
    saveCart([]);
}

export function getItems() {
    return getCart();
}

export function getCount() {
    return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function getSubtotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

// Updates the cart count badge(s) in the navbar if present
export function updateCartBadge() {
    const badges = document.querySelectorAll('#cart-count');
    const count = getCart().reduce((sum, i) => sum + i.quantity, 0);
    badges.forEach(b => { b.textContent = count; });
}
