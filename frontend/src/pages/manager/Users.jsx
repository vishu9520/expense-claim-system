import { useEffect, useState } from 'react'
import { userService } from '../../services/userService'
import Loading from '../../components/common/Loading'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    userService.getAll()
      .then(res => setUsers(res.data.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (user) => {
    if (user.role === 'MANAGER') {
      alert('Manager account cannot be deactivated.')
      return
    }

    const actionText = user.active ? 'deactivate' : 'activate'
    if (!window.confirm(`Are you sure you want to ${actionText} ${user.name}?`)) return

    setUpdatingId(user.id)
    try {
      if (user.active) {
        await userService.deactivate(user.id)
      } else {
        await userService.activate(user.id)
      }
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <Loading text="Loading users..." />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-500 text-sm mt-1">
          Activate or deactivate employee accounts. Deactivated users are blocked from logging in.
        </p>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['ID', 'Name', 'Email', 'Role', 'Status', 'Registered At', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{u.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Deactivated
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {u.role === 'MANAGER' ? (
                    <span className="text-xs text-gray-400 italic">Protected</span>
                  ) : (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={updatingId === u.id}
                      className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                        u.active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {updatingId === u.id ? 'Saving...' : u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

