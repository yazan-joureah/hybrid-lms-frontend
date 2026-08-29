// src/pages/student/my-courses/player/LiveSessionPanel.tsx
import { useState } from 'react'
import type { LiveSession } from '../../../../services/liveService'
import { LiveMeetingRoom } from '../../../../components/live/LiveMeetingRoom'
import { useNav } from '../../../../context/NavContext'

const STATUS_META: Record<LiveSession['status'], { label: string; color: string }> = {
    scheduled: { label: 'مجدولة', color: '#f59e0b' },
    ongoing: { label: 'مباشر الآن', color: '#ef4444' },
    ended: { label: 'انتهت', color: '#94a3b8' },
    cancelled: { label: 'ملغاة', color: '#64748b' },
}

interface Props {
    session: LiveSession
    onRefresh: () => void
}

export function LiveSessionPanel({ session, onRefresh }: Props) {
    const { userName, userEmail } = useNav()
    const [joining, setJoining] = useState(false)
    const meta = STATUS_META[session.status]

    if (joining) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                <LiveMeetingRoom
                    session={session}
                    role="student"
                    userName={userName || 'طالب'}
                    userEmail={userEmail}
                    onLeave={() => { setJoining(false); onRefresh() }}
                />
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: 26, minHeight: 420 }}>
            <div style={{ marginBottom: 20 }}>
                <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44`, marginBottom: 8, display: 'inline-block' }}>{meta.label}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{session.title}</h3>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                    {new Date(session.startTime).toLocaleString('ar')} – {new Date(session.endTime).toLocaleString('ar')}
                </div>
            </div>

            {session.status === 'ongoing' && (
                !session.studentsAllowed ? (
                    <button className="btn-outline" style={{ padding: '11px 26px', fontSize: 14 }} disabled>بانتظار فتح المحاضر للحصة</button>
                ) : (
                    <button className="btn-primary" style={{ padding: '11px 26px', fontSize: 14 }} onClick={() => setJoining(true)}>انضمام الآن</button>
                )
            )}
            {session.status === 'scheduled' && (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5 }}>لم يبدأ المحاضر هذه الحصة بعد.</div>
            )}
            {session.status === 'ended' && (
                session.recordingUrl
                    ? <a href={session.recordingUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '11px 26px', fontSize: 14 }}>🎬 مشاهدة التسجيل</a>
                    : <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>انتهت الحصة، ولا يوجد تسجيل متاح بعد.</div>
            )}
            {session.status === 'cancelled' && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>أُلغيت هذه الحصة.</div>
            )}
        </div>
    )
}