# Axion Techware — E-Commerce Website

A fully functional single-page e-commerce storefront built with **Vanilla JavaScript (ES Modules)**, **Bootstrap 5**, and a custom product API hosted on GitHub Pages.

> **JS Advanced Homework** — Deadline: 09.03.2026
> **Live site:** https://ognen-manevski.github.io/techware-ecommerce/

---

## Features

### Core
- **Hero banner** — animated gradient blobs, line grid overlay, grain texture
- **Product listing** — search by name/brand/description, filter by category, sort by price/rating/newest, grid/list toggle, pagination with configurable page size
- **Product detail page** — image gallery, spec table, reviews, shipping cost preview, add to cart
- **Shopping cart** — quantity controls, line totals, clear cart, order summary

### Bonus 1 — Multi-step Checkout
- Step 1: Customer details + shipping method selection (weight-based pricing)
- Step 2: Read-only order review with shipping toggle
- Step 3: Order confirmation screen
- Form draft auto-saved to `localStorage` — fields survive navigation and page refresh
- Full client-side validation with Bootstrap's native form feedback

### Bonus 2 — Order Confirmation Email
- Sends a real HTML email via **EmailJS** (no backend required) on order placement
- Email contains itemised order table, totals, shipping address, and order number

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements throughout) |
| Styling | CSS3 custom properties, Flexbox/Grid, `@property`, `@keyframes` |
| UI Framework | Bootstrap 5.3.8 |
| Icons | Material Symbols Outlined, Bootstrap Icons |
| Fonts | Sora (headings), Sterion (logo), system-ui (body) |
| Scripting | Vanilla JS — ES2022, ES Modules, async/await |
| Email | EmailJS (client-side transactional email) |
| Data | Custom REST-style JSON API on GitHub Pages |
| Hosting | GitHub Pages |

---

## Project Structure

```
├── index.html                      # Home — hero, search, product grid
├── css/
│   └── main.css                    # All styles — CSS variables, components, animations
├── fonts/
│   └── Sterion-BLLld.ttf
├── js/
│   ├── config.js                   # API base URL + EmailJS credentials
│   ├── main.js                     # Home page — init, search/filter/sort, cart buttons
│   ├── models/
│   │   ├── BaseModel.js            # Abstract base — new.target guard, toJSON/fromJSON contract
│   │   ├── Product.js              # Product + ProductDetails (extends Product)
│   │   ├── CartItem.js             # Private #quantity field with getter/setter validation
│   │   ├── Customer.js
│   │   ├── Address.js
│   │   ├── Order.js
│   │   └── Category.js             # Recursive subcategory instantiation
│   ├── services/
│   │   ├── apiService.js           # fetch() wrappers → model instances
│   │   ├── cartService.js          # Cart CRUD — all reads/writes go through CartItem
│   │   ├── emailService.js         # EmailJS order confirmation
│   │   └── localStorageService.js  # JSON-safe localStorage wrapper (singleton)
│   ├── render/
│   │   ├── productCard.js          # Grid card + list row HTML builders + filter/sort logic
│   │   ├── productDetailsRender.js # Full product detail page renderer
│   │   ├── categoriesMenu.js       # Populates the category filter <select>
│   │   └── pagination.js           # Page/per-page state, pagination bar builder
│   ├── pages/
│   │   ├── cart.js                 # Cart page — render, qty controls, clear
│   │   ├── checkout.js             # 3-step checkout wizard — form, review, confirmation
│   │   └── productDetails.js       # Product details page init
│   └── utils/
│       ├── calculations.js         # Weight-based shipping cost tiers
│       ├── formatters.js           # formatPrice, capitalize, imgSrc
│       └── toast.js                # Bootstrap toast helper
└── pages/
    ├── cart.html
    ├── checkout.html
    └── product-details.html
```

---

## Key Flows

