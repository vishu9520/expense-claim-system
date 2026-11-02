import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import Loading from '../../components/common/Loading'

export default function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardService.getManagerDashboard()
      .then(res => setData(res.data.data))
      .catch(() => setError('Failed to load manager dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading text="Loading manager statistics..." />
  if (error) return <div className="text-red-500 p-4">{error}</div>

  const statusCards = [
    { label: 'Pending Review', count: data.pendingCount, color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '⏳' },
    { label: 'Approved Claims', count: data.approvedCount, color: 'bg-green-50 text-green-800 border-green-200', icon: '✅' },
    { label: 'Rejected Claims', count: data.rejectedCount, color: 'bg-red-50 text-red-800 border-red-200', icon: '❌' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manager Dashboard 👔</h2>
          <p className="text-gray-500 text-sm mt-1">Company-wide expense claims oversight & analytics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/manager/claims?status=PENDING" className="btn-primary">Review Pending</Link>
          <Link to="/manager/claims" className="btn-secondary">All Claims</Link>
        </div>
      </div>

      {/* Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statusCards.map(c => (
          <div key={c.label} className={`card border flex items-center justify-between ${c.color}`}>
            <div>
              <p className="text-sm font-medium opacity-80">{c.label}</p>
              <p className="text-3xl font-extrabold mt-1">{c.count}</p>
            </div>
            <span className="text-3xl">{c.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Totals by Category */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Expenses by Category</h3>
          {data.totalsByCategory && Object.keys(data.totalsByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.totalsByCategory).map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{cat.replace('_', ' ')}</span>
                  <span className="font-bold text-gray-900">₹{Number(total).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No expense records yet.</p>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Monthly Summary (Current Year)</h3>
          {data.monthlySummary && data.monthlySummary.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2">Month</th>
                    <th className="pb-2 text-center">Claims Count</th>
                    <th className="pb-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.monthlySummary.map(m => (
                    <tr key={m.month}>
                      <td className="py-2.5 font-medium text-gray-800">{m.monthName}</td>
                      <td className="py-2.5 text-center text-gray-600">{m.claimsCount}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">
                        ₹{Number(m.totalAmount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No monthly summary available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

