// src/components/peer/student/PeerAssignmentView.tsx
import { useStudentPeerAssignment } from '../../../hooks/peer/useStudentPeerAssignment'
import { PeerSubmissionPanel } from './PeerSubmissionPanel'
import { PeerReviewsPanel } from './PeerReviewsPanel'
import { PeerGradePanel } from './PeerGradePanel'
import { ReviewSubmissionModal } from './ReviewSubmissionModal'
import type { PeerAssignment } from '../../../services/peerService'

const STATUS_META: Record<string, { label: string; color: string }> = {
    open: { label: 'مفتوحة للتسليم', color: '#22d3ee' },
    distributed: { label: 'تحت المراجعة', color: '#fbbf24' },
    completed: { label: 'مكتملة', color: '#34d399' },
}

interface Props {
    assignmentId: string
    assignmentMeta: PeerAssignment
    isSynchronous: boolean
    onCompleted?: () => void
}

export function PeerAssignmentView({ assignmentId, assignmentMeta, isSynchronous, onCompleted }: Props) {
    const p = useStudentPeerAssignment(assignmentId, assignmentMeta, isSynchronous, onCompleted)
    const { assignment, loadingAssignment, activeTab, switchTab, isAsync, isDistributed, attemptsExhausted, attemptNumber, maxAttempts, pendingReviewsCount } = p

    if (loadingAssignment) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>جارِ تحميل مهمة المراجعة الجماعية...</div>
    }

    const meta = STATUS_META[assignment.status] || STATUS_META.open
    const gradeAvailable = assignment.status !== 'open'

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>🤝 {assignment.title}</h2>
                    <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, fontSize: 10.5 }}>{meta.label}</span>
                    {isAsync && isDistributed && !attemptsExhausted && (
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 10.5 }}>⏳ تسليم متأخر مقبول</span>
                    )}
                    <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>{assignment.allowFileSubmission ? '📎 يقبل ملفات' : '📝 نص فقط'}</span>
                    <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>محاولة {attemptNumber} / {maxAttempts}</span>
                </div>
                {assignment.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{assignment.description}</p>}
            </div>

            <div className="tab-bar" style={{ marginBottom: 20, display: 'inline-flex' }}>
                <div className={`tab-item${activeTab === 'submission' ? ' active' : ''}`} onClick={() => switchTab('submission')}>📤 تسليمي</div>
                {assignment.status !== 'open' && (
                    <div className={`tab-item${activeTab === 'reviews' ? ' active' : ''}`} onClick={() => switchTab('reviews')}>
                        📝 مراجعات مطلوبة مني {pendingReviewsCount > 0 && `(${pendingReviewsCount})`}
                    </div>
                )}
                {gradeAvailable && (
                    <div className={`tab-item${activeTab === 'grade' ? ' active' : ''}`} onClick={() => switchTab('grade')}>🎯 درجتي النهائية</div>
                )}
            </div>

            {activeTab === 'submission' && <PeerSubmissionPanel {...p} />}
            {activeTab === 'reviews' && <PeerReviewsPanel {...p} />}
            {activeTab === 'grade' && <PeerGradePanel {...p} />}

            <ReviewSubmissionModal {...p} />
        </div>
    )
}