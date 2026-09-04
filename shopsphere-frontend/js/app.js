/* ============================================================
   ShopSphere frontend app
   Plain JS, hash-based router, no build step needed.
   ============================================================ */

const appEl = document.getElementById("app");
const toastEl = document.getElementById("toast");

let categoriesCache = [];
let currentQuery = { page: 1, limit: 12, sort: "-createdAt" };
let searchTerm = "";

/* ---------------- Helpers ---------------- */

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.className = "toast show" + (isError ? " error" : "");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toastEl.className = "toast"), 2600);
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function clone(templateId) {
  const tpl = document.getElementById(templateId);
  return tpl.content.cloneNode(true);
}

function isLoggedIn() {
  return !!Storage.getAccessToken();
}

function currentUser() {
  return Storage.getUser();
}

function isAdmin() {
  const u = currentUser();
  return u && u.role === "admin";
}

function requireAuth() {
  if (!isLoggedIn()) {
    showToast("Please sign in first.", true);
    location.hash = "#/login";
    return false;
  }
  return true;
}

function placeholderImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed || "shopsphere")}/500/500`;
}

/* ---------------- Auth chrome (topbar) ---------------- */

function refreshAuthChrome() {
  document.body.classList.toggle("is-authed", isLoggedIn());
  document.body.classList.toggle("is-admin", isAdmin());

  const loginLink = document.getElementById("loginLink");
  const logoutBtn = document.getElementById("logoutBtn");
  const userChip = document.getElementById("userChip");

  if (isLoggedIn()) {
    loginLink.style.display = "none";
    logoutBtn.style.display = "inline-flex";
    userChip.textContent = currentUser()?.name || "";
  } else {
    loginLink.style.display = "inline-flex";
    logoutBtn.style.display = "none";
    userChip.textContent = "";
  }

  updateCartBadge();
}

async function updateCartBadge() {
  const el = document.getElementById("cartCount");
  if (!isLoggedIn()) { el.textContent = "0"; return; }
  try {
    const res = await CartAPI.get();
    const items = res.data.cart.items || [];
    const count = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    el.textContent = String(count);
  } catch (_) {
    el.textContent = "0";
  }
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await AuthAPI.logout();
  refreshAuthChrome();
  showToast("Signed out.");
  location.hash = "#/login";
});

document.getElementById("searchBtn").addEventListener("click", runSearch);
document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
function runSearch() {
  searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
  currentQuery.page = 1;
  if (location.hash === "#/products") {
    renderProducts();
  } else {
    location.hash = "#/products";
  }
}

/* ---------------- Router ---------------- */

const routes = [
  { pattern: /^#\/login$/, view: renderLogin },
  { pattern: /^#\/register$/, view: renderRegister },
  { pattern: /^#\/products$/, view: renderProducts },
  { pattern: /^#\/products\/([^/]+)$/, view: renderProductDetail },
  { pattern: /^#\/cart$/, view: renderCart },
  { pattern: /^#\/orders$/, view: renderOrders },
  { pattern: /^#\/orders\/([^/]+)$/, view: renderOrderDetail },
  { pattern: /^#\/admin\/products$/, view: renderAdminProducts },
  { pattern: /^#\/admin\/categories$/, view: renderAdminCategories }
];

function router() {
  const hash = location.hash || "#/products";
  refreshAuthChrome();

  for (const r of routes) {
    const match = hash.match(r.pattern);
    if (match) {
      r.view(...match.slice(1));
      return;
    }
  }
  location.hash = "#/products";
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

/* ---------------- Auth pages ---------------- */

function renderLogin() {
  appEl.replaceChildren(clone("tpl-login"));
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      const res = await AuthAPI.login({
        email: fd.get("email"),
        password: fd.get("password")
      });
      Storage.setSession({
        accessToken: res.data.AccessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user
      });
      showToast(`Welcome back, ${res.data.user.name}!`);
      refreshAuthChrome();
      location.hash = "#/products";
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

function renderRegister() {
  appEl.replaceChildren(clone("tpl-register"));
  const form = document.getElementById("registerForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    try {
      const res = await AuthAPI.register({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: Number(fd.get("phone")),
        password: fd.get("password")
      });
      Storage.setSession({
        accessToken: res.data.AccessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user
      });
      showToast("Account created. Welcome!");
      refreshAuthChrome();
      location.hash = "#/products";
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

/* ---------------- Catalog ---------------- */

async function loadCategoriesOnce() {
  if (categoriesCache.length) return categoriesCache;
  try {
    const res = await CategoriesAPI.getAll();
    categoriesCache = res.data.Category || [];
  } catch (_) {
    categoriesCache = [];
  }
  return categoriesCache;
}

async function renderProducts() {
  // The backend requires a valid token even to browse the catalog.
  if (!requireAuth()) return;
  appEl.replaceChildren(clone("tpl-products"));
  const grid = document.getElementById("productGrid");
  const catList = document.getElementById("categoryList");
  const sortSelect = document.getElementById("sortSelect");
  const resultCount = document.getElementById("resultCount");
  const pageLabel = document.getElementById("pageLabel");
  const catalogTitle = document.getElementById("catalogTitle");

  sortSelect.value = currentQuery.sort || "-createdAt";
  sortSelect.addEventListener("change", () => {
    currentQuery.sort = sortSelect.value;
    currentQuery.page = 1;
    loadProducts();
  });

  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentQuery.page > 1) { currentQuery.page--; loadProducts(); }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    currentQuery.page = (currentQuery.page || 1) + 1;
    loadProducts();
  });

  const categories = await loadCategoriesOnce();
  categories.forEach((cat) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (currentQuery.category === cat._id ? " is-active" : "");
    btn.textContent = cat.name;
    btn.dataset.id = cat._id;
    btn.addEventListener("click", () => {
      currentQuery = { page: 1, limit: 12, sort: currentQuery.sort, category: cat._id };
      catalogTitle.textContent = cat.name;
      renderProducts();
    });
    li.appendChild(btn);
    catList.appendChild(li);
  });
  if (!currentQuery.category) catalogTitle.textContent = "All products";

  async function loadProducts() {
    grid.innerHTML = `<p class="muted">Loading…</p>`;
    try {
      // The API filters by exact field match, so free-text search is done
      // on the client: fetch a bigger page and filter by name/description.
      const query = searchTerm
        ? { sort: currentQuery.sort, limit: 100, ...(currentQuery.category ? { category: currentQuery.category } : {}) }
        : { ...currentQuery };

      const res = await ProductsAPI.getAll(query);
      let products = res.data.Products || [];

      if (searchTerm) {
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
        );
      }

      resultCount.textContent = `${products.length} result${products.length === 1 ? "" : "s"}`;
      pageLabel.textContent = searchTerm ? "" : `Page ${currentQuery.page || 1}`;
      grid.innerHTML = "";
      if (!products.length) {
        grid.innerHTML = `<p class="muted">No products found.</p>`;
        return;
      }
      products.forEach((p) => grid.appendChild(productCard(p)));
    } catch (err) {
      grid.innerHTML = `<p class="muted">Could not load products: ${err.message}</p>`;
    }
  }

  loadProducts();
}

function productCard(p) {
  const wrap = document.createElement("a");
  wrap.href = `#/products/${p._id}`;
  wrap.className = "product-card";
  const img = document.createElement("img");
  img.src = p.images?.[0] || placeholderImage(p.slug);
  img.alt = p.name;
  const body = document.createElement("div");
  body.className = "pc-body";
  const cat = document.createElement("span");
  cat.className = "pc-cat";
  cat.textContent = p.category?.name || "";
  const name = document.createElement("span");
  name.className = "pc-name";
  name.textContent = p.name;
  const bottom = document.createElement("div");
  bottom.className = "pc-bottom";
  const price = document.createElement("span");
  price.className = "price-tag";
  price.textContent = money(p.discountPrice > 0 ? p.discountPrice : p.price);
  bottom.appendChild(price);
  if (p.discountPrice > 0) {
    const old = document.createElement("span");
    old.className = "price-old";
    old.textContent = money(p.price);
    bottom.appendChild(old);
  }
  body.append(cat, name, bottom);
  wrap.append(img, body);
  return wrap;
}

