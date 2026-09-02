// src/pages/admin/accounts/DeletionRequestsList.tsx
import { useState } from 'react'
import { useDeletionRequests } from '../../../hooks/admin/useDeletionRequests'
import { AccountReasonModal } from './AccountReasonModal'
import { SkeletonLoader } from '../../../components/common/Loading'
import type { DeletionRequestItem } from '../../../services/adminAccountService'

export function DeletionRequestsList() {
    const { requests, loading, reviewingId, review } = useDeletionRequests()
    const [rejectTarget, setRejectTarget] = useState<DeletionRequestItem | null>(null)

    if (loading) return <SkeletonLoader type="row" count={3} />

    if (requests.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                <div style={{ fontSize: 15.5 }}>لا توجد طلبات حذف حسابات بانتظار المراجعة.</div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map(r => (
                <div key={r._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div>
                            <h4 style={{ margin: '0 0 4px' }}>{r.user_id?.full_name || 'مستخدم غير معروف'}</h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, margin: 0 }}>
                                {r.user_id?.email} · {r.user_id?.role}
                            </p>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                            {r.requested_at ? new Date(r.requested_at).toLocaleDateString('ar') : ''}
                        </span>
                    </div>

                    <p style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                        <strong>السبب: </strong>{r.reason}
                    </p>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button
                            className="btn-secondary"
                            style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                            disabled={reviewingId === r._id}
                            onClick={() => setRejectTarget(r)}
                        >
                            رفض
                        </button>
                        <button
                            className="btn-primary"
                            disabled={reviewingId === r._id}
                            onClick={() => review(r._id, 'approve')}
                        >
                            {reviewingId === r._id ? '...جارٍ التنفيذ' : 'موافقة على الحذف'}
                        </button>
                    </div>
                </div>
            ))}

            {rejectTarget && (
                <AccountReasonModal
                    title={`رفض طلب حذف حساب ${rejectTarget.user_id?.full_name || ''}`}
                    description="سبب الرفض إلزامي وسيتم إشعار المستخدم لاحقاً (إن وُجد ربط بريدي)."
                    confirmLabel="رفض الطلب"
                    danger
                    submitting={reviewingId === rejectTarget._id}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={async (reason) => {
                        const ok = await review(rejectTarget._id, 'reject', reason)
                        if (ok) setRejectTarget(null)
                    }}
                />
            )}
        </div>
    )
}