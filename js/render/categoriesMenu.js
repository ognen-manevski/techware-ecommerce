//render categories from browser memory after fetch
import { LocalStorageService } from '../services/localStorageService.js';

export async function renderCategoriesMenu() {

    //get from browser memory
    let cat = LocalStorageService.getItem("categories");

    //select menu
    const catMenu = document.getElementById("categoriesMenu");

    if (!cat) {
        console.error("No categories in browser memory");
        catMenu.innerHTML = '<option selected disabled>No categories found</option>';
        return;
    }

    //clear existing options except "All Categories"
    catMenu.innerHTML = '<option value="" selected>All Categories</option>';
    let html = '';
    cat.forEach(parent => {
        if (parent.subcategories.length > 0) {
            html += `<optgroup label="${parent.name}">`;
            parent.subcategories.forEach(sub => {
                html += `<option value="${sub.id}">${sub.name}</option>`;
            });
            html += `</optgroup>`;
        } else {
            html += `<option value="${parent.id}">${parent.name}</option>`;
        }
    });
    catMenu.innerHTML += html;
}