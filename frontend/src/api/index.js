import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Users
export const getUsers = () => api.get('/users');
export const createUser = (name) => api.post('/admin/users', { name });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Auth
export const adminLogin = (password) => api.post('/admin/login', { password });

// Holidays
export const getHolidays = () => api.get('/holidays');
export const addHoliday = (data) => api.post('/admin/holidays', data);
export const deleteHoliday = (id) => api.delete(`/admin/holidays/${id}`);

// Cycle
export const getActiveCycle = () => api.get('/cycle/active');
export const startNewCycle = (data) => api.post('/admin/cycle/start', data);

// Today
export const getTodayParty = () => api.get('/today');

// Assignments
export const getAssignments = () => api.get('/assignments');
export const reassignParty = (data) => api.put('/admin/assignments/reassign', data);
export const dragAllFromDate = (data) => api.put('/admin/assignments/drag-all', data);
export const swapAssignments = (data) => api.put('/admin/assignments/swap', data);
export const markCompleted = (id) => api.put(`/admin/assignments/${id}/complete`);

export default api;
