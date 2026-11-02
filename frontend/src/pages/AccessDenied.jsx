import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccessDenied() {
  const { user } = useAuth()
  const home = user?.role === 'MANAGER' ? '/manager/dashboard' : '/employee/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
        <Link to={home} className="btn-primary">← Go Back Home</Link>
      </div>
    </div>
  )
}

