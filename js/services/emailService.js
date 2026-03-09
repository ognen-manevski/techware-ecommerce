import { CONFIG } from '../config.js';
import { formatPrice, capitalize } from '../utils/formatters.js';

// Sends an order confirmation email via EmailJS.
// emailjs.init() must have been called before this (done once in checkout.js init()).
export function sendConfirmationEmail(order) {
    try {
        // Build absolute image URLs from the API base so they work in email clients
        const siteRoot = new URL('../', CONFIG.API_BASE_URL + '/').href;
        const absImg = src => (!src || src.startsWith('http')) ? (src ?? '') : siteRoot + src.replace(/^\.\.\//, '');

        const params = {
            to_name: capitalize(order.customer.firstName),
            to_email: order.customer.email,
            order_number: order.orderNumber,
            orders: order.items.map(i => ({
                image_url: absImg(i.thumbnail),
                name: i.name,
                units: i.quantity,
                price: formatPrice(i.price * i.quantity),
            })),
            subtotal: order.formattedSubtotal,
            tax: order.formattedTax,
            shipping: order.formattedShipping,
            total: order.formattedTotal,
            shipping_address: order.address.formatted,
            shipping_method: order.shippingMethod?.label ?? '—',
        };

        //The emailjs SDK provides a send() method
        // hat takes the service ID, template ID, and parameters
        // to send an email based on a predefined template.
        // It returns a Promise that resolves on success or rejects on failure.
        return emailjs
            .send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, params)
            .then(() => console.info('[EmailJS] Confirmation sent to', order.customer.email))
            .catch(err => console.warn('[EmailJS] Could not send:', err));

    } catch (err) {
        console.warn('[EmailJS] Init error:', err);
        return Promise.resolve();
    }
}
