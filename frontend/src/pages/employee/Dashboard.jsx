import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'
import Loading from '../../components/common/Loading'

const StatCard = ({ label, amount, color, icon }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">₹{Number(amount || 0).toLocaleString('en-IN')}</p>
    </div>
  </div>
)

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardService.getEmployeeDashboard()
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hello, {user?.name}! 👋</h2>
          <p className="text-gray-500 text-sm mt-1">Here's a summary of your expense claims</p>
        </div>
        <Link to="/employee/claims/new" className="btn-primary">+ New Claim</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Claimed"  amount={data.totalClaimed}  color="bg-blue-50"   icon="💰" />
        <StatCard label="Approved"       amount={data.totalApproved} color="bg-green-50"  icon="✅" />
        <StatCard label="Rejected"       amount={data.totalRejected} color="bg-red-50"    icon="❌" />
        <StatCard label="Pending"        amount={data.totalPending}  color="bg-yellow-50" icon="⏳" />
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <Link to="/employee/claims/new" className="btn-primary">Submit New Claim</Link>
          <Link to="/employee/claims" className="btn-secondary">View All Claims</Link>
        </div>
      </div>
    </div>
  )
}

