import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to automatically attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API Calls
export const loginUser = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const registerUser = async (payload) => {
  const res = await api.post('/auth/register', payload);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const getMyComplaints = async () => {
  const res = await api.get('/complaints/my');
  return res.data;
};


export const submitComplaint = async (payload) => {
  const res = await api.post('/complaints', payload);
  return res.data;
};

export const getComplaints = async () => {
  const res = await api.get('/complaints');
  return res.data;
};

export const getComplaintByTicketId = async (ticketId) => {
  const res = await api.get(`/complaints/${ticketId}`);
  return res.data;
};

export const updateComplaintStatus = async (ticketId, status) => {
  const res = await api.put(`/complaints/${ticketId}/status`, { status });
  return res.data;
};

export const escalateComplaint = async (ticketId, reason) => {
  const res = await api.post(`/complaints/${ticketId}/escalate`, { reason });
  return res.data;
};

export const simulateSLABreach = async (ticketId) => {
  const res = await api.post(`/complaints/${ticketId}/simulate-breach`);
  return res.data;
};

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const seedAdminData = async () => {
  const res = await api.post('/admin/seed');
  return res.data;
};

export const checkHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export default api;
