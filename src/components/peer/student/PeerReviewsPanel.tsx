// src/components/peer/student/PeerReviewsPanel.tsx
import type { useStudentPeerAssignment } from '../../../hooks/peer/useStudentPeerAssignment'
import { EmptyState } from '../../common/EmptyState'

type Props = ReturnType<typeof useStudentPeerAssignment>

export function PeerReviewsPanel({ reviews, reviewsLoading, startReview }: Props) {
    if (reviewsLoading) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>جارِ التحميل...</div>
    if (reviews.length === 0) return <EmptyState icon="📝" title="لا توجد مهام مراجعة مخصّصة لك حتى الآن" />

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map(r => (
                <div key={r.reviewId} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                        <strong style={{ fontSize: 13.5 }}>تسليم رقم #{r.submissionDisplayId ?? '—'}</strong>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{r.status === 'completed' ? '✅ تم إرسال مراجعتك' : '⏳ بانتظار مراجعتك'}</div>
                    </div>
                    {r.status === 'completed' ? (
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 10.5 }}>✓ مُرسلة</span>
                    ) : (
                        <button className="btn-primary" style={{ padding: '6px 18px', fontSize: 12.5 }} onClick={() => startReview(r)}>ابدأ المراجعة</button>
                    )}
                </div>
            ))}
        </div>
    )
}