/**
 * Checkout Page Script
 * Handles multi-step checkout form with validation and order confirmation
 */

import { cartService } from '../services/cartService.js';
import { renderCartItems, renderCartSummary, updateCartBadge, showToast } from '../utils/render.js';
import { formatPrice } from '../utils/formatters.js';
import { EMAILJS_CONFIG } from '../config.js';

// State
let currentStep = 1;
let formData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
};

// DOM Elements
const checkoutForm = document.getElementById('checkoutForm');
const nextStep1Btn = document.getElementById('nextStep1');
const nextStep2Btn = document.getElementById('nextStep2');
const backStep2Btn = document.getElementById('backStep2');
const reviewShipping = document.getElementById('reviewShipping');
const reviewItems = document.getElementById('reviewItems');
const reviewTotal = document.getElementById('reviewTotal');
const confirmationDetails = document.getElementById('confirmationDetails');
const cartBadge = document.querySelector('.cart-badge');

/**
 * Initialize checkout page
 */
async function init() {
  try {
    // Load cart from storage
    await cartService.loadFromStorage();

    // Check if cart is empty
    if (cartService.isEmpty()) {
      window.location.href = '../index.html';
      return;
    }

    // Update cart badge
    updateCartBadge(cartService.getItemCount());

    // Setup event listeners
    setupEventListeners();

    // Load form data from localStorage if available
    loadFormData();
  } catch (error) {
    console.error('Error initializing checkout page:', error);
    showToast('Error loading checkout', 'error');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  nextStep1Btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (validateStep1()) {
      saveFormData();
      goToStep(2);
    }
  });

  nextStep2Btn.addEventListener('click', (e) => {
    e.preventDefault();
    goToStep(3);
    completeOrder();
  });

  backStep2Btn.addEventListener('click', (e) => {
    e.preventDefault();
    goToStep(1);
  });
}

/**
 * Validate step 1 form fields
 */
function validateStep1() {
  const fields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
  let isValid = true;

  fields.forEach(fieldName => {
    const input = document.getElementById(fieldName);
    const errorSpan = input.nextElementSibling;

    if (!input.value.trim()) {
      input.classList.add('error');
      errorSpan.textContent = 'This field is required';
      isValid = false;
    } else {
      input.classList.remove('error');
      errorSpan.textContent = '';

      // Additional validation
      if (fieldName === 'email' && !validateEmail(input.value)) {
        input.classList.add('error');
        errorSpan.textContent = 'Invalid email address';
        isValid = false;
      }

      if (fieldName === 'phone' && !validatePhone(input.value)) {
        input.classList.add('error');
        errorSpan.textContent = 'Invalid phone number';
        isValid = false;
      }

      if (fieldName === 'zipCode' && !validateZipCode(input.value)) {
        input.classList.add('error');
        errorSpan.textContent = 'Invalid zip code';
        isValid = false;
      }
    }
  });

  return isValid;
}

/**
 * Helper: Validate email
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Helper: Validate phone
 */
function validatePhone(phone) {
  const re = /^[\d\s\-\+\(\)]{10,}$/;
  return re.test(phone.replace(/\s/g, ''));
}

/**
 * Helper: Validate zip code
 */
function validateZipCode(zipCode) {
  const re = /^[\w\s\-]{3,}$/;
  return re.test(zipCode);
}

/**
 * Save form data to state and localStorage
 */
function saveFormData() {
  const fields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
  fields.forEach(fieldName => {
    formData[fieldName] = document.getElementById(fieldName).value;
  });

  localStorage.setItem('checkoutFormData', JSON.stringify(formData));
}

/**
 * Load saved form data
 */
function loadFormData() {
  const saved = localStorage.getItem('checkoutFormData');
  if (saved) {
    formData = JSON.parse(saved);
    Object.keys(formData).forEach(fieldName => {
      const input = document.getElementById(fieldName);
      if (input) {
        input.value = formData[fieldName];
      }
    });
  }
}

/**
 * Go to a specific checkout step
 */
