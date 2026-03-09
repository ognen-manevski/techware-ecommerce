import { getItems, getSubtotal, clearCart, updateCartBadge } from '../services/cartService.js';
import { weightCategory } from '../utils/calculations.js';
import { formatPrice, imgSrc } from '../utils/formatters.js';
import { CONFIG } from '../config.js';
import { sendConfirmationEmail } from '../services/emailService.js';
import { Customer } from '../models/Customer.js';
import { Address } from '../models/Address.js';
import { Order } from '../models/Order.js';
import { LocalStorageService } from '../services/localStorageService.js';

// ─────────────────────────────────────────────────────────────────────────────
// EMAILJS CONFIG — Bonus 2: Order Confirmation Email
// ─────────────────────────────────────────────────────────────────────────────
// 1. Sign up at https://www.emailjs.com/ (free tier works)
// 2. Create a service (Gmail, Outlook…)  →  copy the Service ID below
// 3. Create an email template.  Available template variables:
//      {{to_name}}           – customer's full name
//      {{to_email}}          – customer's email address
//      {{order_number}}      – generated order number  (e.g. AXN-1A2B3C)
//      {{#orders}}           – loop variable (array of items):
//          {{image_url}}         – absolute product image URL
//          {{name}}              – product name
//          {{units}}             – quantity
//          {{price}}             – formatted line total (e.g. $19.99)
//      {{/orders}}
//      {{subtotal}}          – formatted subtotal
//      {{tax}}               – formatted tax amount (18%)
//      {{shipping}}          – formatted shipping cost, "Free (Local Pickup)", or "Not included"
//      {{total}}             – formatted grand total
//      {{shipping_address}}  – full delivery address string
//      {{shipping_method}}   – chosen shipping method label (e.g. "Domestic")
// 4. Go to Account › API Keys  →  copy your Public Key below
// 5. Fill in EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID in js/config.js
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Shipping methods  (keys match calculations.js distance parameter)
// ─────────────────────────────────────────────────────────────────────────────
const TAX_RATE = 0.18; // 18% included in prices — extracted for display only

// Extracts the VAT already included in a price: amount × 0.18 / 1.18
function extractTax(amount) { return amount * TAX_RATE / (1 + TAX_RATE); }

const SHIPPING_METHODS = [
    { id: 'localPickup', label: 'Local Pickup', eta: 'Pick up in store', free: true },
    { id: 'sameCity', label: 'Same City', eta: '1–2 business days' },
    { id: 'sameCountry', label: 'Domestic', eta: '3–5 business days' },
    { id: 'neighboringCountry', label: 'Regional', eta: '5–10 business days' },
    { id: 'international', label: 'International', eta: '10–20 business days' },
];

const DISTANCE_MULTIPLIERS = { sameCity: 1, sameCountry: 2, neighboringCountry: 3, international: 4 };

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state
// ─────────────────────────────────────────────────────────────────────────────
let selectedShipping = 'sameCountry';
let includeShipping = true;

// ─────────────────────────────────────────────────────────────────────────────
// Form draft persistence — saves/restores step-1 fields across navigation
// ─────────────────────────────────────────────────────────────────────────────
const DRAFT_KEY = 'checkoutDraft';

function saveDraft() {
    const form = document.getElementById('step1-form');
    const get = id => form.querySelector(`#${id}`)?.value ?? '';
    LocalStorageService.setItem(DRAFT_KEY, {
        firstName: get('firstName'), lastName: get('lastName'),
        email:     get('email'),     phone:    get('phone'),
        street:    get('street'),    city:     get('city'),
        state:     get('state'),     zip:      get('zip'),
        country:   get('country'),
        shippingMethod: selectedShipping,
    });
}

function restoreDraft() {
    const draft = LocalStorageService.getItem(DRAFT_KEY);
    if (!draft) return;
    const form = document.getElementById('step1-form');
    const set = (id, val) => { const el = form.querySelector(`#${id}`); if (el && val) el.value = val; };
    ['firstName','lastName','email','phone','street','city','state','zip','country']
        .forEach(id => set(id, draft[id]));
    if (draft.shippingMethod) selectedShipping = draft.shippingMethod;
}

