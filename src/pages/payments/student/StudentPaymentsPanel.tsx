// src/pages/payments/student/StudentPaymentsPanel.tsx
import { useState, useEffect } from 'react'
import { useToast } from '../../../context/ToastContext'
import { payService, formatCurrency, type Payment, type PaymentStatus, type RefundStatus } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { SkeletonLoader } from '../../../components/common/Loading'
import { RefundRequestModal } from './RefundRequestModal'

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
    pending: { label: 'قيد الانتظار', color: '#fbbf24' },
    paid: { label: 'مدفوع', color: '#10b981' },
    failed: { label: 'فشل', color: '#f87171' },
    refunded: { label: 'مُسترَد', color: 'rgba(255,255,255,0.5)' },
}

const REFUND_STATUS_LABELS: Record<RefundStatus, { label: string; color: string }> = {
    review_pending: { label: 'الاسترداد قيد المراجعة', color: '#fbbf24' },
    approved: { label: 'تمت الموافقة على الاسترداد', color: '#10b981' },
    rejected: { label: 'رُفض الاسترداد', color: '#f87171' },
}

// عنصر مستقل (بدون page-wrapper) عشان ينلصق داخل تبويب البروفايل مباشرة
export function StudentPaymentsPanel() {
    const { success, error: toastError } = useToast()
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => { void fetchPayments() }, [])

    const fetchPayments = async () => {
        setLoading(true)
        try {
            setPayments(await payService.getMyPayments({ limit: 50 }))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const handleRefundSubmit = async (reason?: string) => {
        if (!refundTarget) return
        setSubmitting(true)
        try {
            await payService.requestRefund(refundTarget._id, reason)
            success('تم إرسال طلب الاسترداد بنجاح.')
            setRefundTarget(null)
            await fetchPayments()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <SkeletonLoader type="row" count={3} />

    if (payments.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
                <div style={{ fontSize: 14.5 }}>لا توجد مدفوعات بعد.</div>
            </div>
        )
    }

    return (
        <>
            <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', minWidth: 640 }}>
                    <thead>
                        <tr><th>الكورس</th><th>المبلغ</th><th>الحالة</th><th>تاريخ الدفع</th><th>الاسترداد</th><th></th></tr>
                    </thead>
                    <tbody>
                        {payments.map(p => {
                            const statusInfo = STATUS_LABELS[p.status]
                            const refundInfo = p.refund_request ? REFUND_STATUS_LABELS[p.refund_request.status] : null
                            const canRequestRefund = p.status === 'paid' && !p.refund_request
                            const courseTitle = typeof p.course_id === 'object' ? p.course_id.title : 'N/A'

                            return (
                                <tr key={p._id}>
                                    <td>{courseTitle}</td>
                                    <td style={{ fontWeight: 700 }}>{formatCurrency(p.amount, p.currency)}</td>
                                    <td>
                                        <span className="badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color, border: `1px solid ${statusInfo.color}66` }}>
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td style={{ color: 'rgba(255,255,255,0.55)' }}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString('ar') : '—'}</td>
                                    <td>
                                        {refundInfo ? (
                                            <span className="badge" style={{ background: `${refundInfo.color}22`, color: refundInfo.color, border: `1px solid ${refundInfo.color}66` }}>
                                                {refundInfo.label}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        {canRequestRefund && (
                                            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => setRefundTarget(p)}>
                                                طلب استرداد
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {refundTarget && (
                <RefundRequestModal
                    payment={refundTarget}
                    submitting={submitting}
                    onClose={() => setRefundTarget(null)}
                    onSubmit={handleRefundSubmit}
                />
            )}
        </>
    )
}