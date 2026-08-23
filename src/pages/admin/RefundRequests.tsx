import { useEffect, useState } from 'react'
import API from '../../config/api'

interface RefundRequest {
  _id: string
  paymentId: string
  userId: string
  reason: string
  status: string
}

export default function RefundRequestsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([])

  const load = async () => {
    try {
      const res = await API.get('/admin/refund-requests')
      setRefunds(res.data?.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => { void load() }, [])

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    try {
      await API.post(`/admin/refund-requests/${id}/${action}`)
      await load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 16 }}>
        <h2 className="section-title" style={{ margin: 0 }}>طلبات الاسترداد</h2>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {refunds.map((refund) => (
          <div key={refund._id} className="card-surface" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800 }}>{refund.paymentId}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>طالب: {refund.userId}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>السبب</div>
              <div>{refund.reason}</div>
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>الحالة</div>
              <div>{refund.status}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={() => handleDecision(refund._id, 'approve')} style={{ padding: '8px 12px' }}>قبول</button>
              <button className="btn-outline" onClick={() => handleDecision(refund._id, 'reject')} style={{ padding: '8px 12px' }}>رفض</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