/* ---------------- Product detail ---------------- */

async function renderProductDetail(id) {
  if (!requireAuth()) return;
  appEl.replaceChildren(clone("tpl-product-detail"));
  try {
    const res = await ProductsAPI.getById(id);
    const p = res.data.Product;
    document.getElementById("pdImage").src = p.images?.[0] || placeholderImage(p.slug);
    document.getElementById("pdImage").alt = p.name;
    document.getElementById("pdCategory").textContent = p.category?.name || "";
    document.getElementById("pdName").textContent = p.name;
    document.getElementById("pdDescription").textContent = p.description;

    const priceEl = document.getElementById("pdPrice");
    const oldEl = document.getElementById("pdOldPrice");
    if (p.discountPrice > 0) {
      priceEl.textContent = money(p.discountPrice);
      oldEl.textContent = money(p.price);
    } else {
      priceEl.textContent = money(p.price);
      oldEl.textContent = "";
    }

    const stockEl = document.getElementById("pdStock");
    stockEl.textContent = p.stock > 0 ? `${p.stock} in stock` : "Out of stock";
    stockEl.classList.toggle("out", p.stock <= 0);

    const qtyInput = document.getElementById("pdQty");
    qtyInput.max = p.stock || 1;

    document.getElementById("pdAddToCart").addEventListener("click", async () => {
      if (!requireAuth()) return;
      try {
        await CartAPI.addItem(p._id, Number(qtyInput.value) || 1);
        showToast("Added to cart.");
        updateCartBadge();
      } catch (err) {
        document.getElementById("pdMsg").textContent = err.message;
      }
    });
  } catch (err) {
    appEl.innerHTML = `<p class="muted">Product not found.</p>`;
  }
}

