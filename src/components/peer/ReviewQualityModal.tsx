// src/components/peer/ReviewQualityModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import { useReviewQuality } from '../../hooks/peer/useReviewQuality'
import type { PeerAssignment } from '../../services/peerService'

interface Props { assignment: PeerAssignment; onClose: () => void }

export function ReviewQualityModal({ assignment, onClose }: Props) {
    const { timeline, loading } = useReviewQuality(assignment._id)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    return (
        <ModalPortal >
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>جودة المراجعات: {assignment.title}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ padding: 24, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                        ) : timeline.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>لا توجد تسليمات بعد.</div>
                        ) : (
                            timeline.map(entry => {
                                const isExpanded = expandedId === entry.submissionId
                                return (
                                    <div key={entry.submissionId} style={{ marginBottom: 14, padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : entry.submissionId)}>
                                            <div>
                                                <strong style={{ fontSize: 14 }}>{entry.student?.name || 'طالب محذوف'}</strong>
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>({entry.student?.email})</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                {entry.totalAttempts > 1 && <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 10.5 }}>{entry.totalAttempts} محاولات</span>}
                                                <span style={{ fontWeight: 800, fontSize: 14 }}>{entry.currentFinalScorePercentage != null ? `${entry.currentFinalScorePercentage}%` : 'قيد التصحيح'}</span>
                                                {entry.gradeOverridden && <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', fontSize: 10.5 }}>معدَّلة يدوياً</span>}
                                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isExpanded ? '▲' : '▼'}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                {entry.attempts.map(attempt => (
                                                    <div key={attempt.attemptNumber} style={{ borderRight: `3px solid ${attempt.isCurrentAttempt ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`, paddingRight: 12, opacity: attempt.isCurrentAttempt ? 1 : 0.7 }}>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                                                            <strong>المحاولة {attempt.attemptNumber}</strong>
                                                            {attempt.isCurrentAttempt && <span className="badge" style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', fontSize: 10 }}>الحالية</span>}
                                                            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)' }}>
                                                                {attempt.reviewsCompleted}/{attempt.reviewsAssigned} مراجعة مكتملة{attempt.averageScore != null && ` — متوسط: ${attempt.averageScore}%`}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            {attempt.reviews.map(r => (
                                                                <div key={r.reviewId} style={{ background: 'rgba(255,255,255,0.03)', padding: '9px 12px', borderRadius: 8, fontSize: 12.5 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span>👤 {r.reviewer?.name || 'مراجِع غير معروف'} <span style={{ color: 'rgba(255,255,255,0.4)' }}>({r.reviewer?.email})</span></span>
                                                                        {r.status === 'completed' ? <strong>{r.totalScore}%</strong> : <span style={{ color: 'rgba(255,255,255,0.4)' }}>لم يُقيّم بعد</span>}
                                                                    </div>
                                                                    {r.feedbackText && <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.6)' }}>💬 {r.feedbackText}</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal >
    )
}