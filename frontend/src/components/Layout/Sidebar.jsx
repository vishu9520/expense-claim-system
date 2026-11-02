import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const employeeLinks = [
  { to: '/employee/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/employee/claims', label: 'My Claims', icon: '📋' },
  { to: '/employee/claims/new', label: 'New Claim', icon: '➕' },
]

const managerLinks = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/manager/claims', label: 'All Claims', icon: '📋' },
  { to: '/manager/users', label: 'Manage Users', icon: '👥' },
]

export default function Sidebar() {
  const { isManager } = useAuth()
  const links = isManager() ? managerLinks : employeeLinks

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {isManager() ? 'Manager Panel' : 'Employee Panel'}
        </p>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }>
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

