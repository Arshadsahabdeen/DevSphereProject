import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (userData) => api.put('/api/users/profile', userData),
  getAllUsers: () => api.get('/api/users'),
};

// Teams API
export const teamsAPI = {
  create: (data) => api.post('/api/teams', data),
  getAll: () => api.get('/api/teams'),
  getById: (id) => api.get(`/api/teams/${id}`),
  update: (id, data) => api.put(`/api/teams/${id}`, data),
  delete: (id) => api.delete(`/api/teams/${id}`),
  addMember: (id, memberId) => api.post(`/api/teams/${id}/members`, { memberId }),
  removeMember: (id, memberId) => api.delete(`/api/teams/${id}/members/${memberId}`),
};

// Projects API
export const projectsAPI = {
  create: (data) => api.post('/api/projects', data),
  getAll: () => api.get('/api/projects'),
  getById: (id) => api.get(`/api/projects/${id}`),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  assignTeam: (projectId, teamId) => api.post(`/api/projects/team/${projectId}`, { teamId }),
  addMember: (id, memberId) => api.post(`/api/projects/${id}/members`, { memberId }),
  removeMember: (id, memberId) => api.delete(`/api/projects/${id}/members/${memberId}`),
  getTeam: (id) => api.get(`/api/projects/${id}/team`),
  getActivity: (id) => api.get(`/api/projects/${id}/activity`),
};

// Messages API
export const messagesAPI = {
  getByProject: (projectId) => api.get(`/api/messages/${projectId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
};

export default api;