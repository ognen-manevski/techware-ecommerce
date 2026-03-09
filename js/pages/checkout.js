import { getItems, getSubtotal, clearCart, updateCartBadge } from '../services/cartService.js';
import { weightCategory } from '../utils/calculations.js';
import { formatPrice } from '../utils/formatters.js';

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
//      {{shipping}}          – formatted shipping cost (or "Not included")
//      {{total}}             – formatted grand total
//      {{shipping_address}}  – full delivery address string
//      {{shipping_method}}   – chosen shipping method label (e.g. "Domestic")
// 4. Go to Account › API Keys  →  copy your Public Key below
// ─────────────────────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'C9jorWqz8EbnXR9BG';   // ← replace
const EMAILJS_SERVICE_ID  = 'service_8xisvll';   // ← replace
const EMAILJS_TEMPLATE_ID = 'template_g3si0j9';  // ← replace

// ─────────────────────────────────────────────────────────────────────────────
// Shipping methods  (keys match calculations.js distance parameter)
// ─────────────────────────────────────────────────────────────────────────────
const SHIPPING_METHODS = [
    { id: 'sameCity',           label: 'Same City',     eta: '1–2 business days'   },
    { id: 'sameCountry',        label: 'Domestic',      eta: '3–5 business days'   },
    { id: 'neighboringCountry', label: 'Regional',      eta: '5–10 business days'  },
    { id: 'international',      label: 'International', eta: '10–20 business days' },
];

const DISTANCE_MULTIPLIERS = { sameCity: 1, sameCountry: 2, neighboringCountry: 3, international: 4 };

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state
// ─────────────────────────────────────────────────────────────────────────────
let selectedShipping = 'sameCountry';
let includeShipping  = true;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Images in JSON are root-relative; pages/ subdir needs ../
function imgSrc(src) {
    if (!src || src.startsWith('http') || src.startsWith('/') || src.startsWith('../')) return src;
    return `../${src}`;
}

// Sum of (weight × qty) for all cart items. Returns null if any item has no weight.
function getTotalWeight() {
    const items = getItems();
    if (!items.length || items.some(i => i.weight == null)) return null;
    return items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
}