function goToStep(step) {
  // Update progress indicator
  document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
    if (index + 1 <= step) {
      stepEl.classList.add('active');
    } else {
      stepEl.classList.remove('active');
    }
  });

  // Show/hide form steps
  document.querySelectorAll('.checkout-step').forEach(stepEl => {
    stepEl.classList.remove('active');
  });
  document.getElementById(`step${step}`).classList.add('active');

  currentStep = step;

  // Populate review and confirmation as needed
  if (step === 2) {
    populateReviewStep();
  } else if (step === 3) {
    populateConfirmationStep();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Populate step 2 (Order Review)
 */
function populateReviewStep() {
  // Shipping address
  reviewShipping.innerHTML = `
    <div class="shipping-details">
      <p><strong>${formData.fullName}</strong></p>
      <p>${formData.address}</p>
      <p>${formData.city}, ${formData.state} ${formData.zipCode}</p>
      <p>${formData.country}</p>
      <p>Email: ${formData.email}</p>
      <p>Phone: ${formData.phone}</p>
    </div>
  `;

  // Cart items
  const items = cartService.getItems();
  reviewItems.innerHTML = items.map(item => `
    <div class="review-item">
      <img src="${item.product.image}" alt="${item.product.name}" class="review-item-image" />
      <div class="review-item-details">
        <h4>${item.product.name}</h4>
        <p>Qty: ${item.quantity} × ${item.product.formattedPrice}</p>
      </div>
      <div class="review-item-total">${item.formattedTotal}</div>
    </div>
  `).join('');

  // Order total
  const summary = cartService.getOrderSummary();
  reviewTotal.innerHTML = `
    <div class="order-summary">
      <div class="summary-row">
        <span>Subtotal:</span>
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
 * Populate step 3 (Confirmation)
 */
function populateConfirmationStep() {
  const summary = cartService.getOrderSummary();
  const orderNumber = `ORD-${Date.now()}`;

  confirmationDetails.innerHTML = `
    <div class="confirmation-box">
      <div class="confirmation-row">
        <span>Order Number:</span>
        <strong>${orderNumber}</strong>
      </div>
      <div class="confirmation-row">
        <span>Total Amount:</span>
        <strong>${formatPrice(summary.total)}</strong>
      </div>
      <div class="confirmation-row">
        <span>Shipping To:</span>
        <strong>${formData.fullName}, ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}</strong>
      </div>
      <div class="confirmation-row">
        <span>Confirmation Email:</span>
        <strong>${formData.email}</strong>
      </div>
      <p class="confirmation-message">
        A detailed order confirmation has been sent to ${formData.email}
      </p>
    </div>
  `;
}

/**
 * Complete the order and send confirmation email
 */
async function completeOrder() {
  try {
    const orderNumber = `ORD-${Date.now()}`;
    const summary = cartService.getOrderSummary();
    const items = cartService.getItems();

    // Prepare order data for email
    const orderData = {
      orderNumber,
      customerName: formData.fullName,
      customerEmail: formData.email,
      shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
      itemList: items.map(item => `${item.product.name} (Qty: ${item.quantity})`).join('\n'),
      subtotal: summary.subtotal,
      tax: summary.tax,
      shipping: summary.shipping,
      total: summary.total
    };

    // Try to send email via EmailJS (if configured)
    await sendOrderConfirmationEmail(orderData);

    // Clear cart and form
    cartService.clearCart();
    localStorage.removeItem('checkoutFormData');

    // Show success toast
    showToast('Order placed successfully!', 'success');

  } catch (error) {
    console.error('Error completing order:', error);
    // Continue anyway - order was placed even if email failed
    cartService.clearCart();
    localStorage.removeItem('checkoutFormData');
    showToast('Order placed! (Email notification might be delayed)', 'info');
  }
}

/**
 * Send order confirmation email via EmailJS
 */
async function sendOrderConfirmationEmail(orderData) {
  // Check if EmailJS is configured
  if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
    console.log('EmailJS not configured. Skipping email send.');
    return;
  }

  try {
    // Initialize EmailJS if not already done
    if (!window.emailjs) {
      console.error('EmailJS library not loaded');
      return;
    }

    // Send email
    const response = await window.emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      {
        to_email: orderData.customerEmail,
        customer_name: orderData.customerName,
        order_number: orderData.orderNumber,
        items: orderData.itemList,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        shipping_address: orderData.shippingAddress
      },
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - order was still placed
  }
}

// Initialize on page load
init();
