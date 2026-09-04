# ShopSphere Frontend

A simple frontend for the ShopSphere API. Plain HTML, CSS and JavaScript.
No build tools, no frameworks — just open it in a browser.

## What it does

- Sign up / sign in / sign out (JWT, with auto refresh-token retry)
- Browse products, filter by category, sort, search by name
- Product detail page, add to cart
- Cart page: change quantity, remove item, checkout (fills in shipping
  address, chooses cash or card)
- Order history and order detail page
- Admin panel (only shown to users with role `admin`): create, edit,
  delete products and categories, update order status

## 1. Start the backend

In the `shopsphere-api/backend` folder:

```bash
npm install
npm start   # or: node server.js
```

The backend must be running at `http://localhost:3000` (this is the
default in the project's `.env`).

**Important:** the backend requires a valid login token for almost
every route, including browsing products and categories. So you must
register / sign in before you can see the catalog — this is a
backend rule, not a frontend limit.

## 2. Create an admin user (optional)

`POST /Auth/register` always saves new users with role `user`, no
matter what you send. To test the admin panel, register normally,
then open your MongoDB database and change that user's `role` field
to `"admin"` by hand. Sign out and sign in again afterward so the new
role is saved in the browser.

## 3. Run the frontend

Browsers block some `fetch()` calls when a page is opened directly as
a `file://` path, so serve this folder with any simple static server.
From this folder, run one of:

```bash
# Option A — Node
npx serve .

# Option B — Python
python3 -m http.server 5500
```

Then open the printed address (e.g. `http://localhost:5500`).

## Changing the API address

If your backend runs somewhere other than `http://localhost:3000`,
edit the first line of `js/api.js`:

```js
const API_BASE = "http://localhost:3000/api/v1";
```

## Project structure

```
shopsphere-frontend/
├── index.html      All pages, as <template> blocks
├── css/style.css    Styling
├── js/api.js        All API calls (fetch wrappers, token handling)
└── js/app.js        Router + page rendering logic
```

## Notes

- The catalog's free-text search filters on the client, because the
  backend's product-listing endpoint only matches exact field values.
- Tokens are stored in `localStorage`. Signing out clears them and
  calls the backend's logout endpoint.