// Numeric shipping cost for a distance key. Falls back to 1 kg when weight is unknown.
function calcShippingAmount(distanceKey) {
    const weight = getTotalWeight() ?? 1;
    const base   = weightCategory(weight);
    return base * (DISTANCE_MULTIPLIERS[distanceKey] ?? 1);
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
        const label  = document.getElementById(`sl-${n}`);
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
    line12.classList.toggle('border-success',   activeStep > 1);
    line12.classList.toggle('border-secondary', activeStep <= 1);
    line23.classList.toggle('border-success',   activeStep > 2);
    line23.classList.toggle('border-secondary', activeStep <= 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Customer Details + Shipping Method
// ─────────────────────────────────────────────────────────────────────────────
function renderShippingMethods() {
    const container = document.getElementById('shipping-methods-container');
    const totalWt   = getTotalWeight();

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
        const cost   = calcShippingAmount(m.id);
        const active = m.id === selectedShipping;
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
                        <span class="fw-bold text-nowrap">${formatPrice(cost)}</span>
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
    renderShippingMethods();

    const form    = document.getElementById('step1-form');
    const nextBtn = document.getElementById('next-step1-btn');

    // Enable "Review Order" button only when all required fields pass
    const checkValidity = () => { nextBtn.disabled = !form.checkValidity(); };
    form.addEventListener('input',  checkValidity);
    form.addEventListener('change', checkValidity);
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
    const items    = getItems();
    const subtotal = getSubtotal();
    const method   = SHIPPING_METHODS.find(m => m.id === selectedShipping);
    const shipCost = calcShippingAmount(selectedShipping);
    const totalWt  = getTotalWeight();

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

    // Address recap
    const form = document.getElementById('step1-form');
    const get  = id => (form.querySelector(`#${id}`)?.value ?? '').trim();
    const addrParts = [get('street'), get('city'), get('state'), get('zip'), get('country')].filter(Boolean);
    document.getElementById('review-address').textContent =
        `${get('firstName')} ${get('lastName')} · ${addrParts.join(', ')}`;

    // Subtotal
    document.getElementById('review-subtotal').textContent = formatPrice(subtotal);

    // Shipping details
    document.getElementById('shipping-method-label').textContent =
        `${method?.label ?? '—'} (${method?.eta ?? ''})`;
    document.getElementById('shipping-cost-display').textContent = formatPrice(shipCost);
    document.getElementById('shipping-weight-note').textContent = totalWt != null
        ? `Total weight: ${totalWt < 1 ? (totalWt * 1000).toFixed(0) + ' g' : totalWt.toFixed(2) + ' kg'}`
        : 'Estimated weight used — exact data unavailable for some items.';

    // Sync shipping toggle
    const toggle    = document.getElementById('shipping-toggle');
    toggle.checked  = includeShipping;
    toggle.onchange = () => { includeShipping = toggle.checked; updateReviewTotal(); };

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

    const form     = document.getElementById('step1-form');
    const get      = id => (form.querySelector(`#${id}`)?.value ?? '').trim();
    const items    = getItems();
    const subtotal = getSubtotal();
    const method   = SHIPPING_METHODS.find(m => m.id === selectedShipping);
    const shipCost = includeShipping ? calcShippingAmount(selectedShipping) : null;
    const total    = subtotal + (shipCost ?? 0);

    const order = {
        orderNumber    : generateOrderNumber(),
        customer       : {
            firstName: get('firstName'),
            lastName : get('lastName'),
            email    : get('email'),
            phone    : get('phone'),
        },
        address        : {
            street : get('street'),
            city   : get('city'),
            state  : get('state'),
            zip    : get('zip'),
            country: get('country'),
        },
        shippingMethod : method,
        items          : items.map(i => ({ sku: i.sku, name: i.name, brand: i.brand, price: i.price, thumbnail: i.thumbnail, quantity: i.quantity })),
        subtotal,
        shipping       : shipCost,
        total,
        placedAt       : new Date().toISOString(),
    };

    // Persist last order (shown on step 3 even after cart is cleared)
    localStorage.setItem('lastOrder', JSON.stringify(order));

    // Send confirmation email (Bonus 2). Checkout proceeds regardless of email outcome.
    sendConfirmationEmail(order).finally(() => {
        clearCart();
        renderConfirmation(order);
        goToStep(3);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Confirmation
// ─────────────────────────────────────────────────────────────────────────────
function renderConfirmation(order) {
    const dateStr = new Date(order.placedAt).toLocaleDateString('en-US', { dateStyle: 'long' });

    document.getElementById('confirm-heading').textContent  = 'Order Placed!';
    document.getElementById('confirm-sub').textContent      =
        `Order #${order.orderNumber} · ${dateStr}`;
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
    document.getElementById('confirm-subtotal').textContent = formatPrice(order.subtotal);
    const shipRow = document.getElementById('confirm-shipping-row');
    if (order.shipping != null) {
        document.getElementById('confirm-shipping').textContent = formatPrice(order.shipping);
        shipRow.classList.remove('d-none');
    } else {
        shipRow.classList.add('d-none');
    }
    document.getElementById('confirm-total').textContent = formatPrice(order.total);

    // Address
    const addrParts = [
        order.address.street, order.address.city,
        order.address.state, order.address.zip, order.address.country,
    ].filter(Boolean);
    document.getElementById('confirm-address').textContent =
        `${order.customer.firstName} ${order.customer.lastName} · ${addrParts.join(', ')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EmailJS — Bonus 2: send order confirmation email to the customer
// ─────────────────────────────────────────────────────────────────────────────
function sendConfirmationEmail(order) {
    // Skip silently if EmailJS hasn't been configured yet
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.info(
            '[EmailJS] Not configured — skipping confirmation email.\n' +
            'Fill in EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID in checkout.js.'
        );
        return Promise.resolve();
    }

    try {
        emailjs.init(EMAILJS_PUBLIC_KEY);

        // Absolute URL base — needed so email clients can load product images
        const siteRoot = new URL('../', window.location.href).href;
        const absImg = src => {
            if (!src || src.startsWith('http')) return src ?? '';
            return siteRoot + src.replace(/^\.\.\//, '');
        };

        const addrParts = [
            order.address.street, order.address.city,
            order.address.state, order.address.zip, order.address.country,
        ].filter(Boolean);

        const params = {
            to_name          : `${order.customer.firstName} ${order.customer.lastName}`,
            to_email         : order.customer.email,
            order_number     : order.orderNumber,
            // orders array powers the {{#orders}}…{{/orders}} loop in the template
            orders           : order.items.map(i => ({
                image_url : absImg(i.thumbnail),
                name      : i.name,
                units     : i.quantity,
                price     : formatPrice(i.price * i.quantity),
            })),
            subtotal         : formatPrice(order.subtotal),
            shipping         : order.shipping != null ? formatPrice(order.shipping) : 'Not included',
            total            : formatPrice(order.total),
            shipping_address : addrParts.join(', '),
            shipping_method  : order.shippingMethod?.label ?? '—',
        };

        return emailjs
            .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
            .then(() => console.info('[EmailJS] Confirmation email sent to', order.customer.email))
            .catch(err => console.warn('[EmailJS] Could not send confirmation email:', err));

    } catch (err) {
        console.warn('[EmailJS] Initialisation error:', err);
        return Promise.resolve();
    }
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
