import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { useMyLiveSessions } from '../../hooks/live/useMyLiveSessions'
import { LiveMeetingRoom } from '../../components/live/LiveMeetingRoom'
import { SkeletonLoader } from '../../components/common/Loading'
import type { LiveSession } from '../../services/liveService'

const STATUS_META: Record<LiveSession['status'], { label: string; color: string }> = {
  scheduled: { label: 'مجدولة', color: '#f59e0b' },
  ongoing: { label: 'مباشر الآن', color: '#ef4444' },
  ended: { label: 'انتهت', color: '#94a3b8' },
  cancelled: { label: 'ملغاة', color: '#64748b' },
}

export default function LiveClass() {
  const { userName, userEmail } = useNav()
  const { sessions, loading, refetch } = useMyLiveSessions()
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)

  if (activeSession) {
    return (
      <div className="page-wrapper">
        <button onClick={() => setActiveSession(null)} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}>
          ← العودة لقائمة الحصص
        </button>
        <h2 className="section-title" style={{ marginBottom: 18 }}>{activeSession.title}</h2>
        <LiveMeetingRoom session={activeSession} role="student" userName={userName || 'طالب'} userEmail={userEmail} onLeave={() => { setActiveSession(null); refetch() }} />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">الحصص المباشرة</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>حصصك المباشرة عبر جميع الكورسات المسجّلة</p>
      </div>

      {loading ? (
        <SkeletonLoader type="row" count={3} />
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📺</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>لا توجد حصص مباشرة مجدولة حاليًا</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sessions.map(s => {
            const meta = STATUS_META[s.status]
            const courseTitle = typeof s.courseId === 'object' ? s.courseId?.title : undefined
            return (
              <div key={s._id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  {courseTitle && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%',
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(168,85,247,0.12))',
                      border: '1px solid rgba(168,85,247,0.35)', borderRadius: 999,
                      padding: '3px 11px 3px 9px', marginBottom: 9,
                    }}>
                      <span style={{ fontSize: 11 }}>📚</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#c4b5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {courseTitle}
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 7, lineHeight: 1.4 }}>{s.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🗓 {new Date(s.startTime).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, direction: 'ltr' }}>
                      {new Date(s.startTime).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                      <span style={{ opacity: 0.5 }}>→</span>
                      {new Date(s.endTime).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>{meta.label}</span>
                  {s.status === 'ongoing' && (
                    !s.studentsAllowed ? (
                      <button className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} disabled>
                        بانتظار فتح المحاضر للحصة
                      </button>
                    ) : (
                      <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={() => setActiveSession(s)}>
                        انضمام الآن
                      </button>
                    ))}
                  {s.status === 'scheduled' && (
                    <button className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} disabled>بانتظار بدء المحاضر</button>
                  )}
                  {s.status === 'ended' && s.recordingUrl && (
                    <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }}>🎬 مشاهدة التسجيل</a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}