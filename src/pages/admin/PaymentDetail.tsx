import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../../config/api'

export default function PaymentDetailPage() {
  const { id } = useParams()
  const [payment, setPayment] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await API.get(`/payments/${id}`)
        setPayment(res.data?.data || null)
      } catch (error) {
        console.error(error)
      }
    }

    void load()
  }, [id])

  if (!payment) {
    return <div className="page-wrapper">جارٍ تحميل تفاصيل الدفع...</div>
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>تفاصيل المعاملة</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><strong>المعرف:</strong> {payment._id}</div>
          <div><strong>الحالة:</strong> {payment.status}</div>
          <div><strong>المستخدم:</strong> {payment.userId}</div>
          <div><strong>الدورة:</strong> {payment.courseId}</div>
          <div><strong>المبلغ:</strong> {Number(payment.amount).toLocaleString()} {payment.currency}</div>
          <div><strong>المزود:</strong> {payment.provider}</div>
          <div><strong>جلسة الدفع:</strong> {payment.providerSessionId || '—'}</div>
          <div><strong>الإصدار:</strong> {new Date(payment.createdAt).toLocaleString('ar-EG')}</div>
        </div>
      </div>
    </div>
  )
}
