/**
 * API Client pour STATCOM SERVICES Manager
 */

const API_BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    localStorage.setItem('token', token);
    this.token = token;
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token = null;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.clearToken();
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          window.location.href = '/login';
        }
        return;
      }

      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Le serveur a renvoyé une réponse invalide (HTML). Vérifiez que la route existe.`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  async get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
  async post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  async put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  async delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  // Authentification
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    if (data.success) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  async register(name, email, password) {
    const data = await this.post('/auth/register', { name, email, password });
    if (data.success) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  // Profil
  async getProfile() {
    return this.get('/profile');
  }

  async updateProfile(data) {
    return this.put('/profile', data);
  }

  async updatePassword(data) {
    return this.put('/profile/password', data);
  }

  async getProfileStats() {
    return this.get('/profile/stats');
  }

  // Paramètres
  async getSettings() {
    return this.get('/settings');
  }

  async updateSetting(key, value) {
    return this.put(`/settings/${key}`, { value });
  }
}

const api = new ApiClient();
