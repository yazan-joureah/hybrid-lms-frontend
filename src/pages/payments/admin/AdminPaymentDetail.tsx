// src/pages/admin/payments/AdminPaymentDetail.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNav } from '../../../context/NavContext'
import { useToast } from '../../../context/ToastContext'
import { payService, getCourseTitle, getStudentLabel, getStudentEmail, type Payment } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { SkeletonLoader } from '../../../components/common/Loading'


const STATUS_LABELS: Record<string, string> = {
    paid: 'مدفوع', pending: 'قيد الانتظار', failed: 'فشل', refunded: 'مسترد',
}

const REFUND_STATUS_LABELS: Record<string, string> = {
    review_pending: 'قيد المراجعة', approved: 'تمت الموافقة', rejected: 'مرفوض',
}

export default function AdminPaymentDetail() {
    const { navigate } = useNav()
    const { error: toastError } = useToast()
    const { paymentId } = useParams<{ paymentId: string }>()
    const [payment, setPayment] = useState<Payment | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        if (!paymentId) {
            setNotFound(true)
            setLoading(false)
            return
        }
        setLoading(true)
        payService.adminGetPayment(paymentId)
            .then(p => {
                if (!p) {
                    setNotFound(true)
                    return
                }
                setPayment(p)
            })
            .catch(err => {
                toastError(getErrorMessage(err))
                setNotFound(true)
            })
            .finally(() => setLoading(false))

    }, [paymentId])

    if (loading) {
        return <div className="page-wrapper"><SkeletonLoader type="card" count={1} /></div>
    }

    if (notFound || !payment) {
        return (
            <div className="page-wrapper">
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>🧾</div>
                    <h3 style={{ marginBottom: 8 }}>لم يتم العثور على المعاملة</h3>
                    <button className="btn-primary" onClick={() => navigate('admin-payments')}>العودة لسجل المدفوعات</button>
                </div>
            </div>
        )
    }

    const courseTitle = getCourseTitle(payment.course_id)
    const studentName = getStudentLabel(payment.student_id)
    const studentEmail = getStudentEmail(payment.student_id)

    return (
        <div className="page-wrapper" style={{ maxWidth: 760 }}>
            <button className="btn-outline" style={{ marginBottom: 16 }} onClick={() => navigate('admin-payments')}>→ العودة لسجل المدفوعات</button>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                    <h2 style={{ margin: 0 }}>تفاصيل المعاملة</h2>
                    <span className="badge">{STATUS_LABELS[payment.status] || payment.status}</span>
                </div>

                <div className="admin-two-col" style={{ fontSize: 13.5 }}>
                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>معرّف المعاملة: </span>{payment._id}</div>
                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>الكورس: </span>{courseTitle}</div>
                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>الطالب: </span>{studentName}{studentEmail ? ` (${studentEmail})` : ''}</div>
                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>المبلغ: </span>{Number(payment.amount).toLocaleString()} {payment.currency?.toUpperCase()}</div>
                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>تاريخ الإنشاء: </span>{new Date(payment.createdAt).toLocaleString('ar')}</div>
                    {payment.paid_at && <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>تاريخ الدفع: </span>{new Date(payment.paid_at).toLocaleString('ar')}</div>}
                    {payment.failure_reason && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'rgba(255,255,255,0.5)' }}>سبب الفشل: </span>{payment.failure_reason}</div>}
                </div>

                {payment.refund_request && (
                    <div style={{ marginTop: 20, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>طلب استرداد</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                            الحالة: {REFUND_STATUS_LABELS[payment.refund_request.status] || payment.refund_request.status}
                        </div>
                        {payment.refund_request.decision_reason && (
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                                سبب القرار: {payment.refund_request.decision_reason}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}