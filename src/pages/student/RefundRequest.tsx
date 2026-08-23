import { useEffect, useState } from 'react'
import API from '../../config/api'

interface PaymentTransaction {
  _id: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export default function RefundRequestPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/payments/my-transactions')
        const list = (res.data?.data || []).filter((p: PaymentTransaction) => p.status === 'paid')
        setTransactions(list)
        if (list[0]) setSelectedPaymentId(list[0]._id)
      } catch (error) {
        console.error(error)
      }
    }

    void load()
  }, [])

  const handleSubmit = async () => {
    if (!selectedPaymentId) {
      setMessage('الرجاء اختيار معاملة أولاً.')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const res = await API.post(`/payments/${selectedPaymentId}/refund`, { reason })
      setMessage(res.data?.message || 'تم إرسال طلب الاسترداد بنجاح.')
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'تعذر إرسال طلب الاسترداد.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>طلب استرداد</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="form-group">
            <label className="field-label">المعاملة</label>
            <select className="form-input" value={selectedPaymentId} onChange={(e) => setSelectedPaymentId(e.target.value)}>
              {transactions.length === 0 ? <option value="">لا توجد معاملات مدفوعة</option> : transactions.map((item) => (
                <option key={item._id} value={item._id}>{item._id} — {Number(item.amount).toLocaleString()} {item.currency}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="field-label">سبب الاسترداد</label>
            <textarea className="form-input" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب الطلب..." />
          </div>

          {message && <div style={{ color: '#c4b5fd', background: 'rgba(124,58,237,0.12)', borderRadius: 10, padding: '10px 12px' }}>{message}</div>}

          <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !selectedPaymentId} style={{ justifyContent: 'center' }}>
            {submitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الاسترداد'}
          </button>
        </div>
      </div>
    </div>
  )
}
