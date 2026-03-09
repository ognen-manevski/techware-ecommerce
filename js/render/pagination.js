import { mainRenderLoop, mainRenderLoopList } from './productCard.js';

// State variables
let products = [];   // current filtered product list
let page = 1;
let perPage = 8;

// Call this whenever the product list changes (new search / filter / sort)
export function setProducts(prods) {
    products = prods;
    page = 1;
    render();
    // hide skeleton placeholders in the search section header
    // (the dummy cards inside #home-results are already gone — mainRenderLoop replaced the innerHTML)
    document.querySelectorAll('#products-grid-section .dummy').forEach(el => el.classList.add('d-none'));
}

// Render current page 
function render() {
    const resultsDiv = document.getElementById('home-results');
    const total = products.length;
    const totalPages = (perPage === 'all') ? 1 : Math.ceil(total / perPage);

    // slice the right chunk for this page
    const start = (perPage === 'all') ? 0 : (page - 1) * perPage;
    const slice = (perPage === 'all') ? products : products.slice(start, start + Number(perPage));

    // render cards (grid + list — visibility toggled by buttons)
    mainRenderLoop(slice, resultsDiv);
    mainRenderLoopList(slice, document.getElementById('home-results-list'));

    // update both pagination bars (top + bottom) — hide if 4 or fewer results
    const barHTML = products.length <= 4 ? '' : buildPaginationBar(totalPages);
    document.querySelectorAll('.pagination-bar').forEach(bar => {
        bar.innerHTML = barHTML;
    });
}

// Build Pagination bar HTML
function buildPaginationBar(totalPages) {
    // --- per-page buttons ---
    const perPageOptions = [8, 16,'all'];
    let perBtns = '';
    for (const v of perPageOptions) {
        const isActive = (perPage == v);
        const label = (v === 'all') ? 'All' : v;
        perBtns += `<button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'} per-page-btn" data-value="${v}">${label}</button>`;
    }

    // --- page number buttons ---
    let pageBtns = '';

    // prev arrow
    pageBtns += `<li class="page-item ${page <= 1 ? 'disabled' : ''}">
        <a class="page-link page-btn" href="#" data-page="${page - 1}">&lsaquo;</a>
    </li>`;

    // numbered pages
    for (let i = 1; i <= totalPages; i++) {
        pageBtns += `<li class="page-item ${i === page ? 'active' : ''}">
            <a class="page-link page-btn" href="#" data-page="${i}">${i}</a>
        </li>`;
    }

    // next arrow
    pageBtns += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}">
        <a class="page-link page-btn" href="#" data-page="${page + 1}">&rsaquo;</a>
    </li>`;

    return `
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <nav>
                <ul class="pagination pagination-sm mb-0">${pageBtns}</ul>
            </nav>
            <div class="d-flex align-items-center gap-2">
                <span class="text-muted small">Per page:</span>
                <div class="btn-group btn-group-sm">${perBtns}</div>
            </div>
        </div>`;
}

//  Click handler 
document.addEventListener('click', function (e) {
    // per-page button clicked
    const perBtn = e.target.closest('.per-page-btn');
    if (perBtn) {
        const val = perBtn.dataset.value;
        perPage = (val === 'all') ? 'all' : Number(val);
        page = 1;
        render();
        return;
    }
    // page number button clicked
    const pageBtn = e.target.closest('.page-btn');
    if (pageBtn) {
        e.preventDefault();
        const n = Number(pageBtn.dataset.page);
        const totalPages = (perPage === 'all') ? 1 : Math.ceil(products.length / perPage);
        if (n >= 1 && n <= totalPages) {
            page = n;
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});
