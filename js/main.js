//importing all required modules
import { fetchCategories, fetchProducts } from "./services/apiService.js";
import { renderCategoriesMenu } from "./render/categoriesMenu.js";
import { renderInitialProducts, renderProductCards } from "./render/productCard.js";
import { setProducts } from "./render/pagination.js";
import { LocalStorageService } from "./services/localStorageService.js";
import { addItem, updateCartBadge } from "./services/cartService.js";

//initializing the app

//--------------------------------------------------//
// #region on page load ():
//--------------------------------------------------//
//product categories for search menu
async function initCategories() {
    await fetchCategories()
        //save in browser memory
        .then(cat => LocalStorageService.setItem("categories", cat));

    //render from browser memory
    await renderCategoriesMenu();
}
initCategories();

//All products for cards
async function initProducts() {
    await fetchProducts()
        //save in browser memory
        .then(products => LocalStorageService.setItem("products", products));
    //render promo sections from browser memory
    // promo
    renderInitialProducts("promo");
    // newest
    renderInitialProducts("new");
}
initProducts();
// #endregion
//--------------------------------------------------//


//--------------------------------------------------//
// #region on search/filter/sort:
//--------------------------------------------------//

//get html elements
const productsGridSection = document.getElementById("products-grid-section");
const searchInput = document.getElementById("searchInput");
const catMenu = document.getElementById("categoriesMenu");
const sortMenu = document.getElementById("filtersMenu");
const searchBtn = document.getElementById("searchBtn");

//track search form state
function searchFormState() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = (catMenu.value && catMenu.value !== "All Categories") ? catMenu.value : null;
    const sort = sortMenu.value;
    const filtered = renderProductCards({ category: cat, sortBy: sort, search: query });
    setProducts(filtered);
}

//INPUT
searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
        searchFormState();
    } else {
        productsGridSection.classList.add("d-none");
    }
});
//INPUT on enter key
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        if (searchInput.value.trim().length > 0) {
            searchFormState();
        } else {
            productsGridSection.classList.add("d-none");
        }
    }
});

//CATEGORY
catMenu.addEventListener("change", () => {
    if (!productsGridSection.classList.contains("d-none")) {
        searchFormState();
    }
});

//SORT
sortMenu.addEventListener("change", () => {
    if (sortMenu.value === "reset") {
        sortMenu.selectedIndex = 0;
    }
    if (!productsGridSection.classList.contains("d-none")) {
        searchFormState();
    }
});

//SEARCH BTN
searchBtn.addEventListener("click", () => {
    searchFormState();
});

// #endregion
//--------------------------------------------------//


//--------------------------------------------------//
// #region display toggle (grid / list):
//--------------------------------------------------//
const displayGrid = document.getElementById("display-grid");
const displayTable = document.getElementById("display-table");
const homeResults = document.getElementById("home-results");
const homeResultsList = document.getElementById("home-results-list");

displayGrid.addEventListener("click", () => {
    // show grid, hide list
    homeResults.classList.remove("d-none");
    homeResultsList.classList.add("d-none");
    // active state
    displayGrid.classList.remove("btn-outline-primary");
    displayGrid.classList.add("btn-primary");
    displayTable.classList.remove("btn-primary");
    displayTable.classList.add("btn-outline-primary");
});

displayTable.addEventListener("click", () => {
    // show list, hide grid
    homeResults.classList.add("d-none");
    homeResultsList.classList.remove("d-none");
    // active state
    displayTable.classList.remove("btn-outline-primary");
    displayTable.classList.add("btn-primary");
    displayGrid.classList.remove("btn-primary");
    displayGrid.classList.add("btn-outline-primary");
});
//--------------------------------------------------//



// #region navigate to product details page:
//--------------------------------------------------//
// Event delegation — catches clicks on both grid cards and list view buttons
document.addEventListener("click", (e) => {
    const viewBtn = e.target.closest(".view-more-btn");
    const card = e.target.closest(".product-card");

    // Ignore add-to-cart clicks bubbling up through the card
    if (e.target.closest(".btn-add-to-cart")) return;

    const trigger = viewBtn || card;
    if (!trigger) return;

    const sku = trigger.closest("[data-sku]")?.dataset.sku;
    if (!sku) return;

    window.location.href = `pages/product-details.html?sku=${encodeURIComponent(sku)}`;
});
// #endregion
//--------------------------------------------------//


// #region add to cart:
//--------------------------------------------------//
updateCartBadge();

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-add-to-cart");
    if (!btn) return;
    e.stopPropagation(); // prevent card click navigating to details

    const sku = btn.closest("[data-sku]")?.dataset.sku;
    if (!sku) return;

    const products = LocalStorageService.getItem("products");
    const product = products?.find(p => p.sku === sku);
    if (!product) return;

    addItem(product);

    // Brief visual feedback on the button
    btn.textContent = "Added!";
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = product.stock > 0 ? "Add to Cart" : "Out of Stock";
        btn.disabled = product.stock <= 0;
    }, 1200);
});
// #endregion
//--------------------------------------------------//