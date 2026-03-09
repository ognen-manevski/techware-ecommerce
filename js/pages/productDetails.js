import { fetchProducts, fetchProductDetails } from '../services/apiService.js';
import { LocalStorageService } from '../services/localStorageService.js';
import { renderProductDetails } from '../render/productDetailsRender.js';

async function init() {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get('sku');

    if (!sku) {
        window.location.href = '../index.html';
        return;
    }

    // Use cached products list if available, otherwise fetch
    let products = LocalStorageService.getItem('products');
    if (!products) {
        products = await fetchProducts();
        if (products) LocalStorageService.setItem('products', products);
    }

    const basic = products?.find(p => p.sku === sku);
    if (!basic) {
        document.getElementById('product-details-container').innerHTML = `
            <div class="alert alert-warning text-center py-5">
                Product not found. <a href="../index.html">Go back home</a>
            </div>`;
        document.getElementById('breadcrumb-product').textContent = 'Not Found';
        return;
    }

    const product = await fetchProductDetails(basic.id);

    if (!product || product instanceof Error) {
        document.getElementById('product-details-container').innerHTML = `
            <div class="alert alert-danger text-center py-5">
                Could not load product details. <a href="../index.html">Go back home</a>
            </div>`;
        return;
    }

    renderProductDetails(product);
}

init();
