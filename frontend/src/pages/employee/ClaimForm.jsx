import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { claimService } from '../../services/claimService'
import Loading from '../../components/common/Loading'

const CATEGORIES = [
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'FOOD', label: 'Food & Meals' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'OTHER', label: 'Other' },
]

export default function ClaimForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'TRAVEL',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [receiptFile, setReceiptFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    if (isEdit) {
      claimService.getMyClaim(id)
        .then(res => {
          const c = res.data.data
          if (c.status !== 'PENDING') {
            alert('Only PENDING claims can be edited.')
            navigate('/employee/claims')
            return
          }
          setForm({
            title: c.title,
            amount: c.amount,
            category: c.category,
            expenseDate: c.expenseDate,
            description: c.description || '',
          })
        })
        .catch(err => {
          setApiError(err.response?.data?.message || 'Failed to fetch claim')
        })
        .finally(() => setFetching(false))
    }
  }, [id, isEdit, navigate])

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Amount must be greater than 0'
    if (!form.category) e.category = 'Category is required'
    if (!form.expenseDate) e.expenseDate = 'Expense date is required'
    else if (new Date(form.expenseDate) > new Date()) e.expenseDate = 'Expense date cannot be in the future'

    if (receiptFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(receiptFile.type)) {
        e.receipt = 'Only JPEG, PNG, and PDF files are allowed'
      } else if (receiptFile.size > 10 * 1024 * 1024) {
        e.receipt = 'File size must be 10MB or less'
      }
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setApiError('')

    try {
      let claimId = id
      if (isEdit) {
        await claimService.updateClaim(id, form)
      } else {
        const res = await claimService.createClaim(form)
        claimId = res.data.data.id
      }

      if (receiptFile && claimId) {
        await claimService.uploadReceipt(claimId, receiptFile)
      }

      navigate(`/employee/claims/${claimId}`)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save claim.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <Loading text="Loading claim details..." />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Claim' : 'Create New Claim'}</h2>
          <p className="text-gray-500 text-sm mt-1">Submit your business expenses for manager approval</p>
        </div>
        <Link to="/employee/claims" className="btn-secondary">Cancel</Link>
      </div>

      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{apiError}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Claim Title *</label>
          <input
            type="text"
            value={form.title}
            placeholder="e.g. Flight to Mumbai client office"
            onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
            className={`input-field ${errors.title ? 'border-red-400' : ''}`}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              placeholder="0.00"
              onChange={e => { setForm({ ...form, amount: e.target.value }); setErrors({ ...errors, amount: '' }) }}
              className={`input-field ${errors.amount ? 'border-red-400' : ''}`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="input-field"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date *</label>
          <input
            type="date"
            value={form.expenseDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => { setForm({ ...form, expenseDate: e.target.value }); setErrors({ ...errors, expenseDate: '' }) }}
            className={`input-field ${errors.expenseDate ? 'border-red-400' : ''}`}
          />
          {errors.expenseDate && <p className="text-xs text-red-500 mt-1">{errors.expenseDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            rows="3"
            value={form.description}
            placeholder="Details on the purpose of expense..."
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt Attachment {isEdit ? '(Upload new to replace existing)' : '(Optional, Max 10MB: JPEG, PNG, PDF)'}
          </label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={e => {
              setReceiptFile(e.target.files[0] || null)
              setErrors({ ...errors, receipt: '' })
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {errors.receipt && <p className="text-xs text-red-500 mt-1">{errors.receipt}</p>}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <Link to="/employee/claims" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : isEdit ? 'Save Changes' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  )
}

