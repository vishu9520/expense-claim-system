import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import Pagination from '../../components/common/Pagination'

const STATUSES = ['', 'PENDING', 'APPROVED', 'REJECTED']

export default function ClaimList() {
  const [claims, setClaims] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const fetchClaims = useCallback(() => {
    setLoading(true)
    const params = { page, size: 10 }
    if (status) params.status = status
    if (search) params.search = search
    claimService.getMyClaims(params)
      .then(res => {
        setClaims(res.data.data.content)
        setTotalPages(res.data.data.totalPages)
      })
      .catch(() => setError('Failed to load claims.'))
      .finally(() => setLoading(false))
  }, [page, status, search])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this claim?')) return
    setDeleting(id)
    try {
      await claimService.deleteClaim(id)
      fetchClaims()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Claims</h2>
        <Link to="/employee/claims/new" className="btn-primary">+ New Claim</Link>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) }}}
          placeholder="Search claims... (press Enter)"
          className="input-field w-64" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
          className="input-field w-40">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <button onClick={() => { setSearch(searchInput); setPage(0) }} className="btn-secondary">Search</button>
        <button onClick={() => { setSearch(''); setSearchInput(''); setStatus(''); setPage(0) }}
          className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
      </div>

      {loading ? <Loading /> : error ? (
        <div className="text-red-500">{error}</div>
      ) : claims.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No claims found.</p>
          <Link to="/employee/claims/new" className="btn-primary inline-block mt-4">Submit Your First Claim</Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title','Category','Amount','Date','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{c.category.replace('_',' ')}</td>
                  <td className="px-4 py-3 font-semibold">₹{Number(c.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expenseDate}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/employee/claims/${c.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium">View</Link>
                      {c.status === 'PENDING' && (<>
                        <Link to={`/employee/claims/${c.id}/edit`}
                          className="text-yellow-600 hover:underline text-xs font-medium">Edit</Link>
                        <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                          className="text-red-600 hover:underline text-xs font-medium disabled:opacity-50">
                          {deleting === c.id ? '...' : 'Delete'}
                        </button>
                      </>)}
                    </div>
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

