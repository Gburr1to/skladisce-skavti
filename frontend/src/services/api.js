const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
};
const API_URL = getApiUrl();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('skavt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) ? data.message : `Napaka na strežniku (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => 
    request('/users/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getProfile: () => 
    request('/users/profile'),
  logout: () => 
    request('/users/logout'),

  // Warehouses (Skladišča)
  getWarehouses: () => 
    request('/warehouse'),
  getWarehouse: (id) => 
    request(`/warehouse/${id}`),
  getWarehouseClosets: (id) => 
    request(`/warehouse/${id}/closets`),
  createWarehouse: (data) => 
    request('/warehouse', { method: 'POST', body: JSON.stringify(data) }),
  updateWarehouse: (id, data) => 
    request(`/warehouse/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWarehouse: (id) => 
    request(`/warehouse/${id}`, { method: 'DELETE' }),

  // Closets (Omare)
  getClosets: (warehouseId) => 
    request(warehouseId ? `/closet?warehouse=${encodeURIComponent(warehouseId)}` : '/closet'),
  getCloset: (id) => 
    request(`/closet/${id}`),
  getClosetShelves: (id) => 
    request(`/closet/${id}/shelves`),
  createCloset: (data) => 
    request('/closet', { method: 'POST', body: JSON.stringify(data) }),
  updateCloset: (id, data) => 
    request(`/closet/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCloset: (id) => 
    request(`/closet/${id}`, { method: 'DELETE' }),

  // Shelves (Police)
  getShelves: () => 
    request('/shelf'),
  getShelf: (id) => 
    request(`/shelf/${id}`),
  getShelfArticles: (id) => 
    request(`/shelf/${id}/articles`),
  createShelf: (data) => 
    request('/shelf', { method: 'POST', body: JSON.stringify(data) }),
  updateShelf: (id, data) => 
    request(`/shelf/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShelf: (id) => 
    request(`/shelf/${id}`, { method: 'DELETE' }),

  // Articles (Artikli)
  getArticles: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'Vse') query.append('category', params.category);
    if (params.branch && params.branch !== 'Vse veje' && params.branch !== 'Vse') query.append('branch', params.branch);
    if (params.shelf) query.append('shelf', params.shelf);
    const qs = query.toString();
    return request(qs ? `/article?${qs}` : '/article');
  },
  searchArticles: (query, params = {}) => {
    const qp = new URLSearchParams();
    if (query) qp.append('q', query);
    if (params.category && params.category !== 'Vse') qp.append('category', params.category);
    if (params.branch && params.branch !== 'Vse veje' && params.branch !== 'Vse') qp.append('branch', params.branch);
    return request(`/article/search?${qp.toString()}`);
  },
  getArticle: (id) => 
    request(`/article/${id}`),
  createArticle: (data) => 
    request('/article', { method: 'POST', body: JSON.stringify(data) }),
  batchImportArticles: (items) =>
    request('/article/batch', { method: 'POST', body: JSON.stringify({ items }) }),
  updateArticle: (id, data) => 
    request(`/article/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArticle: (id) => 
    request(`/article/${id}`, { method: 'DELETE' }),
  generateQR: (id) => 
    request(`/article/${id}/generate-qr`, { method: 'POST' }),
  getByQR: (code) => 
    request(`/article/qr/${encodeURIComponent(code)}`),

  // Borrows (Izposoje)
  getBorrows: (status) => 
    request(status ? `/borrow?status=${encodeURIComponent(status)}` : '/borrow'),
  getBorrow: (id) => 
    request(`/borrow/${id}`),
  createBorrow: (data) => 
    request('/borrow', { method: 'POST', body: JSON.stringify(data) }),
  returnBorrow: (id) => 
    request(`/borrow/${id}/return`, { method: 'PATCH' }),
  deleteBorrow: (id) => 
    request(`/borrow/${id}`, { method: 'DELETE' }),

  // Key Holders (Imetniki ključa)
  getKeyHolders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.detailed !== false) query.append('detailed', 'true');
    if (params.warehouse && params.warehouse !== 'all') query.append('warehouse', params.warehouse);
    const qs = query.toString();
    return request(qs ? `/users/key-holders?${qs}` : '/users/key-holders');
  },
  addKeyHolder: (data) => 
    request('/users/key-holders?detailed=true', { 
      method: 'POST', 
      body: JSON.stringify(typeof data === 'string' ? { name: data } : data) 
    }),
  removeKeyHolder: (identifier, password) => {
    const query = new URLSearchParams({ detailed: 'true' });
    if (password) query.append('password', password);
    return request(`/users/key-holders/${encodeURIComponent(identifier)}?${query.toString()}`, { 
      method: 'DELETE' 
    });
  },
  getKeyHolderConfig: () =>
    request('/users/key-holders/config'),
  setupKeyHolderConfig: (data) =>
    request('/users/key-holders/config/setup', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  verifyKeyHolderPassword: (password) =>
    request('/users/key-holders/config/verify', {
      method: 'POST',
      body: JSON.stringify({ password })
    }),
  changeKeyHolderRecoveryEmail: (data) =>
    request('/users/key-holders/config/change-email', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  resetKeyHolderPassword: (data) =>
    request('/users/key-holders/config/reset', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Shopping / Nakupovalni seznam (artikli za nakup)
  getShoppingList: () => 
    request('/shopping'),
  createShoppingItem: (data) => 
    request('/shopping', { method: 'POST', body: JSON.stringify(data) }),
  updateShoppingItem: (id, data) => 
    request(`/shopping/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  togglePurchasedShoppingItem: (id, isPurchased) => 
    request(`/shopping/${id}/toggle-purchased`, { 
      method: 'PATCH', 
      body: JSON.stringify(isPurchased !== undefined ? { isPurchased } : {}) 
    }),
  deleteShoppingItem: (id) => 
    request(`/shopping/${id}`, { method: 'DELETE' })
};

export default api;