function clearDraft() {
    LocalStorageService.removeItem(DRAFT_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Sum of (weight × qty) for all cart items. Returns null if any item has no weight.
// weight is populated from data.weightKg for both the Product and ProductDetails models;
// null means the API did not provide weightKg for that item — a fallback is used in calcShippingAmount.
function getTotalWeight() {
    const items = getItems();
    if (!items.length || items.some(i => i.weight == null)) return null;
    return items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
}

// Numeric shipping cost for a method id. Returns 0 for Local Pickup.
function calcShippingAmount(methodId) {
    const method = SHIPPING_METHODS.find(m => m.id === methodId);
    if (method?.free) return 0;
    const weight = getTotalWeight() ?? 1;
    const base = weightCategory(weight);
    return base * (DISTANCE_MULTIPLIERS[methodId] ?? 1);
}

function generateOrderNumber() {
    return 'AXN-' + Date.now().toString(36).toUpperCase().slice(-6);
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
function updateStepIndicator(activeStep) {
    [1, 2, 3].forEach(n => {
        const circle = document.getElementById(`sc-${n}`);
        const label = document.getElementById(`sl-${n}`);
        circle.classList.remove('bg-primary', 'bg-success', 'bg-secondary');
        label.classList.remove('text-primary', 'text-success', 'text-muted', 'fw-semibold');

        if (n < activeStep) {
            // Completed step — green with checkmark
            circle.classList.add('bg-success');
            circle.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.1rem;">check</span>';
            label.classList.add('text-success', 'fw-semibold');
        } else if (n === activeStep) {
            // Active step — primary blue
            circle.classList.add('bg-primary');
            circle.textContent = n;
            label.classList.add('text-primary', 'fw-semibold');
        } else {
            // Upcoming step — grey
            circle.classList.add('bg-secondary');
            circle.textContent = n;
            label.classList.add('text-muted');
        }
    });

    const line12 = document.getElementById('line-1-2');
    const line23 = document.getElementById('line-2-3');
    line12.classList.toggle('border-success', activeStep > 1);
    line12.classList.toggle('border-secondary', activeStep <= 1);
    line23.classList.toggle('border-success', activeStep > 2);
    line23.classList.toggle('border-secondary', activeStep <= 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Customer Details + Shipping Method
// ─────────────────────────────────────────────────────────────────────────────
function renderShippingMethods() {
    const container = document.getElementById('shipping-methods-container');
    const totalWt = getTotalWeight();

    // Weight note above the options
    const weightNote = document.getElementById('weight-info-note');
    if (totalWt != null) {
        const display = totalWt < 1
            ? `${(totalWt * 1000).toFixed(0)} g`
            : `${totalWt.toFixed(2)} kg`;
        weightNote.textContent = `Prices based on total cart weight: ${display}`;
    } else {
        weightNote.textContent = 'Prices based on estimated weight (exact weight unavailable for some items).';
    }

    container.innerHTML = SHIPPING_METHODS.map(m => {
        const cost = calcShippingAmount(m.id);
        const active = m.id === selectedShipping;
        const costLabel = m.free ? '<span class="text-success fw-bold">Free</span>' : `<span class="fw-bold text-nowrap">${formatPrice(cost)}</span>`;
        return `
            <div class="shipping-option border rounded p-3 mb-3 ${active ? 'selected' : ''}"
                 data-method="${m.id}" role="button" tabindex="0" aria-pressed="${active}">
                <div class="d-flex align-items-center gap-3">
                    <input class="form-check-input mt-0 flex-shrink-0" type="radio"
                           name="shippingMethod" id="sm-${m.id}" value="${m.id}"
                           ${active ? 'checked' : ''}>
                    <label class="form-check-label w-100 d-flex justify-content-between align-items-center gap-2"
                           for="sm-${m.id}" style="cursor:pointer;">
                        <div>
                            <div class="fw-semibold">${m.label}</div>
                            <div class="text-muted small">${m.eta}</div>
                        </div>
                        ${costLabel}
                    </label>
                </div>
            </div>`;
    }).join('');

    // Toggle selection on card click or keyboard
    container.querySelectorAll('.shipping-option').forEach(card => {
        const select = () => {
            selectedShipping = card.dataset.method;
            container.querySelectorAll('.shipping-option').forEach(c => {
                c.classList.remove('selected');
                c.querySelector('input').checked = false;
                c.setAttribute('aria-pressed', 'false');
            });
            card.classList.add('selected');
            card.querySelector('input').checked = true;
            card.setAttribute('aria-pressed', 'true');
        };
        card.addEventListener('click', select);
        card.addEventListener('keydown', e => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(); }
        });
    });
}

function setupStep1() {
    restoreDraft();        // restore saved fields before rendering so shippingMethod is correct
    renderShippingMethods();

    const form = document.getElementById('step1-form');
    const nextBtn = document.getElementById('next-step1-btn');

    // Enable "Review Order" button only when all required fields pass
    const checkValidity = () => { nextBtn.disabled = !form.checkValidity(); };
    form.addEventListener('input', checkValidity);
    form.addEventListener('change', checkValidity);
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);
    checkValidity(); // initial disabled state

    form.addEventListener('submit', e => {
        e.preventDefault();
        form.classList.add('was-validated');
        if (!form.checkValidity()) return;
        goToStep(2);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Order Review
// ─────────────────────────────────────────────────────────────────────────────
function renderOrderReview() {
    const items = getItems();
    const subtotal = getSubtotal();
    const method = SHIPPING_METHODS.find(m => m.id === selectedShipping);
    const shipCost = calcShippingAmount(selectedShipping);
    const totalWt = getTotalWeight();

    // Read-only items table
    document.getElementById('review-items').innerHTML = items.map(item => `
        <tr>
            <td class="ps-3">
                <img src="${imgSrc(item.thumbnail)}" alt="${item.name}"
                     style="width:48px;height:48px;object-fit:contain;">
            </td>
            <td>
                <div class="fw-semibold">${item.name}</div>
                <div class="text-muted small">${item.brand}</div>
                <div class="text-primary small">${item.formattedPrice} each</div>
            </td>
            <td class="text-center">
                <span class="badge bg-secondary rounded-pill px-2 py-1">${item.quantity}</span>
            </td>
            <td class="text-end pe-3 fw-semibold">${item.formattedLineTotal}</td>
        </tr>`).join('');

    // Address recap — build Customer + Address for display
    const form = document.getElementById('step1-form');
    const get = id => (form.querySelector(`#${id}`)?.value ?? '').trim();
    const reviewCustomer = new Customer({ firstName: get('firstName'), lastName: get('lastName'), email: get('email'), phone: get('phone') });
    const reviewAddress  = new Address({ street: get('street'), city: get('city'), state: get('state'), zip: get('zip'), country: get('country') });
    document.getElementById('review-address').textContent =
        `${reviewCustomer.fullName} · ${reviewAddress.formatted}`;

    // Subtotal
    document.getElementById('review-subtotal').textContent = formatPrice(subtotal);

    // Tax (extracted from subtotal, informational)
    const tax = extractTax(subtotal);
    document.getElementById('review-tax').textContent = formatPrice(tax);

    // Shipping details
    const isPickup = method?.free;
    document.getElementById('shipping-method-label').textContent =
        isPickup ? 'Local Pickup' : `${method?.label ?? '—'} (${method?.eta ?? ''})`;
    document.getElementById('shipping-cost-display').textContent =
        isPickup ? 'Free' : formatPrice(shipCost);
    document.getElementById('shipping-weight-note').textContent = isPickup
        ? 'No shipping charge — collect in store.'
        : (totalWt != null
            ? `Total weight: ${totalWt < 1 ? (totalWt * 1000).toFixed(0) + ' g' : totalWt.toFixed(2) + ' kg'}`
            : 'Estimated weight used — exact data unavailable for some items.');

    // Sync shipping toggle — hide for Local Pickup
    const toggle = document.getElementById('shipping-toggle');
    const toggleRow = document.getElementById('shipping-toggle-row');
    if (isPickup) {
        toggleRow.classList.add('d-none');
        includeShipping = false;
    } else {
        toggleRow.classList.remove('d-none');
        toggle.checked = includeShipping;
        toggle.onchange = () => { includeShipping = toggle.checked; updateReviewTotal(); };
    }

    updateReviewTotal();
}

function updateReviewTotal() {
    const subtotal = getSubtotal();
    const shipCost = includeShipping ? calcShippingAmount(selectedShipping) : 0;
    document.getElementById('review-total').textContent = formatPrice(subtotal + shipCost);
}

function setupStep2() {
    document.getElementById('back-step2-btn').addEventListener('click', () => goToStep(1));
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
}

// ─────────────────────────────────────────────────────────────────────────────
// Order placement
// ─────────────────────────────────────────────────────────────────────────────
function placeOrder() {
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing…`;

    const form = document.getElementById('step1-form');
    const get = id => (form.querySelector(`#${id}`)?.value ?? '').trim();
    const items = getItems();
    const subtotal = getSubtotal();
    const tax = extractTax(subtotal);
    const method = SHIPPING_METHODS.find(m => m.id === selectedShipping);
    const shipCost = (method?.free || !includeShipping) ? null : calcShippingAmount(selectedShipping);
    const total = subtotal + (shipCost ?? 0);

    const customer = new Customer({
        firstName: get('firstName'), lastName: get('lastName'),
        email:     get('email'),     phone:    get('phone'),
    });
    const address = new Address({
        street: get('street'), city:    get('city'),
        state:  get('state'),  zip:     get('zip'),
        country: get('country'),
    });
    const order = new Order({
        orderNumber:    generateOrderNumber(),
        customer,
        address,
        shippingMethod: method,
        items: items.map(i => ({ sku: i.sku, name: i.name, brand: i.brand, price: i.price, thumbnail: i.thumbnail, quantity: i.quantity })),
        subtotal,
        tax,
        shipping: shipCost,
        total,
        placedAt: new Date().toISOString(),
    });

    // Persist last order (shown on step 3 even after cart is cleared)
    localStorage.setItem('lastOrder', JSON.stringify(order));

    // Send confirmation email (Bonus 2). Checkout proceeds regardless of email outcome.
    sendConfirmationEmail(order).finally(() => {
        clearCart();
        clearDraft();
        try {
            renderConfirmation(order);
        } catch (err) {
            console.error('[Checkout] renderConfirmation error:', err);
        }
        goToStep(3);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Confirmation
// ─────────────────────────────────────────────────────────────────────────────
function renderConfirmation(order) {
    document.getElementById('confirm-heading').textContent = 'Order Placed!';
    document.getElementById('confirm-sub').textContent =
        `Order #${order.orderNumber} · ${order.formattedDate}`;
    document.getElementById('confirm-email-note').innerHTML =
        `A confirmation has been sent to <span class="text-primary">${order.customer.email}</span>`;

    // Items list
    document.getElementById('confirm-items').innerHTML = order.items.map(item => `
        <tr>
            <td class="ps-3" style="width:5%;">
                <img src="${imgSrc(item.thumbnail)}" alt=""
                     style="width:40px;height:40px;object-fit:contain;">
            </td>
            <td>
                <div class="fw-semibold">${item.name}</div>
                <div class="text-muted small">${item.brand} × ${item.quantity}</div>
            </td>
            <td class="text-end pe-3 fw-semibold">
                ${formatPrice(item.price * item.quantity)}
            </td>
        </tr>`).join('');

    // Totals
    document.getElementById('confirm-subtotal').textContent = order.formattedSubtotal;
    document.getElementById('confirm-tax').textContent = order.formattedTax;
    const shipRow = document.getElementById('confirm-shipping-row');
    if (order.shipping != null) {
        document.getElementById('confirm-shipping').textContent = order.formattedShipping;
        shipRow.classList.remove('d-none');
    } else {
        shipRow.classList.add('d-none');
    }
    document.getElementById('confirm-total').textContent = order.formattedTotal;

    // Address
    document.getElementById('confirm-address').textContent =
        `${order.customer.fullName} · ${order.address.formatted}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation — show/hide step divs
// ─────────────────────────────────────────────────────────────────────────────
function goToStep(step) {
    [1, 2, 3].forEach(n => {
        document.getElementById(`step-${n}`).classList.toggle('d-none', n !== step);
    });
    updateStepIndicator(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step === 2) renderOrderReview();
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
function init() {
    updateCartBadge();
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

    const items = getItems();

    // Empty cart guard
    if (!items.length) {
        document.getElementById('empty-cart-msg').classList.remove('d-none');
        document.getElementById('checkout-steps').classList.add('d-none');
        document.getElementById('step-indicator').classList.add('d-none');
        return;
    }

    updateStepIndicator(1);
    setupStep1();
    setupStep2();
}

init();
