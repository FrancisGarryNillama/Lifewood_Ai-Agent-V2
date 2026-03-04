import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyticsAPI = {
  // Receipt endpoints
  uploadReceipt: (formData) => api.post('/receipts/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  getReceipts: (params) => api.get('/receipts/', { params }),
  
  // Analytics endpoints
  analyzeExpenses: (query, filters) => 
    api.post('/analytics/analyze/', { query, filters }),
  
  getAnalyticsHistory: () => api.get('/analytics/'),
  
  // Export endpoints
  exportToExcel: (queryId, options) => 
    api.post(`/analytics/${queryId}/export_to_excel/`, { options }, {
      responseType: 'blob',
    }),
  
  getExportHistory: () => api.get('/exports/'),
};

export default api;