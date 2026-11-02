import api from '../api/axios'

export const dashboardService = {
  getEmployeeDashboard: () => api.get('/dashboard/employee'),
  getManagerDashboard: () => api.get('/dashboard/manager'),
}

