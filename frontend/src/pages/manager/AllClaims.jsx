import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import { userService } from '../../services/userService'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'

export default function AllClaims() {
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''

  const [claims, setClaims] = useState([])
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState(initialStatus)
  const [selectedUser, setSelectedUser] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    userService.getAll()
      .then(res => setUsers(res.data.data))
      .catch(() => {})
  }, [])

  const fetchClaims = useCallback(() => {
    setLoading(true)
    const params = { page, size: 10 }
    if (status) params.status = status
    if (selectedUser) params.userId = selectedUser
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    claimService.getAllClaims(params)
      .then(res => {
        setClaims(res.data.data.content)
        setTotalPages(res.data.data.totalPages)
      })
      .catch(() => setError('Failed to load claims.'))
      .finally(() => setLoading(false))
  }, [page, status, selectedUser, fromDate, toDate])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const params = {}
      if (status) params.status = status
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate

      const res = await claimService.exportCsv(params)
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `claims-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleClear = () => {
    setStatus('')
    setSelectedUser('')
    setFromDate('')
    setToDate('')
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Claims</h2>
          <p className="text-gray-500 text-sm mt-1">Review, approve, reject and export all employee claims</p>
        </div>
        <button onClick={handleExportCsv} disabled={exporting} className="btn-success flex items-center gap-2">
          <span>📥</span> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filter Card */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(0) }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Employee</label>
            <select
              value={selectedUser}
              onChange={e => { setSelectedUser(e.target.value); setPage(0) }}
              className="input-field"
            >
              <option value="">All Employees</option>
              {users.filter(u => u.role === 'EMPLOYEE').map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(0) }}
              className="input-field"
            >
            </input>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(0) }}
              className="input-field"
            >
            </input>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-800">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading text="Loading claims..." />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : claims.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No claims match the selected criteria.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Employee', 'Title', 'Category', 'Amount', 'Date', 'Status', 'Receipt', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div>{c.userName}</div>
                    <div className="text-xs text-gray-400">{c.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{c.category?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expenseDate}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-center">
                    {c.hasReceipt ? <span title="Receipt attached">📎</span> : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/manager/claims/${c.id}`}
                      className="btn-primary text-xs py-1 px-2.5 inline-block"
                    >
                      {c.status === 'PENDING' ? 'Review' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}

