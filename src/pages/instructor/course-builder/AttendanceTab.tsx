import { useState } from 'react'
import type { useAttendance } from '../../../hooks/live/useAttendance'
import type { useInstructorLiveSessions } from '../../../hooks/live/useInstructorLiveSessions'

type AttendanceTabProps = ReturnType<typeof useAttendance> & {
    sessions: ReturnType<typeof useInstructorLiveSessions>['sessions']
}

export function AttendanceTab({ summary, report, loading, correctingId, fetchReport, exportCSV, correctAttendance, sessions }: AttendanceTabProps) {
    const [selectedSession, setSelectedSession] = useState('')

    const handleCorrect = (sessionId: string, studentId: string, currentStatus: string) => {
        if (currentStatus === 'present') return
        const reason = window.prompt('الرجاء إدخال سبب التصحيح (إلزامي):')
        if (!reason || !reason.trim()) return
        void correctAttendance(sessionId, studentId, reason.trim())
    }

    const endedSessions = sessions.filter(s => s.status === 'ended')

    return (
        <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>ملخص الحضور</h3>
            {loading && !summary ? (
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
            ) : summary ? (
                <>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>إجمالي الحصص المنتهية: {summary.totalSessions}</p>
                    <div className="table-responsive" style={{ marginBottom: 28 }}>
                        <table className="data-table">
                            <thead><tr><th>الطالب</th><th>عدد الحضور</th><th>مدة الحضور (ثانية)</th><th>النسبة</th></tr></thead>
                            <tbody>
                                {summary.summary.map(row => (
                                    <tr key={row.studentId}>
                                        <td>{row.studentName} ({row.studentEmail})</td>
                                        <td>{row.attendedSessions}</td>
                                        <td>{row.totalDurationSeconds}</td>
                                        <td>{row.attendancePercentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>لا توجد بيانات حضور بعد.</div>
            )}

            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>تقرير حصة محددة</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <select className="form-input" style={{ maxWidth: 320, flex: '1 1 220px' }} value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                    <option value="">اختر حصة منتهية</option>
                    {endedSessions.map(s => <option key={s._id} value={s._id}>{s.title} ({new Date(s.startTime).toLocaleDateString('ar')})</option>)}
                </select>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} disabled={!selectedSession} onClick={() => fetchReport(selectedSession)}>عرض التقرير</button>
                {selectedSession && (
                    <button className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={() => exportCSV(selectedSession)}>تصدير CSV</button>
                )}
            </div>

            {report && (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead><tr><th>الطالب</th><th>البريد</th><th>وقت الدخول</th><th>وقت الخروج</th><th>المدة (ثانية)</th><th>الحالة</th><th>إجراء</th></tr></thead>
                        <tbody>
                            {report.records.map(r => (
                                <tr key={r._id}>
                                    <td>{r.studentId?.full_name || '—'}</td>
                                    <td>{r.studentId?.email || '—'}</td>
                                    <td>{r.joinedAt ? new Date(r.joinedAt).toLocaleString('ar') : '—'}</td>
                                    <td>{r.leftAt ? new Date(r.leftAt).toLocaleString('ar') : '—'}</td>
                                    <td>{r.durationSeconds || 0}</td>
                                    <td>
                                        <span className="badge">{r.status}</span>
                                        {r.correctionReason && <span className="badge badge-info" style={{ marginRight: 6 }} title={r.correctionReason}>✍️ صُحِّح يدويًا</span>}
                                    </td>
                                    <td>
                                        {r.status !== 'present' && r.studentId?._id && (
                                            <button className="btn-outline" style={{ padding: '5px 14px', fontSize: 12 }} disabled={correctingId === r.studentId._id} onClick={() => handleCorrect(selectedSession, r.studentId!._id, r.status)}>
                                                {correctingId === r.studentId._id ? '...جارٍ الحفظ' : 'تصحيح إلى حاضر'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}