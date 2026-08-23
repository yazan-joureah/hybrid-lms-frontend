import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import API from '../../config/api'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('جارٍ تأكيد الدفع...')

  useEffect(() => {
    const paymentId = searchParams.get('paymentId')
    const mock = searchParams.get('mock') === '1'

    const finalize = async () => {
      try {
        if (mock && paymentId) {
          await API.post('/payments/webhook', {
            type: 'checkout.session.completed',
            data: {
              object: {
                id: `mock_session_${paymentId}`,
                payment_intent: `mock_pi_${paymentId}`,
              },
            },
          })
        }

        if (paymentId) {
          const res = await API.get(`/payments/${paymentId}`)
          const payment = res.data?.data
          if (payment?.status === 'paid') {
            setStatus('success')
            setMessage('تم الدفع بنجاح وتم تفعيل الوصول إلى الدورة.')
            return
          }
        }

        setStatus('success')
        setMessage('تمت معالجة الطلب بنجاح. يمكنك الآن متابعة الدورة.')
      } catch (error: any) {
        setStatus('error')
        setMessage(error?.response?.data?.message || 'تعذر تأكيد الدفع. الرجاء التواصل مع الدعم.')
      }
    }

    void finalize()
  }, [searchParams])

  return (
    <div className="page-wrapper" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{status === 'success' ? '✅' : status === 'error' ? '⚠️' : '⏳'}</div>
        <h2 style={{ margin: '0 0 12px', fontSize: 28 }}>{status === 'success' ? 'تمت العملية بنجاح' : status === 'error' ? 'فشل التأكيد' : 'جاري تأكيد الدفع'}</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>{message}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/student/my-courses')}>الذهاب إلى كورساتي</button>
          <button className="btn-outline" onClick={() => navigate('/student/transactions')}>عرض المعاملات</button>
        </div>
      </div>
    </div>
  )
}
