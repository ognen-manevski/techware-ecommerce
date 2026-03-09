import { getItems, getSubtotal, removeItem, updateQty, clearCart, updateCartBadge } from '../services/cartService.js';
import { formatPrice, imgSrc } from '../utils/formatters.js';
import { showToast } from '../utils/toast.js';

function render() {
    updateCartBadge();
    const items = getItems();
    const container = document.getElementById('cart-container');

    if (!items.length) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div style="opacity: 0.6;">
                    <div class="material-symbols-outlined text-muted mb-3" style="font-size: 10vw; opacity: 0.6;">shopping_cart</div>
                    <h2 class="fs-4 text-muted">Your cart is empty</h2>
                </div>
                <a href="../index.html" class="btn btn-primary mt-3">Continue Shopping</a>
            </div>`;
        return;
    }

    const subtotal = getSubtotal();

    container.innerHTML = `
        <div class="row g-4 align-items-start">

            <!-- ITEMS LIST -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-body p-0">
                        <table class="table table-hover mb-0 align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th style="width:5%"></th>
                                    <th>Product</th>
                                    <th class="text-center" style="width:15%">Qty</th>
                                    <th class="text-end" style="width:15%">Price</th>
                                    <th style="width:5%"></th>
                                </tr>
                            </thead>
                            <tbody id="cart-items">
                                ${items.map(renderRow).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-3">
                    <a href="../index.html" class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2">
                        <span class="material-symbols-outlined fs-6 align-middle">arrow_back</span>
                        Continue Shopping
                    </a>
                    <button class="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2" id="clear-cart-btn">
                        <span class="material-symbols-outlined fs-6 align-middle">delete</span>
                        Clear Cart
                    </button>
                </div>
            </div>

            <!-- ORDER SUMMARY -->
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-body">
                        <h2 class="fs-5 fw-bold mb-4">Order Summary</h2>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-muted">Subtotal</span>
                            <span>${formatPrice(subtotal)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="text-muted">Shipping</span>
                            <span class="text-muted small fst-italic">Calculated at checkout</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
                            <span>Total</span>
                            <span class="text-primary">${formatPrice(subtotal)}</span>
                        </div>
                        <a href="checkout.html" class="btn btn-primary btn-lg w-100 text-decoration-none">
                            Proceed to Checkout
                        </a>
                    </div>
                </div>
            </div>

        </div>`;

    setupEvents();
}

function renderRow(item) {
    const lineTotal = item.price * item.quantity;
    return `
        <tr data-sku="${item.sku}">
            <td class="ps-3">
                <img src="${imgSrc(item.thumbnail)}" alt="${item.name}"
                     style="width:56px;height:56px;object-fit:contain;">
            </td>
            <td>
                <div class="fw-semibold">${item.name}</div>
                <div class="text-muted small">${item.brand}</div>
                <div class="text-primary small">${item.formattedPrice} each</div>
            </td>
            <td class="text-center">
                <div class="d-flex align-items-center justify-content-center gap-1">
                    <button class="btn btn-sm btn-outline-secondary qty-btn" data-action="dec" data-sku="${item.sku}">−</button>
                    <span class="px-2 fw-semibold">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary qty-btn" data-action="inc" data-sku="${item.sku}">+</button>
                </div>
            </td>
            <td class="text-end fw-semibold">${item.formattedLineTotal}</td>
            <td class="text-end pe-3">
                <button class="btn btn-sm btn-outline-danger remove-btn d-flex align-items-center justify-content-center" style="height:2rem;" data-sku="${item.sku}">
                    <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
                </button>
            </td>
        </tr>`;
}

function setupEvents() {
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sku = btn.dataset.sku;
            const item = getItems().find(i => i.sku === sku);
            if (!item) return;
            updateQty(sku, btn.dataset.action === 'inc' ? item.quantity + 1 : item.quantity - 1);
            render();
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = getItems().find(i => i.sku === btn.dataset.sku);
            removeItem(btn.dataset.sku);
            if (item) showToast(`<strong>${item.name}</strong> removed from cart`, 'danger', 'delete');
            render();
        });
    });

    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
        clearCart();
        showToast('Cart cleared', 'warning', 'delete_sweep');
        render();
    });

    // Row click → product details (ignore qty/remove button clicks)
    document.querySelectorAll('#cart-items tr[data-sku]').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', (e) => {
            if (e.target.closest('.qty-btn, .remove-btn')) return;
            window.location.href = `product-details.html?sku=${encodeURIComponent(row.dataset.sku)}`;
        });
    });
}

render();

