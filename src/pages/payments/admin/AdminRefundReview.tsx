// src/pages/admin/refunds/AdminRefundReview.tsx
import { useState, useEffect } from 'react'
import { useToast } from '../../../context/ToastContext'
import { payService, type RefundRequestListItem } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { SkeletonLoader } from '../../../components/common/Loading'

export default function AdminRefundReview() {
    const { success, error: toastError } = useToast()
    const [requests, setRequests] = useState<RefundRequestListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({})
    const [actingId, setActingId] = useState<string | null>(null)

    useEffect(() => { void fetchRequests() }, [])

    const fetchRequests = async () => {
        setLoading(true)
        try {
            setRequests(await payService.getRefundRequests({ status: 'review_pending', limit: 50 }))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
        setActingId(id)
        try {
            await payService.reviewRefund(id, decision, reasonDrafts[id])
            success(decision === 'approve' ? 'تمت الموافقة على الاسترداد.' : 'تم رفض الاسترداد.')
            setRequests(prev => prev.filter(r => r._id !== id))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setActingId(null)
        }
    }

    if (loading) {
        return (
            <div className="page-wrapper">
                <SkeletonLoader type="row" count={3} />
            </div>
        )
    }

    return (
        <div className="page-wrapper">
            <div style={{ marginBottom: 20 }}>
                <h2 className="section-title">طلبات الاسترداد المعلّقة</h2>
            </div>

            {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                    <div style={{ fontSize: 15.5 }}>لا توجد طلبات استرداد بانتظار المراجعة.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {requests.map(r => (
                        <div key={r._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                    <h4 style={{ margin: '0 0 4px' }}>{r.payment_id?.course_id?.title || 'كورس غير معروف'}</h4>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, margin: 0 }}>
                                        {r.student_id?.full_name} ({r.student_id?.email})
                                    </p>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>
                                    {Number(r.payment_id?.amount || 0).toLocaleString()} {r.payment_id?.currency?.toUpperCase()}
                                </div>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, marginBottom: 12 }}>
                                تاريخ الدفع: {r.payment_id?.paid_at ? new Date(r.payment_id.paid_at).toLocaleDateString('ar') : '—'}
                                {' '}•{' '}
                                تاريخ الطلب: {new Date(r.createdAt).toLocaleDateString('ar')}
                            </p>

                            {r.reason && (
                                <p style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                                    <strong>سبب الطالب: </strong>{r.reason}
                                </p>
                            )}

                            <div style={{ marginBottom: 14 }}>
                                <label className="form-label">ملاحظة القرار (اختياري)</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={reasonDrafts[r._id] || ''}
                                    onChange={e => setReasonDrafts(prev => ({ ...prev, [r._id]: e.target.value }))}
                                    placeholder="سبب الموافقة أو الرفض..."
                                    disabled={actingId === r._id}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                                    disabled={actingId === r._id}
                                    onClick={() => handleDecision(r._id, 'reject')}
                                >
                                    رفض
                                </button>
                                <button
                                    className="btn-primary"
                                    disabled={actingId === r._id}
                                    onClick={() => handleDecision(r._id, 'approve')}
                                >
                                    {actingId === r._id ? '...جارٍ التنفيذ' : 'موافقة واسترداد'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}