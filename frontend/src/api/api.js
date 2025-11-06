import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pyramids_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function setToken(token) {
  if (token) localStorage.setItem('pyramids_token', token);
  else localStorage.removeItem('pyramids_token');
}

export default api;
