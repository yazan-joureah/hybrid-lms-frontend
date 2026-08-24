// src/components/peer/student/PeerGradePanel.tsx
import type { useStudentPeerAssignment } from '../../../hooks/peer/useStudentPeerAssignment'

type Props = ReturnType<typeof useStudentPeerAssignment>

export function PeerGradePanel({ gradeData, gradeLoading, attemptNumber, maxAttempts }: Props) {
    if (gradeLoading) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>جارِ التحميل...</div>
    if (!gradeData) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد بيانات درجة بعد.</div>

    return (
        <div>
            <div style={{ textAlign: 'center', padding: 24, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>درجتك النهائية</span>
                <h2 style={{ margin: '6px 0', fontSize: 40, fontWeight: 800, color: '#a855f7' }}>
                    {gradeData.finalScorePercentage != null ? `${gradeData.finalScorePercentage}%` : 'غير متاحة بعد'}
                </h2>
                {gradeData.gradeOverridden && (
                    <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: 10, padding: '8px 14px', marginTop: 10 }}>
                        <span style={{ color: '#22d3ee', fontSize: 13 }}>✏️ تم تعديل هذه الدرجة يدوياً من قبل المحاضر</span>
                        {gradeData.overrideReason && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>السبب: {gradeData.overrideReason}</p>}
                    </div>
                )}
                {gradeData.gradingFlagged && !gradeData.gradeOverridden && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: '8px 14px', marginTop: 10 }}>
                        <span style={{ color: '#f87171', fontSize: 13 }}>
                            {gradeData.gradingFlagReason === 'NO_REVIEWER_COMPLETED' ? '⚠️ لم يقم أي مراجع بتقييم تسليمك، المحاضر سيراجع الحالة.' : '⚠️ تباين كبير بين آراء المراجعين، المحاضر سيراجع الحالة.'}
                        </span>
                    </div>
                )}
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>المحاولة الحالية: #{attemptNumber} من {maxAttempts}</p>
            </div>

            <h5 style={{ fontSize: 13.5, marginBottom: 10 }}>ملاحظات المراجعين (بدون كشف الهوية)</h5>
            {(gradeData.reviews || []).length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>لا توجد ملاحظات مكتوبة من المراجعين.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {gradeData.reviews!.map((r, idx) => (
                        <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                            <strong style={{ fontSize: 13 }}>مراجع #{idx + 1} — الدرجة: {r.totalScore}%</strong>
                            {r.feedbackText && <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{r.feedbackText}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}