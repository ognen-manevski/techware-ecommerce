export class CartItem {
    constructor(product, quantity = 1) {
        this.sku = product.sku;
        this.name = product.name;
        this.brand = product.brand;
        this.price = product.price;
        this.thumbnail = product.thumbnail;
        this.quantity = quantity;
        // weight in kg — available when added from the product details page (ProductDetails model)
        this.weight = product.weight ?? product.weightKg ?? null;
    }

    get lineTotal() {
        return this.price * this.quantity;
    }

    get formattedPrice() {
        return `$${this.price.toFixed(2)}`;
    }

    get formattedLineTotal() {
        return `$${this.lineTotal.toFixed(2)}`;
    }
}
