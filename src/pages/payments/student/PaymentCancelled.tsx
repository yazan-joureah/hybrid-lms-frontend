// src/pages/student/PaymentCancelled.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../../../context/NavContext'
import { payService } from '../../../services/payService'
import { CHECKOUT_PATH } from '../../../routes/dynamicRoutes'

interface Props {
    paymentId: string | null
}

export default function PaymentCancelled({ paymentId }: Props) {
    const { navigate } = useNav()
    const routerNavigate = useNavigate()
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null)

    useEffect(() => {
        if (!paymentId) return
        payService.getPaymentStatus(paymentId)
            .then(p => setEnrollmentId(p?.enrollment_id || null))
            .catch(() => { /* تجاهل — زر "العودة إلى كورساتي" يبقى متاح دائماً كبديل */ })
    }, [paymentId])

    const handleRetry = () => {
        if (!enrollmentId) return
        routerNavigate(CHECKOUT_PATH(enrollmentId))
    }

    return (
        <div className="page-wrapper" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '36px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🚫</div>
                <h2 style={{ margin: '0 0 10px' }}>تم إلغاء عملية الدفع</h2>
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>لم يتم خصم أي مبلغ. يمكنك إعادة المحاولة في أي وقت.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
                    {enrollmentId && (
                        <button className="btn-primary" onClick={handleRetry}>إعادة المحاولة</button>
                    )}
                    <button className="btn-outline" onClick={() => navigate('my-courses')}>العودة إلى كورساتي</button>
                </div>
            </div>
        </div>
    )
}