### Home page → Product details
1. `main.js` fetches all products → saves to `localStorage['products']` → renders cards with `data-sku="..."` attributes
2. A single delegated `click` listener on `document` catches clicks on any `.product-card` or `.view-more-btn` (ignoring `.btn-add-to-cart`)
3. Reads `dataset.sku` from the nearest `[data-sku]` ancestor → navigates to `pages/product-details.html?sku=<sku>`
4. `productDetails.js` reads `?sku=` from the URL, looks up the product in the cached list to get its `id`, then calls `fetchProductDetails(id)` for the full detail object (gallery, specs, description, comments) — always a live fetch, not cached

> SKU is used in the URL because IDs are not guaranteed unique in the API. SKU is always unique.

---

### Add to cart
1. Any `.btn-add-to-cart` click (home cards, list view, or product details page) is caught by a delegated listener
2. The product's `sku` is read from the nearest `[data-sku]` ancestor
3. `cartService.addItem(product)` either increments the quantity of an existing `CartItem` or pushes a new one
4. The updated cart array is serialised to `localStorage['cart']` and the navbar badge is updated
5. A Bootstrap toast confirms the action

---

### Checkout flow
1. **Step 1** — form fields are validated live; the selected shipping method and all field values are auto-saved to `localStorage['checkoutDraft']` on every input so they survive navigation
2. **Step 2** — read-only order review built from the live cart + draft form data; `Customer` and `Address` model instances are constructed for display; total updates reactively when the shipping toggle changes
3. **Place Order** — `Customer`, `Address`, and `Order` model instances are constructed and saved to `localStorage['lastOrder']`; `sendConfirmationEmail(order)` fires via EmailJS; regardless of email outcome the cart and draft are cleared and the page advances to Step 3
4. **Step 3** — confirmation screen rendered from the `Order` object

---

### EmailJS confirmation email
1. `emailjs.init(publicKey)` is called once on checkout page load
2. After a successful order, `emailService.sendConfirmationEmail(order)` maps the `Order` object to a flat params object and calls `emailjs.send(serviceId, templateId, params)`
3. EmailJS delivers the email directly from the browser — no backend involved
4. Checkout proceeds in `.finally()` regardless of whether the email succeeds or fails

---

## API

Data is served from a static JSON API hosted on GitHub Pages:

```
Base URL: https://ognen-manevski.github.io/techware-ecommerce/techware-api
```

| Endpoint | Description |
|---|---|
| `/products.json` | All products (array of `Product`-shaped objects) |
| `/products/{id}.json` | Single product with full details, specs, gallery, comments |
| `/categories.json` | Category tree with nested subcategories |

Products and categories are cached to `localStorage` on first load and read from there for all subsequent renders in the same session.

---

## Running Locally

The project uses ES Modules — it must be served over HTTP (opening as a local `file://` will cause CORS errors).

```bash
# Using the VS Code Live Server extension, or:
npx serve .
# then open http://localhost:3000
```

No build step. No dependencies to install.

---

## EmailJS Setup

Order confirmation emails are wired up and working with the credentials in `js/config.js`. To reconfigure for a different account:

1. Sign up at [emailjs.com](https://www.emailjs.com/) (free tier works)
2. Create a service (Gmail, Outlook, etc.) and an email template
3. Update `js/config.js`:

```js
export const CONFIG = {
  API_BASE_URL:        '...',
  EMAILJS_PUBLIC_KEY:  'your_public_key',
  EMAILJS_SERVICE_ID:  'your_service_id',
  EMAILJS_TEMPLATE_ID: 'your_template_id',
};
```

Available template variables: `{{to_name}}`, `{{to_email}}`, `{{order_number}}`, `{{#orders}}` (item loop with `{{name}}`, `{{units}}`, `{{price}}`, `{{image_url}}`), `{{subtotal}}`, `{{tax}}`, `{{shipping}}`, `{{total}}`, `{{shipping_address}}`, `{{shipping_method}}`.
