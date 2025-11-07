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
// Note: backend route for listing teams the user belongs to is /api/teams/my
export const teamsAPI = {
  create: (data) => api.post('/api/teams', data),
  getMyTeams: () => api.get('/api/teams/my'),
  getById: (id) => api.get(`/api/teams/${id}`),
  update: (id, data) => api.put(`/api/teams/${id}`, data),
  delete: (id) => api.delete(`/api/teams/${id}`),
  addMemberByEmail: (id, payload) => api.post(`/api/teams/${id}/members`, payload), // { email, role }
  removeMember: (id, memberId) => api.delete(`/api/teams/${id}/members/${memberId}`),
};

/* ---------- Projects API ---------- */
// Conventions:
// - Create: pass { name, description, teamId? }  -> will POST to proper endpoint
// - Get mine: GET /api/projects/mine
// - Get by team: GET /api/projects/team/:teamId
export const projectsAPI = {
  create: (data) => {
    // data: { name, description, teamId? }
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
  // alias for some codebases that reference this name
  assignTeamToProject: (projectId, teamId) => api.post(`/api/projects/${projectId}/assign-team`, { teamId }),
  removeTeam: (projectId, teamId) => api.post(`/api/projects/${projectId}/remove-team`, { teamId }),
  linkRepo: (projectId, payload) => api.post(`/api/projects/${projectId}/link`, payload),
};

/* ---------- Messages / Notifications ---------- */
export const messagesAPI = {
  getByProject: (projectId) => api.get(`/api/messages/${projectId}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/api/notifications'),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  // optional: create a single notification (useful if you want to persist assignment notifications)
  createNotification: (payload) => api.post('/api/notifications', payload), // { userId, title, body, meta }
  // optional: create bulk notifications for multiple users
  createBulkNotifications: (payload) => api.post('/api/notifications/bulk', payload), // { users: [], title, body, meta }
};

export default api;