/* ---------------- Cart ---------------- */

async function renderCart() {
  if (!requireAuth()) return;
  appEl.replaceChildren(clone("tpl-cart"));

  const list = document.getElementById("cartList");
  const emptyState = document.getElementById("cartEmpty");
  const content = document.getElementById("cartContent");

  let cart;
  try {
    const res = await CartAPI.get();
    cart = res.data.cart;
  } catch (err) {
    showToast(err.message, true);
    return;
  }

  const items = cart.items || [];
  if (!items.length) {
    emptyState.hidden = false;
    content.style.display = "none";
    return;
  }

  let total = 0;
  items.forEach((item) => {
    const p = item.product;
    if (!p) return;
    const unitPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
    total += unitPrice * item.quantity;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${p.images?.[0] || placeholderImage(p.slug)}" alt="${p.name}" />
      <div>
        <div class="cr-name">${p.name}</div>
        <div class="muted">${money(unitPrice)} each</div>
      </div>
      <input type="number" min="1" max="${p.stock}" value="${item.quantity}" />
      <div>
        <div>${money(unitPrice * item.quantity)}</div>
        <button class="remove-btn">Remove</button>
      </div>
    `;
    const qtyInput = row.querySelector("input");
    qtyInput.addEventListener("change", async () => {
      const q = Math.max(1, Number(qtyInput.value) || 1);
      try {
        await CartAPI.updateItem(p._id, q);
        renderCart();
        updateCartBadge();
      } catch (err) {
        showToast(err.message, true);
      }
    });
    row.querySelector(".remove-btn").addEventListener("click", async () => {
      try {
        await CartAPI.removeItem(p._id);
        showToast("Item removed.");
        renderCart();
        updateCartBadge();
      } catch (err) {
        showToast(err.message, true);
      }
    });
    list.appendChild(row);
  });

  document.getElementById("sumItems").textContent = items.reduce((s, i) => s + i.quantity, 0);
  document.getElementById("sumTotal").textContent = money(total);

  document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await OrdersAPI.checkout({
        shippingAddress: {
          street: fd.get("street"),
          city: fd.get("city"),
          phone: fd.get("phone")
        },
        paymentMethod: fd.get("paymentMethod")
      });
      showToast("Order placed!");
      updateCartBadge();
      location.hash = `#/orders/${res.data.order._id}`;
    } catch (err) {
      document.getElementById("checkoutMsg").textContent = err.message;
    }
  });
}

