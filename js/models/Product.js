// static api single product:
export class Product {
  constructor(data) {
    this.id = data.id; //id is unreliable
    this.sku = data.sku; //sku is always unique 
    this.name = data.name;
    this.shortDescription = data.shortDescription;
    this.categoryIds = data.categoryIds; //arr or falsey
    this.brand = data.brand;
    this.price = data.price;
    this.compareAtPrice = data.compareAtPrice;  //before discount or falsey
    this.discountPercent = data.discountPercent; //% or falsey
    this.isNew = data.isNew;
    this.stock = data.stock;
    this.rating = {
      rate: data.rating.rate,
      count: data.rating.count
    };
    this.thumbnail = data.images.thumbnail;
    this.weight    = data.weightKg ?? null;   // kg — may be null for some catalogue entries
    this.createdAt = data.createdAt;
  }

  // getters
  get isInStock() {
    return this.stock > 0;
  }
}


//extends to ProductDetails for single product page with more details
export class ProductDetails extends Product {
  constructor(data) {
    super(data);   // weight already set by Product base (data.weightKg ?? null)
    this.description = data.description;
    this.warrantyMonths = data.warrantyMonths;
    this.comments = data.comments; //arr or falsey
    this.images = {
      main: data.images.main, //1200px
      gallery: data.images.gallery //array or falsey
    };
    this.specs = data.specs; //obj
  }
  get formattedWeight() {
    if (!this.weight) return 'N/A';
    if (this.weight < 1) return `${(this.weight * 1000).toFixed(0)} g`;
    else return `${this.weight} kg`;
  }
  get formattedWarranty() {
    if (!this.warrantyMonths) return 'N/A';
    if (this.warrantyMonths < 12) return `${this.warrantyMonths} month(s)`;
    else return `${Math.floor(this.warrantyMonths / 12)} year(s)`;
  }
  get shippingInfo() {
    if (!this.weight) return 'Shipping info unavailable';
    if (this.weight < 0.5) return 'Ships via standard mail';
    else if (this.weight < 5) return 'Ships via courier';
    else return 'Freight shipping required';
  }
}
