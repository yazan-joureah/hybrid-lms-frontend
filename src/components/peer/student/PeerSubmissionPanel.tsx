// src/components/peer/student/PeerSubmissionPanel.tsx
import type { useStudentPeerAssignment } from '../../../hooks/peer/useStudentPeerAssignment'

type Props = ReturnType<typeof useStudentPeerAssignment>

export function PeerSubmissionPanel(p: Props) {
    const { assignment, mySubmission, hasGrade, gradeData, attemptsExhausted, attemptNumber, attemptsRemaining, maxAttempts,
        canSubmit, isReviewDeadlinePassed, isCompleted, isDistributed, isAsync,
        submissionText, setSubmissionText, submissionFile, setSubmissionFile, submitting, submitAssignment } = p

    return (
        <div>
            {hasGrade && gradeData && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>درجتك الحالية</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: attemptsExhausted ? '#34d399' : '#fbbf24' }}>{gradeData.finalScorePercentage}%</div>
                            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>المحاولة {attemptNumber} من {maxAttempts}</div>
                        </div>
                        {attemptsExhausted ? (
                            <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13.5 }}>🔒 استنفدت جميع المحاولات</span>
                        ) : (
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13.5 }}>متبقي {attemptsRemaining} محاولة</span>
                        )}
                    </div>
                    {!attemptsExhausted && (
                        <div style={{ marginTop: 12, padding: 12, background: 'rgba(245,158,11,0.08)', borderRadius: 10, fontSize: 12.5, color: '#fbbf24' }}>
                            💡 يمكنك إعادة التسليم لتحسين درجتك. سيتم استبدال درجتك الحالية وبدء جولة مراجعة جديدة من قبل زملائك.
                        </div>
                    )}
                </div>
            )}

            {mySubmission && (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ color: '#34d399', fontWeight: 600, fontSize: 13.5 }}>✅ لديك تسليم — {new Date(mySubmission.submittedAt).toLocaleString('ar')}</span>
                    <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>{mySubmission.fileId ? '📎 ملف مرفق' : 'نص فقط'}</span>
                </div>
            )}

            {canSubmit ? (
                <div>
                    <div style={{ marginBottom: 14 }}>
                        <label className="form-label">محتوى نصي {mySubmission ? '(سيتم استبدال التسليم السابق)' : ''}</label>
                        <div style={{ marginBottom: 14 }}>
                            <textarea className="form-input" rows={6} placeholder="اكتب حلّك هنا..." value={submissionText} onChange={e => setSubmissionText(e.target.value)} style={{ resize: 'vertical' }} />
                        </div>

                        {assignment.allowFileSubmission ? (
                            <div style={{ marginBottom: 16 }}>
                                <label className="form-label">أو أرفق ملفاً (PDF / ZIP / Word / نص)</label>
                                <input type="file" accept=".pdf,.zip,.docx,.txt" onChange={e => setSubmissionFile(e.target.files?.[0] || null)} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }} />
                            </div>
                        ) : (
                            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>ℹ️ هذه المهمة تقبل تسليماً نصياً فقط.</p>
                        )}

                        <button
                            className="btn-primary" style={{ padding: '10px 26px', fontSize: 13.5 }}
                            disabled={submitting || (!submissionText.trim() && !(assignment.allowFileSubmission && submissionFile))}
                            onClick={submitAssignment}
                        >
                            {submitting ? 'جارٍ الإرسال...' : mySubmission ? 'إرسال محاولة جديدة' : 'إرسال الحل'}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {attemptsExhausted ?
                        '🔒 لقد استنفدت جميع المحاولات المسموحة لهذه المهمة. لا يمكن إجراء تسليمات إضافية.'
                        : isCompleted ?
                            '✅ تم إتمام هذه المهمة. لن يتم قبول تسليمات جديدة بعد الآن.'
                            : isDistributed && !isAsync ?
                                '⏳ انتهى موعد التسليم لهذه المهمة (كورس متزامن). لا يمكن قبول تسليمات جديدة.'
                                : isDistributed && isAsync && isReviewDeadlinePassed ?
                                    '⏳ انتهى الموعد النهائي لقبول التسليمات المتأخرة لهذه المهمة.'
                                    : '🚫 التسليم مغلق حالياً لهذه المهمة. يرجى مراجعة التعليمات أو التواصل مع المدرب.'}
                </div>
            )}
        </div>
    )
}