/* ---------------- Orders ---------------- */

async function renderOrders() {
  if (!requireAuth()) return;
  appEl.replaceChildren(clone("tpl-orders"));
  const list = document.getElementById("ordersList");
  const emptyState = document.getElementById("ordersEmpty");

  try {
    const res = await OrdersAPI.getAll();
    const orders = res.data.orders || [];
    if (!orders.length) { emptyState.hidden = false; return; }

    orders.forEach((o) => {
      const row = document.createElement("a");
      row.href = `#/orders/${o._id}`;
      row.className = "order-row";
      row.innerHTML = `
        <div>
          <div><strong>Order ${o._id.slice(-6).toUpperCase()}</strong></div>
          <div class="muted">${new Date(o.createdAt).toLocaleDateString()} · ${money(o.totalPrice)}</div>
        </div>
        <span class="status-pill ${o.status}">${o.status}</span>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    list.innerHTML = `<p class="muted">${err.message}</p>`;
  }
}

async function renderOrderDetail(id) {
  if (!requireAuth()) return;
  appEl.replaceChildren(clone("tpl-order-detail"));

  try {
    const res = await OrdersAPI.getById(id);
    const o = res.data.order;
    document.getElementById("odId").textContent = o._id.slice(-6).toUpperCase();
    document.getElementById("odDate").textContent = new Date(o.createdAt).toLocaleString();
    const statusPill = document.getElementById("odStatus");
    statusPill.textContent = o.status;
    statusPill.className = `status-pill ${o.status}`;

    const itemsEl = document.getElementById("odItems");
    (o.items || []).forEach((it) => {
      const row = document.createElement("div");
      row.className = "od-item-row";
      row.innerHTML = `<span>${it.product?.name || "Product"} × ${it.quantity}</span><span>${money(it.price * it.quantity)}</span>`;
      itemsEl.appendChild(row);
    });
    document.getElementById("odTotal").textContent = money(o.totalPrice);

    if (isAdmin()) {
      document.getElementById("odStatusSelect").value = o.status;
      document.getElementById("odUpdateBtn").addEventListener("click", async () => {
        try {
          await OrdersAPI.updateStatus(o._id, document.getElementById("odStatusSelect").value);
          showToast("Order status updated.");
          renderOrderDetail(id);
        } catch (err) {
          showToast(err.message, true);
        }
      });
    }
  } catch (err) {
    appEl.innerHTML = `<p class="muted">${err.message}</p>`;
  }
}

/* ---------------- Admin: Products ---------------- */

async function renderAdminProducts() {
  if (!requireAuth()) return;
  if (!isAdmin()) { showToast("Admins only.", true); location.hash = "#/products"; return; }

  appEl.replaceChildren(clone("tpl-admin-products"));
  const form = document.getElementById("productForm");
  const list = document.getElementById("adminProductList");
  const catSelect = document.getElementById("productCategorySelect");
  const msg = document.getElementById("productFormMsg");
  const formTitle = document.getElementById("productFormTitle");

  const categories = await loadCategoriesOnce();
  catSelect.innerHTML = categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join("");

  async function loadList() {
    list.innerHTML = `<p class="muted">Loading…</p>`;
    const res = await ProductsAPI.getAll({ limit: 100 });
    const products = res.data.Products || [];
    list.innerHTML = "";
    products.forEach((p) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <span>${p.name} — ${money(p.price)}</span>
        <span class="ar-actions">
          <button class="ar-edit">Edit</button>
          <button class="ar-delete">Delete</button>
        </span>
      `;
      row.querySelector(".ar-edit").addEventListener("click", () => fillForm(p));
      row.querySelector(".ar-delete").addEventListener("click", async () => {
        if (!confirm(`Delete "${p.name}"?`)) return;
        try {
          await ProductsAPI.remove(p._id);
          showToast("Product deleted.");
          loadList();
        } catch (err) { showToast(err.message, true); }
      });
      list.appendChild(row);
    });
  }

  function fillForm(p) {
    formTitle.textContent = `Edit: ${p.name}`;
    form._id.value = p._id;
    form.name.value = p.name;
    form.slug.value = p.slug;
    form.description.value = p.description;
    form.price.value = p.price;
    form.discountPrice.value = p.discountPrice || 0;
    form.stock.value = p.stock;
    form.category.value = p.category?._id || p.category;
    form.images.value = p.images?.[0] || "";
    form.isActive.checked = p.isActive;
  }

  document.getElementById("productFormReset").addEventListener("click", () => {
    form.reset();
    form._id.value = "";
    formTitle.textContent = "New product";
    msg.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      slug: fd.get("slug"),
      description: fd.get("description"),
      price: Number(fd.get("price")),
      discountPrice: Number(fd.get("discountPrice")) || 0,
      stock: Number(fd.get("stock")),
      category: fd.get("category"),
      images: fd.get("images") ? [fd.get("images")] : [],
      isActive: fd.get("isActive") === "on"
    };
    const id = fd.get("_id");
    try {
      if (id) {
        await ProductsAPI.update(id, payload);
        showToast("Product updated.");
      } else {
        await ProductsAPI.create(payload);
        showToast("Product created.");
      }
      form.reset();
      form._id.value = "";
      formTitle.textContent = "New product";
      msg.textContent = "";
      loadList();
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  loadList();
}

/* ---------------- Admin: Categories ---------------- */

async function renderAdminCategories() {
  if (!requireAuth()) return;
  if (!isAdmin()) { showToast("Admins only.", true); location.hash = "#/products"; return; }

  appEl.replaceChildren(clone("tpl-admin-categories"));
  const form = document.getElementById("categoryForm");
  const list = document.getElementById("adminCategoryList");
  const msg = document.getElementById("categoryFormMsg");
  const formTitle = document.getElementById("categoryFormTitle");

  async function loadList() {
    list.innerHTML = `<p class="muted">Loading…</p>`;
    const res = await CategoriesAPI.getAll();
    const cats = res.data.Category || [];
    categoriesCache = cats; // keep cache fresh for catalog/product form
    list.innerHTML = "";
    cats.forEach((c) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      row.innerHTML = `
        <span>${c.name} ${c.isActive ? "" : "(inactive)"}</span>
        <span class="ar-actions">
          <button class="ar-edit">Edit</button>
          <button class="ar-delete">Delete</button>
        </span>
      `;
      row.querySelector(".ar-edit").addEventListener("click", () => fillForm(c));
      row.querySelector(".ar-delete").addEventListener("click", async () => {
        if (!confirm(`Delete "${c.name}"?`)) return;
        try {
          await CategoriesAPI.remove(c._id);
          showToast("Category deleted.");
          loadList();
        } catch (err) { showToast(err.message, true); }
      });
      list.appendChild(row);
    });
  }

  function fillForm(c) {
    formTitle.textContent = `Edit: ${c.name}`;
    form._id.value = c._id;
    form.name.value = c.name;
    form.slug.value = c.slug;
    form.description.value = c.description || "";
    form.image.value = c.image || "";
    form.isActive.checked = c.isActive;
  }

  document.getElementById("categoryFormReset").addEventListener("click", () => {
    form.reset();
    form._id.value = "";
    formTitle.textContent = "New category";
    msg.textContent = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      slug: fd.get("slug"),
      description: fd.get("description"),
      image: fd.get("image"),
      isActive: fd.get("isActive") === "on"
    };
    const id = fd.get("_id");
    try {
      if (id) {
        await CategoriesAPI.update(id, payload);
        showToast("Category updated.");
      } else {
        await CategoriesAPI.create(payload);
        showToast("Category created.");
      }
      form.reset();
      form._id.value = "";
      formTitle.textContent = "New category";
      msg.textContent = "";
      loadList();
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  loadList();
}
