import api from '../api/axios'

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refresh: (token) => api.post(`/auth/refresh?token=${token}`),
  logout: (token) => api.post(`/auth/logout?token=${token}`),
}

