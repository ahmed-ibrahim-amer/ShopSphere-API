/* ============================================================
   ShopSphere API client
   Change API_BASE if your backend runs somewhere else.
   ============================================================ */
const API_BASE = "http://localhost:3000/api/v1";

const Storage = {
  getAccessToken: () => localStorage.getItem("ss_access"),
  getRefreshToken: () => localStorage.getItem("ss_refresh"),
  getUser: () => {
    const raw = localStorage.getItem("ss_user");
    return raw ? JSON.parse(raw) : null;
  },
  setSession({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem("ss_access", accessToken);
    if (refreshToken) localStorage.setItem("ss_refresh", refreshToken);
    if (user) localStorage.setItem("ss_user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("ss_access");
    localStorage.removeItem("ss_refresh");
    localStorage.removeItem("ss_user");
  }
};

/**
 * Low level request helper.
 * - Adds JSON headers + Authorization automatically.
 * - On 401, tries one silent refresh-token retry.
 */
async function request(path, { method = "GET", body, auth = true, retry = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = Storage.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let payload = null;
  try { payload = await res.json(); } catch (_) { /* no body */ }

  if (res.status === 401 && auth && retry && Storage.getRefreshToken()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request(path, { method, body, auth, retry: false });
  }

  if (!res.ok) {
    const message = (payload && payload.message) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return payload;
}

async function tryRefreshToken() {
  try {
    const refreshToken = Storage.getRefreshToken();
    const res = await fetch(`${API_BASE}/Auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    if (!res.ok) throw new Error("refresh failed");
    const payload = await res.json();
    Storage.setSession({ accessToken: payload.data.accessToken });
    return true;
  } catch (_) {
    Storage.clear();
    return false;
  }
}

/* ---------------- Auth ---------------- */
const AuthAPI = {
  register: (data) => request("/Auth/register", { method: "POST", body: data, auth: false }),
  login: (data) => request("/Auth/Login", { method: "POST", body: data, auth: false }),
  logout: async () => {
    const refreshToken = Storage.getRefreshToken();
    try { await request("/Auth/Logout", { method: "POST", body: { refreshToken }, auth: false }); }
    catch (_) { /* ignore network errors on logout */ }
    Storage.clear();
  },
  profile: () => request("/Auth/profile")
};

/* ---------------- Products ---------------- */
const ProductsAPI = {
  getAll: (query = {}) => {
    const qs = new URLSearchParams(query).toString();
    return request(`/Products${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request(`/Products/${id}`),
  create: (data) => request("/Products", { method: "POST", body: data }),
  update: (id, data) => request(`/Products/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/Products/${id}`, { method: "DELETE" })
};

/* ---------------- Categories ---------------- */
const CategoriesAPI = {
  getAll: () => request("/Category"),
  getById: (id) => request(`/Category/${id}`),
  create: (data) => request("/Category", { method: "POST", body: data }),
  update: (id, data) => request(`/Category/${id}`, { method: "PUT", body: data }),
  remove: (id) => request(`/Category/${id}`, { method: "DELETE" })
};

/* ---------------- Cart ---------------- */
const CartAPI = {
  get: () => request("/Cart"),
  addItem: (productId, quantity = 1) =>
    request("/Cart/items", { method: "POST", body: { productId, quantity } }),
  updateItem: (productId, quantity) =>
    request(`/Cart/items/${productId}`, { method: "PATCH", body: { quantity } }),
  removeItem: (productId) => request(`/Cart/items/${productId}`, { method: "DELETE" })
};

/* ---------------- Orders ---------------- */
const OrdersAPI = {
  checkout: (data) => request("/Orders/checkout", { method: "POST", body: data }),
  getAll: () => request("/Orders"),
  getById: (id) => request(`/Orders/${id}`),
  updateStatus: (id, status) => request(`/Orders/${id}`, { method: "PATCH", body: { status } })
};

/* ---------------- Users (admin) ---------------- */
const UsersAPI = {
  getAll: () => request("/users"),
  getById: (id) => request(`/users/${id}`),
  remove: (id) => request(`/users/${id}`, { method: "DELETE" })
};
