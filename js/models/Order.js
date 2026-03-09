import { formatPrice } from '../utils/formatters.js';

export class Order {
    constructor({ orderNumber, customer, address, shippingMethod, items, subtotal, tax, shipping, total, placedAt }) {
        this.orderNumber    = orderNumber;
        this.customer       = customer;       // Customer instance
        this.address        = address;        // Address instance
        this.shippingMethod = shippingMethod; // entry from SHIPPING_METHODS
        this.items          = items;
        this.subtotal       = subtotal;
        this.tax            = tax;
        this.shipping       = shipping;       // null = free / not included
        this.total          = total;
        this.placedAt       = placedAt;
    }

    get formattedSubtotal()  { return formatPrice(this.subtotal); }
    get formattedTax()       { return formatPrice(this.tax); }
    get formattedTotal()     { return formatPrice(this.total); }

    get formattedShipping() {
        if (this.shipping != null) return formatPrice(this.shipping);
        return this.shippingMethod?.free ? 'Free (Local Pickup)' : 'Not included';
    }

    get formattedDate() {
        return new Date(this.placedAt).toLocaleDateString('en-US', { dateStyle: 'long' });
    }

    get shippingLabel() {
        if (this.shippingMethod?.free) return 'Local Pickup';
        return `${this.shippingMethod?.label ?? '—'} (${this.shippingMethod?.eta ?? ''})`;
    }
}
