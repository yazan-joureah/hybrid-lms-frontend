import { useState } from 'react'
import type { CourseUnit } from '../../../services/courseService'
import type { useInstructorLiveSessions } from '../../../hooks/live/useInstructorLiveSessions'
import type { LiveSession, LiveSessionFormPayload } from '../../../services/liveService'
import { LiveMeetingRoom } from '../../../components/live/LiveMeetingRoom'
import { LiveSessionFormModal } from '../../../components/live/LiveSessionFormModal'
import { useNav } from '../../../context/NavContext'
import { EmptyState } from '../../../components/common/EmptyState'
import { SkeletonLoader } from '../../../components/common/Loading'

type LiveTabProps = ReturnType<typeof useInstructorLiveSessions> & { units: CourseUnit[] }

const STATUS_META: Record<LiveSession['status'], { label: string; color: string }> = {
    scheduled: { label: 'مجدولة', color: '#f59e0b' },
    ongoing: { label: 'مباشرة الآن', color: '#ef4444' },
    ended: { label: 'انتهت', color: '#94a3b8' },
    cancelled: { label: 'ملغاة', color: '#64748b' },
}


export function LiveTab({ sessions, loading, units, createSession, updateSession, cancelSession, startSession, endSession, attachRecording }: LiveTabProps) {
    const { userName, userEmail } = useNav()
    const [showModal, setShowModal] = useState(false)
    const [editingSession, setEditingSession] = useState<LiveSession | null>(null)
    const [recordingTarget, setRecordingTarget] = useState<string | null>(null)
    const [recordingUrl, setRecordingUrl] = useState('')
    const [liveRoomSession, setLiveRoomSession] = useState<LiveSession | null>(null)

    if (liveRoomSession) {
        return (
            <div>
                <button onClick={() => setLiveRoomSession(null)} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, marginBottom: 16, padding: 0 }}>
                    ← العودة لقائمة الحصص
                </button>
                <LiveMeetingRoom session={liveRoomSession} role="instructor" userName={userName || 'محاضر'} userEmail={userEmail} onLeave={() => setLiveRoomSession(null)} />
            </div>
        )
    }

    const openCreate = () => { setEditingSession(null); setShowModal(true) }
    const openEdit = (s: LiveSession) => { setEditingSession(s); setShowModal(true) }
    const handleFormSubmit = async (payload: LiveSessionFormPayload) =>
        editingSession ? await updateSession(editingSession._id, payload) : await createSession(payload)

    const handleStart = async (s: LiveSession) => {
        const ok = await startSession(s._id)
        if (ok) setLiveRoomSession({ ...s, status: 'ongoing' })
    }

    const handleSaveRecording = async (sessionId: string) => {
        if (!recordingUrl.trim()) return
        const ok = await attachRecording(sessionId, recordingUrl.trim())
        if (ok) { setRecordingTarget(null); setRecordingUrl('') }
    }

    if (loading) return <SkeletonLoader type="row" count={2} />

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>جدولة وإدارة الحصص المباشرة لهذا الكورس.</p>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={openCreate}>+ جدولة حصة جديدة</button>
            </div>

            {sessions.length === 0 ? (
                <EmptyState icon="📡" title="لا توجد حصص مباشرة بعد" description="جدول أول حصة مباشرة لطلاب هذا الكورس." action={{ label: '+ جدولة حصة', onClick: openCreate }} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(s => {
                        const meta = STATUS_META[s.status]
                        return (
                            <div key={s._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                            {new Date(s.startTime).toLocaleString('ar')} – {new Date(s.endTime).toLocaleString('ar')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>{meta.label}</span>
                                        {s.status === 'scheduled' && (
                                            <>
                                                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => handleStart(s)}>بدء الحصة</button>
                                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => openEdit(s)}>✎ تعديل</button>
                                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5, color: '#f87171' }} onClick={() => cancelSession(s._id, window.prompt('سبب الإلغاء (اختياري):') || undefined)}>🚫 إلغاء</button>
                                            </>
                                        )}
                                        {s.status === 'ongoing' && (
                                            <>
                                                <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => setLiveRoomSession(s)}>دخول الحصة</button>
                                                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5, color: '#f87171' }} onClick={() => endSession(s._id)}>⏹ إنهاء</button>
                                            </>
                                        )}
                                        {s.status === 'ended' && (
                                            s.recordingUrl
                                                ? <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }}>🎬 مشاهدة</a>
                                                : <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => { setRecordingTarget(s._id); setRecordingUrl('') }}>➕ إضافة تسجيل</button>
                                        )}
                                    </div>
                                </div>
                                {recordingTarget === s._id && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                        <input className="form-input" placeholder="https://... رابط التسجيل" value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)} style={{ flex: 1 }} />
                                        <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => handleSaveRecording(s._id)}>حفظ</button>
                                        <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => setRecordingTarget(null)}>إلغاء</button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {showModal && (
                <LiveSessionFormModal
                    editingSession={editingSession}
                    units={units}
                    onSubmit={handleFormSubmit}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    )
}