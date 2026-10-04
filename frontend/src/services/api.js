import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vigilix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('vigilix_token');
        localStorage.removeItem('vigilix_user');
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Authentication API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getThreatDistribution: () => api.get('/dashboard/threat-distribution'),
  getRecentEvents: (limit = 15) => api.get(`/dashboard/recent-events?limit=${limit}`),
};

// Logs API
export const logsApi = {
  getLogs: (params) => api.get('/logs', { params }),
  getLog: (id) => api.get(`/logs/${id}`),
  createLog: (data) => api.post('/logs', data),
  deleteLog: (id) => api.delete(`/logs/${id}`),
  analyzeLog: (data) => api.post('/logs/analyze', data),
};

// Threats API
export const threatsApi = {
  getThreats: (params) => api.get('/threats', { params }),
  getThreat: (id) => api.get(`/threats/${id}`),
  analyzeThreat: (data) => api.post('/threats/analyze', data),
  updateStatus: (id, status) => api.patch(`/threats/${id}/status?status=${status}`),
};

// Incidents API
export const incidentsApi = {
  getIncidents: (params) => api.get('/incidents', { params }),
  getIncident: (id) => api.get(`/incidents/${id}`),
  createIncident: (data) => api.post('/incidents', data),
  updateIncident: (id, data) => api.patch(`/incidents/${id}`, data),
  executeAction: (id, data) => api.post(`/incidents/${id}/actions`, data),
};

// Playbooks API
export const playbooksApi = {
  getPlaybooks: () => api.get('/playbooks'),
  getPlaybook: (id) => api.get(`/playbooks/${id}`),
  executePlaybook: (id, data) => api.post(`/playbooks/${id}/execute`, data),
};

// Maturity API
export const maturityApi = {
  getMaturity: () => api.get('/maturity'),
  getHistory: () => api.get('/maturity/history'),
};

// Simulation API
export const simulationApi = {
  getScenarios: () => api.get('/simulations/scenarios'),
  getHistory: () => api.get('/simulations/history'),
  runSimulation: (data) => api.post('/simulations/run', data),
};

// Splunk API
export const splunkApi = {
  getStatus: () => api.get('/splunk/status'),
  testConnection: (data = {}) => api.post('/splunk/test', data),
  search: (data) => api.post('/splunk/search', data),
  importEvents: (data) => api.post('/splunk/import', data),
  sendHec: (data) => api.post('/splunk/send', data),
};

// AI Telemetry API
export const aiApi = {
  analyze: (data) => api.post('/ai/analyze', data),
  getStatus: () => api.get('/ai/model-status'),
};

export default api;
