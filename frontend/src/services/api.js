// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/* ---------- Auth API ---------- */
export const authAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (userData) => api.put('/api/users/profile', userData),
  getAllUsers: () => api.get('/api/users'),
};

/* ---------- Teams API ---------- */
export const teamsAPI = {
  create: (data) => api.post('/api/teams', data),
  getMyTeams: () => api.get('/api/teams/my'),
  getById: (id) => api.get(`/api/teams/${id}`),
  update: (id, data) => api.put(`/api/teams/${id}`, data),
  delete: (id) => api.delete(`/api/teams/${id}`),
  addMemberByEmail: (id, payload) => api.post(`/api/teams/${id}/members`, payload),
  removeMember: (id, memberId) => api.delete(`/api/teams/${id}/members/${memberId}`),
};

/* ---------- Projects API ---------- */
export const projectsAPI = {
  create: (data) => {
    if (data && data.teamId) {
      return api.post(`/api/projects/team/${data.teamId}`, {
        name: data.name,
        description: data.description || '',
      });
    }
    return api.post('/api/projects', {
      name: data.name,
      description: data.description || '',
    });
  },
  getMine: () => api.get('/api/projects/mine'),
  getByTeam: (teamId) => api.get(`/api/projects/team/${teamId}`),
  getById: (id) => api.get(`/api/projects/${id}`),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  assignTeam: (projectId, teamId) => api.post(`/api/projects/${projectId}/assign-team`, { teamId }),
  assignTeamToProject: (projectId, teamId) => api.post(`/api/projects/${projectId}/assign-team`, { teamId }),
  removeTeam: (projectId, teamId) => api.post(`/api/projects/${projectId}/remove-team`, { teamId }),
  linkRepo: (projectId, payload) => api.post(`/api/projects/${projectId}/link`, payload),
};

/* ---------- Messages ---------- */
export const messagesAPI = {
  getByProject: (projectId, options = {}) => {
    if (!projectId) return Promise.reject(new Error('projectId is required'));

    const params = {};
    if (options.limit) params.limit = options.limit;
    if (options.page) params.page = options.page;
    if (options.includeDeleted) params.includeDeleted = options.includeDeleted;

    const canonical = `/api/projects/${projectId}/messages`;
    const legacy = `/api/messages/${projectId}`;

    return api.get(canonical, { params }).catch((err) => {
      const status = err?.response?.status;
      if (!status || status === 404) {
        return api.get(legacy, { params });
      }
      throw err;
    });
  },
};

/* ---------- Notifications ---------- */
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/api/notifications', { params }), // supports page, limit
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  createNotification: (payload) => api.post('/api/notifications', payload),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  // Optional: bulk create (if your backend implements it)
  createBulkNotifications: (payload) => api.post('/api/notifications/bulk', payload),
};

export default api;
