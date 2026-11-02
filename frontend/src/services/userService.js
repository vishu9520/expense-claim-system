import api from '../api/axios'

export const userService = {
  getAll: () => api.get('/manager/users'),
  getById: (id) => api.get(`/manager/users/${id}`),
  activate: (id) => api.put(`/manager/users/${id}/activate`),
  deactivate: (id) => api.put(`/manager/users/${id}/deactivate`),
}

