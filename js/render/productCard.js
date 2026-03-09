import { formatPrice } from '../utils/formatters.js';
import { LocalStorageService } from '../services/localStorageService.js';

//render initial cards
export async function renderInitialProducts(filter) {
  let prods = LocalStorageService.getItem("products");

  const resultsDiv = filter === "promo"
    ? document.getElementById("home-promo-results")
    : document.getElementById("home-new-results");

  if (!prods) {
    console.error("No products in browser memory");
    resultsDiv.innerHTML = `
    <div class="alert alert-warning text-center" role="alert">
      No products found.
    </div>
    `;
    return;
  }

  if (filter === "promo") {
    prods = prods.filter(p => p.compareAtPrice);
    prods = prods.slice(0, 4); //limit to 4 items
  }
  if (filter === "new") {
    prods = prods.filter(p => p.isNew && !p.compareAtPrice);
    prods = prods.slice(0, 4); //limit to 4 items
  }

  //show parent section
  resultsDiv.closest("section").classList.remove("d-none");

  mainRenderLoop(prods, resultsDiv);
}


//render the product cards — filters/sorts and returns the result array
// pagination.js handles the actual rendering into the DOM
export function renderProductCards({ category: cat = null, sortBy: sort = null, search: query = '' } = {}) {

  //get from browser memory
  let prods = LocalStorageService.getItem('products');

  //select from html
  const prodSection = document.getElementById('products-grid-section');
  const resultsTitle = document.getElementById('search-title');

  if (!prods) {
    console.error('No products in browser memory');
    prodSection.classList.remove('d-none');
    prodSection.innerHTML = `
    <div class="alert alert-warning text-center" role="alert">
      No products found.
    </div>
    `;
    return [];
  }

  // filter by search query (name / description / brand)
  if (query) {
    prods = prods.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }

  // filter by category
  if (cat) {
    prods = prods.filter(p => p.categoryIds.includes(cat));
  }

  // sort
  if (sort) {
    switch (sort) {
      case 'newest': prods.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'price-asc': prods.sort((a, b) => a.price - b.price); break;
      case 'price-desc': prods.sort((a, b) => b.price - a.price); break;
      case 'rating': prods.sort((a, b) => b.rating.rate - a.rating.rate); break;
    }
  } else {
    // default: discounted first, then new, then rest
    prods.sort((a, b) => {
      if (a.compareAtPrice && !b.compareAtPrice) return -1;
      if (!a.compareAtPrice && b.compareAtPrice) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });
  }

  // update title
  resultsTitle.textContent = `${prods.length} Product${prods.length !== 1 ? 's' : ''} found${cat ? ` in ${cat}` : ''}${query ? ` for "${query}"` : ''}`;

  // show section
  prodSection.classList.remove('d-none');

  // return filtered products — pagination.js calls mainRenderLoop with the right slice
  return prods;
}

export function mainRenderLoop(prods, target) {
  let html = "";
  prods.forEach(product => {
    html += renderProductCard(product);
  });
  target.innerHTML = html;
}

export function mainRenderLoopList(prods, target) {
  let html = "";
  prods.forEach(product => {
    html += renderProductListItem(product);
  });
  target.innerHTML = html;
}

// Render product card 
function renderProductCard(product) {
  return `
      <div class="col-md-6 col-lg-3">
  <div class="card ${product.compareAtPrice ? 'card-sale' : product.isNew ? 'card-new' : ''}
       product-card h-100" data-product-id="${product.id}" data-sku="${product.sku}">
              <div class="card-bg"></div>
              <div class="position-relative overflow-hidden">
          <img src="${product.thumbnail}" class="card-img-top home-card-img" alt="${product.name}">
                  <div class="sale-badge ${product.compareAtPrice ? '' : 'd-none'}">
                      ${product.discountPercent ? `${product.discountPercent}%` : ''}<span>OFF</span>
                  </div>
                  <div class="new-badge ${product.isNew ? '' : 'd-none'}">
                      <span>NEW ★</span>
                  </div>
              </div>
              <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text text-muted small">${product.shortDescription}</p>
                  <div class="mb-3">
                  ${renderChips(product)}
                  </div>
                  <div class="mb-3 d-flex justify-content-between align-items-end gap-2">
                  ${renderStars(product)}

                      <div class="text-end">
                          <small class="text-muted ${product.compareAtPrice ? '' : 'd-none'}">
                            <s>${product.compareAtPrice ? formatPrice(product.compareAtPrice) : ''}</s>
                          </small>
                          <h6 class="text-primary mb-0">${formatPrice(product.price)}</h6>
                      </div>
                  </div>
                  <div class="d-flex gap-2 mt-auto">
                      <button class="btn btn-primary btn-add-to-cart flex-grow-1"
                       data-product-id="${product.id}" ${product.stock > 0 ? '' : 'disabled'}>
                        ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      <button class="btn btn-outline-primary d-flex gap-1 align-items-center
                      justify-content-center view-more-btn" data-product-id="${product.id}">
                          <div class="view-more-txt">
                              View
                          </div>
                          <div class="material-symbols-outlined">arrow_outward</div>
                      </button>
                  </div>
              </div>
          </div>
      </div>
  `;
}

//Render chips if any
function renderChips(product) {
  if (!product.categoryIds || product.categoryIds.length === 0) {
    return '';
  }
  return product.categoryIds
    .map(category => `<span class="badge bg-primary">${category}</span>`)
    .join(' ');
}


// Render star rating
function renderStars(product) {
  const fill = (product.rating.rate / 5 * 100).toFixed(1);
  return `
    <div class="stars">
      <span class="txt-stars" style="--fill: ${fill}%">★★★★★</span>
      <span class="small">${product.rating.rate} </span>
      <span class="text-muted small">(${product.rating.count} reviews)</span>
    </div>
  `;
}


// render products list (table)
function renderProductListItem(product) {
  return `
    <div class="col-12">
      <div class="card product-card ${product.compareAtPrice ? 'card-sale' : product.isNew ? 'card-new' : ''}"
           data-product-id="${product.id}" data-sku="${product.sku}">
        <div class="card-bg"></div>
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">

          <!-- row 1 on mobile: image + title/desc -->
          <div class="d-flex gap-3 align-items-center flex-grow-1">
            <img src="${product.thumbnail}" alt="${product.name}"
                 class="home-card-img flex-shrink-0"
                 style="width: 72px; height: 72px; padding: 0.25rem;">
            <div class="min-w-0">
              <h5 class="card-title mb-1">${product.name}</h5>
              <p class="card-text text-muted small mb-0">${product.shortDescription}</p>
            </div>
          </div>

          <!-- row 2 on mobile: price + buttons side by side -->
          <div class="d-flex gap-3 align-items-center justify-content-between justify-content-md-end flex-shrink-0">

            <!-- price -->
            <div class="text-end">
              <small class="text-muted ${product.compareAtPrice ? '' : 'd-none'}">
                <s>${product.compareAtPrice ? formatPrice(product.compareAtPrice) : ''}</s>
              </small>
              <h6 class="text-primary mb-0">${formatPrice(product.price)}</h6>
            </div>

            <!-- buttons -->
            <div class="d-flex gap-2">
              <button class="btn btn-primary btn-add-to-cart"
                      data-product-id="${product.id}" ${product.stock > 0 ? '' : 'disabled'}>
                ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button class="btn btn-outline-primary d-flex gap-1 align-items-center justify-content-center view-more-btn"
                      data-product-id="${product.id}">
                <div class="view-more-txt">View</div>
                <div class="material-symbols-outlined">arrow_outward</div>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;
}
