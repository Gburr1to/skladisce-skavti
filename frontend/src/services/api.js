const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  // Closets (Omare)
  getClosets: () => 
    request('/closet'),
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
  getArticles: () => 
    request('/article'),
  searchArticles: (query) => 
    request(`/article/search?q=${encodeURIComponent(query || '')}`),
  getArticle: (id) => 
    request(`/article/${id}`),
  createArticle: (data) => 
    request('/article', { method: 'POST', body: JSON.stringify(data) }),
  updateArticle: (id, data) => 
    request(`/article/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteArticle: (id) => 
    request(`/article/${id}`, { method: 'DELETE' }),
  generateQR: (id) => 
    request(`/article/${id}/generate-qr`, { method: 'POST' }),
  getByQR: (code) => 
    request(`/article/qr/${encodeURIComponent(code)}`),

  // Key Holders (Imetniki ključa)
  getKeyHolders: () => 
    request('/users/key-holders'),
  addKeyHolder: (name) => 
    request('/users/key-holders', { method: 'POST', body: JSON.stringify({ name }) }),
  removeKeyHolder: (name) => 
    request(`/users/key-holders/${encodeURIComponent(name)}`, { method: 'DELETE' }),

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
