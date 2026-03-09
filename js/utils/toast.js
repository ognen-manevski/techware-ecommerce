// Shared Bootstrap toast helper
// Usage: showToast('Added to cart!', 'success', 'shopping_cart')
//        showToast('Item removed', 'danger', 'delete')

let container = null;

function getContainer() {
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * @param {string} message
 * @param {'success'|'danger'|'warning'|'info'} [type='success']
 * @param {string} [icon] - Material Symbols icon name e.g. 'shopping_cart'
 */
export function showToast(message, type = 'success', icon = null) {
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('aria-atomic', 'true');

    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
                ${icon ? `<span class="material-symbols-outlined" style="font-size:1.1rem;">${icon}</span>` : ''}
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;

    getContainer().appendChild(el);

    const toast = new bootstrap.Toast(el, { delay: 2800 });
    toast.show();

    el.addEventListener('hidden.bs.toast', () => el.remove());
}
