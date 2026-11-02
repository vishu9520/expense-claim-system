import api from '../api/axios'

export const claimService = {
  // Employee
  getMyClaims: (params) => api.get('/employee/claims', { params }),
  getMyClaim: (id) => api.get(`/employee/claims/${id}`),
  createClaim: (data) => api.post('/employee/claims', data),
  updateClaim: (id, data) => api.put(`/employee/claims/${id}`, data),
  deleteClaim: (id) => api.delete(`/employee/claims/${id}`),
  uploadReceipt: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/employee/claims/${id}/receipt`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Manager
  getAllClaims: (params) => api.get('/manager/claims', { params }),
  getManagerClaim: (id) => api.get(`/manager/claims/${id}`),
  processAction: (id, data) => api.put(`/manager/claims/${id}/action`, data),
  exportCsv: (params) => api.get('/manager/claims/export/csv', {
    params, responseType: 'blob'
  }),

  // Shared
  getAuditLogs: (id) => api.get(`/claims/${id}/audit-logs`),
  downloadReceipt: (id) => api.get(`/files/download/${id}`, { responseType: 'blob' }),
}

