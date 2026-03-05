import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
          localStorage.setItem('accessToken', res.data.access);
          err.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api.request(err.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (username, password) =>
    axios.post(`${API_BASE_URL}/auth/token/`, { username, password }),
};

// Agent
export const agentAPI = {
  createSession: (title) =>
    api.post('/agent/sessions/', { title }),

  getSessions: () =>
    api.get('/agent/sessions/'),

  sendMessage: (sessionId, message, image = null) => {
    if (image) {
      const form = new FormData();
      form.append('message', message || '');
      form.append('image', image);
      return api.post(`/agent/sessions/${sessionId}/send_message/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/agent/sessions/${sessionId}/send_message/`, { message });
  },

  sendMessageForExport: (sessionId, message) =>
    api.post(`/agent/sessions/${sessionId}/send_message/`, { message }, {
      responseType: 'blob',
    }),

  getMessages: (sessionId) =>
    api.get(`/agent/sessions/${sessionId}/messages/`),

  getGovernanceLogs: (params) =>
    api.get('/agent/governance/', { params }),

  getGovernanceSummary: () =>
    api.get('/agent/governance/summary/'),

  getMemory: () =>
    api.get('/agent/memory/'),
};

// Legacy analytics/receipts
export const analyticsAPI = {
  getReceipts: (params) => api.get('/receipts/', { params }),
  getExportHistory: () => api.get('/exports/'),
  getAnalyticsHistory: () => api.get('/analytics/'),
};

export default api;