export default function StatusBadge({ status }) {
  const cls = {
    PENDING:  'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
  }[status] || 'badge-pending'

  const label = {
    PENDING:  '⏳ Pending',
    APPROVED: '✅ Approved',
    REJECTED: '❌ Rejected',
  }[status] || status

  return <span className={cls}>{label}</span>
}

