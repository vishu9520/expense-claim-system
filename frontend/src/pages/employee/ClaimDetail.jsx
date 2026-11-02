import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'

export default function ClaimDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [claimRes, auditRes] = await Promise.all([
        claimService.getMyClaim(id),
        claimService.getAuditLogs(id)
      ])
      setClaim(claimRes.data.data)
      setAuditLogs(auditRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleDownloadReceipt = async () => {
    try {
      const res = await claimService.downloadReceipt(id)
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = claim.receiptName || `receipt-${id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download receipt.')
    }
  }

  const handleUploadReceipt = async (e) => {
    e.preventDefault()
    if (!receiptFile) return
    setUploading(true)
    try {
      await claimService.uploadReceipt(id, receiptFile)
      setReceiptFile(null)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this pending claim?')) return
    setDeleting(true)
    try {
      await claimService.deleteClaim(id)
      navigate('/employee/claims')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete claim')
      setDeleting(false)
    }
  }

  if (loading) return <Loading text="Loading claim..." />
  if (error) return (
    <div className="card text-center py-10">
      <p className="text-red-600 mb-4">{error}</p>
      <Link to="/employee/claims" className="btn-secondary">Back to Claims</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{claim.title}</h2>
            <StatusBadge status={claim.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Claim #{claim.id} • Submitted on {new Date(claim.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-2">
          <Link to="/employee/claims" className="btn-secondary">Back to List</Link>
          {claim.status === 'PENDING' && (
            <>
              <Link to={`/employee/claims/${claim.id}/edit`} className="btn-primary">Edit</Link>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Expense Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{Number(claim.amount).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium text-gray-800 mt-1">{claim.category?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Expense Date</p>
                <p className="font-medium text-gray-800 mt-1">{claim.expenseDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-800 mt-1">{new Date(claim.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                {claim.description || 'No description provided.'}
              </p>
            </div>

            {claim.managerComment && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm font-semibold text-red-800">Manager Comment / Reason:</p>
                <p className="text-sm text-red-700 mt-1">{claim.managerComment}</p>
              </div>
            )}
          </div>

          {/* Receipt Section */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Receipt Attachment</h3>
            {claim.hasReceipt ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📎</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{claim.receiptName}</p>
                    <p className="text-xs text-gray-500">Attached receipt</p>
                  </div>
                </div>
                <button onClick={handleDownloadReceipt} className="btn-secondary text-sm">
                  View / Download
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No receipt attached to this claim.</p>
            )}

            {claim.status === 'PENDING' && (
              <form onSubmit={handleUploadReceipt} className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={e => setReceiptFile(e.target.files[0] || null)}
                  className="text-sm text-gray-500 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
                />
                <button type="submit" disabled={!receiptFile || uploading} className="btn-primary text-sm whitespace-nowrap">
                  {uploading ? 'Uploading...' : claim.hasReceipt ? 'Replace Receipt' : 'Upload Receipt'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Audit Timeline</h3>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No activity logged.</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log, idx) => (
                <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                  <span className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-xs font-semibold text-gray-800">{log.action.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{log.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    By {log.userName} • {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

