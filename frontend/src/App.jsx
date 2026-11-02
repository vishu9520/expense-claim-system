import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute from './routes/RoleRoute'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AccessDenied from './pages/AccessDenied'
import Layout from './components/Layout/Layout'

import EmployeeDashboard from './pages/employee/Dashboard'
import ClaimList from './pages/employee/ClaimList'
import ClaimForm from './pages/employee/ClaimForm'
import ClaimDetail from './pages/employee/ClaimDetail'

import ManagerDashboard from './pages/manager/Dashboard'
import AllClaims from './pages/manager/AllClaims'
import ManagerClaimDetail from './pages/manager/ClaimDetail'
import Users from './pages/manager/Users'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Employee */}
          <Route path="/employee" element={
            <PrivateRoute><RoleRoute role="EMPLOYEE"><Layout /></RoleRoute></PrivateRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="claims" element={<ClaimList />} />
            <Route path="claims/new" element={<ClaimForm />} />
            <Route path="claims/:id/edit" element={<ClaimForm />} />
            <Route path="claims/:id" element={<ClaimDetail />} />
          </Route>

          {/* Manager */}
          <Route path="/manager" element={
            <PrivateRoute><RoleRoute role="MANAGER"><Layout /></RoleRoute></PrivateRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="claims" element={<AllClaims />} />
            <Route path="claims/:id" element={<ManagerClaimDetail />} />
            <Route path="users" element={<Users />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

