import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login will be handled by App.jsx
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Buildings
export const getBuildings = () => api.get('/buildings');
export const getBuilding = (id) => api.get(`/buildings/${id}`);
export const seedBuildings = () => api.post('/buildings/seed');

// Elections
export const getElections = (buildingId) => 
  api.get('/elections', { params: buildingId ? { buildingId } : {} });
export const getElection = (id) => api.get(`/elections/${id}`);
export const createElection = (data) => api.post('/elections', data);
export const updateElection = (id, data) => api.put(`/elections/${id}`, data);
export const tallyElection = (id) => api.post(`/elections/${id}/tally`);
export const deleteElection = (id) => api.delete(`/elections/${id}`);

// Residents
export const getResidents = (buildingId) => 
  api.get('/residents', { params: buildingId ? { buildingId } : {} });
export const getResident = (id) => api.get(`/residents/${id}`);
export const createResident = (data) => api.post('/residents', data);
export const updateResident = (id, data) => api.put(`/residents/${id}`, data);
export const deleteResident = (id) => api.delete(`/residents/${id}`);

// Nominations
export const getNominations = (electionId, status) => 
  api.get('/nominations', { params: { electionId, status } });
export const getNomination = (id) => api.get(`/nominations/${id}`);
export const createNomination = (data) => api.post('/nominations', data);
export const approveNomination = (id) => api.post(`/nominations/${id}/approve`);
export const rejectNomination = (id) => api.post(`/nominations/${id}/reject`);
export const updateNomination = (id, data) => api.put(`/nominations/${id}`, data);
export const deleteNomination = (id) => api.delete(`/nominations/${id}`);

// Votes
export const getVotes = (electionId) => 
  api.get('/votes', { params: electionId ? { electionId } : {} });
export const getVote = (id) => api.get(`/votes/${id}`);
export const castVote = (data) => api.post('/votes', data);
export const getVoteCount = (electionId) => api.get(`/votes/election/${electionId}/count`);
export const deleteVote = (id) => api.delete(`/votes/${id}`);

// Winners
export const getWinners = (status, buildingId) => 
  api.get('/winners', { params: { status, buildingId } });
export const getWinner = (id) => api.get(`/winners/${id}`);
export const getWinnerByElection = (electionId) => api.get(`/winners/election/${electionId}`);
export const confirmWinner = (id, confirmedBy) => api.post(`/winners/${id}/confirm`, { confirmedBy });
export const rejectWinner = (id) => api.post(`/winners/${id}/reject`);
export const getConfirmedWinnersByBuilding = (buildingId) => 
  api.get(`/winners/building/${buildingId}/confirmed`);

// Uploads
export const getUploadPresign = (key, contentType) => 
  api.post('/uploads/presign', { key, contentType });

// Auth
export const register = (data) => 
  api.post('/auth/register', data);

export const login = (phone, password) => 
  api.post('/auth/login', { phone, password });

export const logout = () => 
  api.post('/auth/logout');

export const getCurrentUser = () => 
  api.get('/auth/me');

export const updateProfile = (data) => 
  api.put('/auth/profile', data);

// Approval (for managers)
export const getPendingUsers = () => api.get('/auth/pending');
export const approveUser = (userId) => api.post(`/auth/approve/${userId}`);
export const rejectUser = (userId, reason) => api.post(`/auth/reject/${userId}`, { reason });

// Profile
export const getProfile = () => getCurrentUser();

export default api;

