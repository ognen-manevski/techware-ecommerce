import { formatPrice } from '../utils/formatters.js';
import { addItem, updateCartBadge } from '../services/cartService.js';

// Shipping cost tiers match shippingInfo from Product.js
function getShippingCost(weight) {
    if (!weight) return null;       // no data → disable
    if (weight < 0.5) return 4.99;  // standard mail
    if (weight < 5)   return 9.99;  // courier
    return 24.99;                    // freight
}

// Images in the JSON are root-relative (e.g. "techware-api/imgs/...").
// This page lives one level deep in /pages/, so prepend ../
function imgSrc(src) {
    if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('../')) return src;
    return `../${src}`;
}

export function renderProductDetails(product) {
    document.title = `${product.name} — Axion Techware`;
    document.getElementById('breadcrumb-product').textContent = product.name;

    const container = document.getElementById('product-details-container');
    container.innerHTML = renderLayout(product);

    setupGallery();
    setupShipping(product);
    setupAddToCart(product);
    updateCartBadge();
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function renderLayout(product) {
    return `
        <div class="row g-4 g-lg-5">
            <div class="col-lg-5">
                ${renderImages(product)}
            </div>
            <div class="col-lg-7">
                ${renderInfo(product)}
                <hr class="my-4">
                ${renderSpecsTable(product)}
                ${product.comments?.length ? `<hr class="my-4">${renderComments(product.comments)}` : ''}
            </div>
        </div>`;
}

// ─── Left: Images ─────────────────────────────────────────────────────────────

function renderImages(product) {
    const mainSrc = imgSrc(product.images?.main || product.thumbnail);
    const gallery = product.images?.gallery;

    return `
        <div class="position-sticky" style="top: 5rem;">
            <div class="border rounded p-3 bg-white text-center">
                <img id="main-product-image" src="${mainSrc}" alt="${product.name}"
                     class="img-fluid" style="max-height: 400px; object-fit: contain;">
            </div>
            ${gallery?.length ? `
            <div class="d-flex gap-2 mt-3 flex-wrap" id="gallery-thumbnails">
                <button class="gallery-thumb active-thumb" data-src="${mainSrc}" type="button">
                    <img src="${mainSrc}" alt="Main">
                </button>
                ${gallery.map(src => `
                <button class="gallery-thumb" data-src="${imgSrc(src)}" type="button">
                    <img src="${imgSrc(src)}" alt="${product.name}">
                </button>`).join('')}
            </div>` : ''}
        </div>`;
}

// ─── Right: Info ──────────────────────────────────────────────────────────────

function renderInfo(product) {
    const isOnSale = !!product.compareAtPrice;
    const shippingCost = getShippingCost(product.weight);

    return `
        <!-- Badges -->
        <div class="d-flex gap-2 mb-3 flex-wrap">
            ${isOnSale ? `<span class="badge bg-danger fs-6">Sale${product.discountPercent ? ` — ${product.discountPercent}% OFF` : ''}</span>` : ''}
            ${product.isNew && !isOnSale ? `<span class="badge bg-success fs-6">New</span>` : ''}
            <span class="badge ${product.isInStock ? 'bg-primary' : 'bg-secondary'} fs-6">
                ${product.isInStock ? `${product.stock} in stock` : 'Out of Stock'}
            </span>
        </div>

        <!-- Title + Brand -->
        <h1 class="fs-2 fw-bold mb-1">${product.name}</h1>
        <p class="text-muted mb-3">by <strong>${product.brand}</strong></p>

        <!-- Stars -->
        <div class="d-flex align-items-center gap-2 mb-3">
            <div class="stars">
                <span class="txt-stars" style="--fill: ${(product.rating.rate / 5 * 100).toFixed(1)}%">★★★★★</span>
            </div>
            <span class="small fw-semibold">${product.rating.rate}</span>
            <span class="text-muted small">(${product.rating.count} reviews)</span>
        </div>

        <!-- Short description -->
        <p class="lead mb-3">${product.shortDescription}</p>

        <!-- Category chips -->
        <div class="d-flex gap-2 flex-wrap mb-4">
            ${product.categoryIds?.map(c => `<span class="badge bg-primary">${c}</span>`).join('') || ''}
        </div>

        <!-- Price -->
        <div class="mb-4">
            ${isOnSale ? `<div class="text-muted fs-5"><s>${formatPrice(product.compareAtPrice)}</s></div>` : ''}
            <div class="fs-1 fw-bold text-primary">${formatPrice(product.price)}</div>
        </div>

        <!-- Shipping + Total -->
        <div class="border rounded p-3 mb-4 bg-light">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" id="shipping-toggle" role="switch"
                           ${shippingCost === null ? 'disabled' : ''}>
                    <label class="form-check-label fw-semibold" for="shipping-toggle">
                        Add Shipping
                        <span class="text-muted fw-normal small ms-1">${product.shippingInfo}</span>
                    </label>
                </div>
                <span class="text-muted" id="shipping-price-label" style="display: none;">
                    ${shippingCost !== null ? `+${formatPrice(shippingCost)}` : ''}
                </span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">Total</span>
                <span class="fs-4 fw-bold text-primary" id="price-total">${formatPrice(product.price)}</span>
            </div>
        </div>

        <!-- Add to Cart -->
        <button class="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                id="add-to-cart-btn" ${product.isInStock ? '' : 'disabled'}>
            <span class="material-symbols-outlined">shopping_cart</span>
            ${product.isInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>`;
}

// ─── Specs table ─────────────────────────────────────────────────────────────

function renderSpecsTable(product) {
    const rows = [];

    // Standard product metadata first
    rows.push(['SKU', product.sku]);
    rows.push(['Brand', product.brand]);
    if (product.weight) rows.push(['Weight', product.formattedWeight]);
    if (product.warrantyMonths) rows.push(['Warranty', product.formattedWarranty]);
    rows.push(['Shipping', product.shippingInfo]);

    // Dynamic specs object
    if (product.specs && typeof product.specs === 'object') {
        Object.entries(product.specs).forEach(([key, val]) => {
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .replace(/^./, s => s.toUpperCase());
            rows.push([label, val]);
        });
    }

    return `
        <h2 class="fs-4 fw-bold mb-3">Specifications</h2>
        <table class="table table-bordered table-sm table-hover mb-0">
            <tbody>
                ${rows.map(([key, val]) => `
                <tr>
                    <th class="text-muted fw-normal" style="width: 35%;">${key}</th>
                    <td>${val}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        ${product.description ? `
        <h2 class="fs-4 fw-bold mt-4 mb-3">Description</h2>
        <p class="text-muted">${product.description}</p>` : ''}`;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function renderComments(comments) {
    return `
        <h2 class="fs-4 fw-bold mb-3">Reviews <span class="text-muted fw-normal">(${comments.length})</span></h2>
        <div class="d-flex flex-column gap-3">
            ${comments.map(renderComment).join('')}
        </div>`;
}

function renderComment(comment) {
    const rating = comment.rating ?? null;
    const fill = rating ? ((rating / 5) * 100).toFixed(1) : null;
    const author = comment.author || comment.user || 'Anonymous';
    const text = comment.text || comment.body || comment.comment || '';
    const date = comment.date ? new Date(comment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

    return `
        <div class="card p-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong>${author}</strong>
                ${fill ? `<div class="stars"><span class="txt-stars" style="--fill: ${fill}%">★★★★★</span></div>` : ''}
            </div>
            ${date ? `<div class="text-muted small mb-2">${date}</div>` : ''}
            <p class="mb-0">${text}</p>
        </div>`;
}

// ─── Interactivity ───────────────────────────────────────────────────────────

function setupGallery() {
    const thumbs = document.querySelectorAll('.gallery-thumb');
    const mainImg = document.getElementById('main-product-image');
    if (!thumbs.length || !mainImg) return;

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            mainImg.src = thumb.dataset.src;
            thumbs.forEach(t => t.classList.remove('active-thumb'));
            thumb.classList.add('active-thumb');
        });
    });
}

function setupAddToCart(product) {
    const btn = document.getElementById('add-to-cart-btn');
    if (!btn || !product.isInStock) return;

    btn.addEventListener('click', () => {
        addItem(product);
        updateCartBadge();
        btn.textContent = ' Added!';
        btn.prepend((() => { const i = document.createElement('span'); i.className = 'material-symbols-outlined'; i.textContent = 'check'; return i; })());
        btn.disabled = true;
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">shopping_cart</span> Add to Cart';
        }, 1500);
    });
}

function setupShipping(product) {
    const toggle = document.getElementById('shipping-toggle');
    const totalEl = document.getElementById('price-total');
    const shippingLabel = document.getElementById('shipping-price-label');
    if (!toggle || !totalEl) return;

    const shippingCost = getShippingCost(product.weight);

    toggle.addEventListener('change', () => {
        const total = toggle.checked ? product.price + shippingCost : product.price;
        totalEl.textContent = formatPrice(total);
        shippingLabel.style.display = toggle.checked ? 'inline' : 'none';
    });
}
