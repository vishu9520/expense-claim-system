import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'

export default function ManagerClaimDetail() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Action modal
  const [modalOpen, setModalOpen] = useState(false)
  const [actionType, setActionType] = useState('APPROVED') // 'APPROVED' | 'REJECTED'
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [claimRes, auditRes] = await Promise.all([
        claimService.getManagerClaim(id),
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
      alert('Failed to download receipt')
    }
  }

  const openActionModal = (type) => {
    setActionType(type)
    setComment('')
    setCommentError('')
    setModalOpen(true)
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    if (actionType === 'REJECTED' && !comment.trim()) {
      setCommentError('Comment is mandatory when rejecting a claim.')
      return
    }

    setSubmittingAction(true)
    try {
      await claimService.processAction(id, {
        action: actionType,
        comment: comment.trim() || undefined
      })
      setModalOpen(false)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) return <Loading text="Loading claim..." />
  if (error) return (
    <div className="card text-center py-10">
      <p className="text-red-600 mb-4">{error}</p>
      <Link to="/manager/claims" className="btn-secondary">Back to All Claims</Link>
    </div>
  )

  const isPending = claim.status === 'PENDING'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{claim.title}</h2>
            <StatusBadge status={claim.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Claim #{claim.id} • Submitted by <span className="font-semibold text-gray-700">{claim.userName}</span> ({claim.userEmail})
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/manager/claims" className="btn-secondary">← Back</Link>
          {isPending && (
            <>
              <button onClick={() => openActionModal('APPROVED')} className="btn-success">
                Approve
              </button>
              <button onClick={() => openActionModal('REJECTED')} className="btn-danger">
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Claim Summary</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{Number(claim.amount).toLocaleString('en-IN')}</p>
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
                <p className="text-gray-500">Submission Date</p>
                <p className="font-medium text-gray-800 mt-1">{new Date(claim.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                {claim.description || 'No description provided.'}
              </p>
            </div>

            {claim.managerComment && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-gray-800">Manager Comment:</p>
                <p className="text-sm text-gray-700 mt-1">{claim.managerComment}</p>
              </div>
            )}
          </div>

          {/* Receipt View/Download */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Attached Receipt</h3>
            {claim.hasReceipt ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{claim.receiptName}</p>
                    <p className="text-xs text-gray-500">Receipt proof uploaded by employee</p>
                  </div>
                </div>
                <button onClick={handleDownloadReceipt} className="btn-primary text-sm">
                  View / Download File
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No receipt file uploaded for this claim.</p>
            )}
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg border-b pb-2">Audit History</h3>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No actions recorded.</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map(log => (
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

      {/* Approve / Reject Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={actionType === 'APPROVED' ? 'Approve Expense Claim' : 'Reject Expense Claim'}
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            {actionType === 'APPROVED'
              ? 'Are you sure you want to approve this claim? This action is permanent and cannot be undone.'
              : 'Please provide a reason for rejecting this claim. A comment is mandatory.'}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {actionType === 'REJECTED' ? 'Rejection Reason *' : 'Optional Comment'}
            </label>
            <textarea
              rows="3"
              value={comment}
              placeholder={actionType === 'REJECTED' ? 'Explain why this claim is rejected...' : 'Optional notes...'}
              onChange={e => { setComment(e.target.value); setCommentError('') }}
              className={`input-field ${commentError ? 'border-red-400' : ''}`}
            />
            {commentError && <p className="text-xs text-red-500 mt-1">{commentError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAction}
              className={actionType === 'APPROVED' ? 'btn-success' : 'btn-danger'}
            >
              {submittingAction ? 'Processing...' : actionType === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

