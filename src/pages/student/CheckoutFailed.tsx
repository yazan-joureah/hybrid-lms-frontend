import { useNavigate } from 'react-router-dom'

export default function CheckoutFailed() {
  const navigate = useNavigate()

  return (
    <div className="page-wrapper" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
        <h2 style={{ margin: '0 0 12px', fontSize: 28 }}>فشل الدفع</h2>
        <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.8 }}>
          لم تكتمل عملية الدفع. يمكن إعادة المحاولة أو استخدام طريقة دفع مختلفة.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/student/courses')}>عودة إلى الكورسات</button>
          <button className="btn-outline" onClick={() => navigate('/student/checkout')}>إعادة المحاولة</button>
        </div>
      </div>
    </div>
  )
}
