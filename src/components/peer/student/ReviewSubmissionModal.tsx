// src/components/peer/student/ReviewSubmissionModal.tsx
import { ModalPortal } from '../../common/ModalPortal'
import type { useStudentPeerAssignment } from '../../../hooks/peer/useStudentPeerAssignment'

type Props = ReturnType<typeof useStudentPeerAssignment>

export function ReviewSubmissionModal(p: Props) {
    const { assignment, activeReview, setActiveReview, reviewScores, setReviewScore, reviewFeedback, setReviewFeedback, submittingReview, submitReviewForActive, downloadReviewFile } = p
    if (!activeReview) return null

    return (
        <ModalPortal >
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 800 }}>مراجعة تسليم #{activeReview.content.displaySequentialId}</h4>
                        <button onClick={() => setActiveReview(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 17, cursor: 'pointer' }}>✕</button>
                    </div>

                    <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
                        <h5 style={{ fontSize: 13.5, marginBottom: 8 }}>محتوى التسليم</h5>
                        {activeReview.content.textContent && (
                            <div style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 10, marginBottom: 14, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                                {activeReview.content.textContent}
                            </div>
                        )}
                        {activeReview.content.hasFile && (
                            <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 12.5, marginBottom: 18 }} onClick={downloadReviewFile}>⬇️ تحميل الملف المرفق</button>
                        )}

                        <hr style={{ margin: '14px 0', borderColor: 'rgba(255,255,255,0.07)' }} />
                        <h5 style={{ fontSize: 13.5, marginBottom: 10 }}>تقييمك حسب المعايير</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {assignment.rubric.map(crit => (
                                <div key={crit.criterion} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <label style={{ flex: 1, fontSize: 13 }}>{crit.criterion} <span style={{ color: 'rgba(255,255,255,0.4)' }}>(من {crit.maxScore})</span></label>
                                    <input
                                        className="form-input" type="number" min={0} max={crit.maxScore}
                                        value={reviewScores[crit.criterion] ?? 0}
                                        onChange={e => setReviewScore(crit.criterion, Number(e.target.value))}
                                        style={{ width: 90 }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <label className="form-label">ملاحظات نصية (اختياري)</label>
                            <textarea className="form-input" rows={3} value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} style={{ resize: 'none' }} />
                        </div>
                    </div>

                    <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setActiveReview(null)}>إلغاء</button>
                        <button className="btn-primary" style={{ padding: '8px 22px', fontSize: 13 }} disabled={submittingReview} onClick={submitReviewForActive}>
                            {submittingReview ? 'جارٍ الإرسال...' : 'إرسال التقييم'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal >
    )
}