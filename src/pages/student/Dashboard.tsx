// src/pages/student/Dashboard.tsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../../context/NavContext'
import { useMyProgressSummary } from '../../hooks/report/useMyProgressSummary'
import { useMyLiveSessions } from '../../hooks/live/useMyLiveSessions'
import { useMyCertificates } from '../../hooks/cert/useMyCertificates'
import { courseService } from '../../services/courseService'
import { MY_COURSES_DETAIL_PATH } from '../../routes/dynamicRoutes'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'
import { SkeletonLoader } from '../../components/common/Loading'
import type { LiveSession } from '../../services/liveService'

const extractCourseId = (field?: string | { _id: string; title?: string } | null): string | null =>
  field ? String(typeof field === 'object' ? field._id : field) : null

// عدّاد تنازلي حقيقي — يُعاد حسابه كل ثانية من Date.now() الفعلي بدل ما
// يكون state ثابت ينقص وحده بدون أي علاقة بالوقت الحقيقي (كان هيك بالنسخة القديمة).
function useCountdownTo(targetIso: string | null) {
  const [remainingMs, setRemainingMs] = useState(0)

  useEffect(() => {
    if (!targetIso) { setRemainingMs(0); return }
    const tick = () => setRemainingMs(Math.max(0, new Date(targetIso).getTime() - Date.now()))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [targetIso])

  const totalSeconds = Math.floor(remainingMs / 1000)
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
    expired: remainingMs <= 0,
  }
}

export default function StudentDashboard() {
  const { navigate, userName } = useNav()
  const routerNavigate = useNavigate()
  const { summary, loading: summaryLoading } = useMyProgressSummary()
  const { sessions, loading: sessionsLoading } = useMyLiveSessions()
  const { activeCertificates, loading: certsLoading } = useMyCertificates()

  // ✅ report/me بيرجع courseId فقط، بس مسار تفاصيل الكورس عندنا مبني على
  // enrollmentId (/my-courses/:enrollmentId). فبنجيب خريطة courseId -> enrollmentId
  // مرّة وحدة من نفس endpoint المستخدم أصلاً بصفحة "كورساتي"، ونستخدمها هون
  // بس للتوجيه — بلا أي تكرار لمنطق التقدّم (هذا يبقى حصراً من report/me).
  const [enrollmentIdByCourseId, setEnrollmentIdByCourseId] = useState<Record<string, string>>({})

  useEffect(() => {
    courseService.getMyCourses()
      .then(enrollments => {
        const map: Record<string, string> = {}
        enrollments.forEach(e => { if (e.course_id?._id) map[e.course_id._id] = e._id })
        setEnrollmentIdByCourseId(map)
      })
      .catch(() => { /* فشل بسيط — الكارد بيرجع لسلوك الاحتياط (my-courses العامة) */ })
  }, [])

  const goToCourse = useCallback((courseId: string) => {
    const enrollmentId = enrollmentIdByCourseId[courseId]
    if (enrollmentId) routerNavigate(MY_COURSES_DETAIL_PATH(enrollmentId))
    else navigate('my-courses') // احتياط: لو الخريطة لسا ما وصلت أو الكورس مش موجود فيها
  }, [enrollmentIdByCourseId, routerNavigate, navigate])

  const pad = (n: number) => String(n).padStart(2, '0')

  // ---------- مقاييس أعلى الصفحة (كلها من بيانات حقيقية) ----------
  const activeCoursesCount = summary?.courses.filter(c => c.enrollmentStatus === 'active').length ?? 0
  const totalEnrolledCount = summary?.courses.length ?? 0

  const avgProgressPercent = summary && summary.courses.length > 0
    ? Math.round((summary.courses.reduce((sum, c) => sum + c.progressPercentage, 0) / summary.courses.length) * 100)
    : 0

  const totalCompletedUnits = summary?.courses.reduce((sum, c) => sum + c.completedCount, 0) ?? 0
  const totalUnits = summary?.courses.reduce((sum, c) => sum + c.totalCount, 0) ?? 0

  const attendanceKnown = summary?.overallAttendancePercentage != null
  const attendanceDisplay = attendanceKnown ? `${Math.round(summary!.overallAttendancePercentage! * 100)}%` : '—'

  const metrics = [
    {
      icon: '📈', label: 'التقدم الكلي', value: `${avgProgressPercent}%`, color: '#7c3aed',
      sub: totalUnits > 0 ? `${totalCompletedUnits} من ${totalUnits} وحدة مكتملة` : 'ابدأ أول درس لك',
    },
    {
      icon: '✅', label: 'نسبة الحضور', value: attendanceDisplay, color: '#10b981',
      sub: attendanceKnown ? 'عبر كل الحصص المباشرة المنتهية' : 'لا توجد حصص منتهية بعد',
    },
    {
      icon: '📚', label: 'الكورسات النشطة', value: String(activeCoursesCount), color: '#06b6d4',
      sub: `من إجمالي ${totalEnrolledCount} كورس مسجَّل`,
    },
    {
      icon: '🏆', label: 'الشهادات المكتسبة', value: String(activeCertificates.length), color: '#f59e0b',
      sub: activeCertificates.length > 0 ? 'شهادة مكتملة' : 'أكمل كورساً لتحصل على أول شهادة',
    },
  ]

  // ---------- الحصة المباشرة القادمة/الجارية (من useMyLiveSessions الحقيقي) ----------
  const relevantSessions = useMemo(
    () => sessions.filter(s => s.status === 'scheduled' || s.status === 'ongoing'),
    [sessions]
  )
  const ongoingSession = relevantSessions.find(s => s.status === 'ongoing') || null
  const nextScheduledSession = relevantSessions.find(s => s.status === 'scheduled') || null
  const highlightedSession: LiveSession | null = ongoingSession || nextScheduledSession
  const countdown = useCountdownTo(!ongoingSession && nextScheduledSession ? nextScheduledSession.startTime : null)

  const courseTitleForSession = (s: LiveSession): string => {
    if (typeof s.courseId === 'object' && s.courseId?.title) return s.courseId.title
    const match = summary?.courses.find(c => c.courseId === extractCourseId(s.courseId))
    return match?.courseTitle || 'كورس'
  }

  // ---------- الجدول الأسبوعي (حصص مباشرة حقيقية خلال 7 أيام القادمة فقط) ----------
  const weekSessions = useMemo(() => {
    const weekAheadMs = Date.now() + 7 * 24 * 60 * 60 * 1000
    return relevantSessions
      .filter(s => new Date(s.startTime).getTime() <= weekAheadMs)
      .slice(0, 8)
  }, [relevantSessions])

  return (
    <div className="page-wrapper">
      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.15) 100%)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20,
          padding: '24px 28px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}
        className="dash-welcome-banner"
      >
        <div style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>مرحباً يا {(userName || 'صديقنا').split(' ')[0]}! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
            {activeCoursesCount > 0
              ? `لديك ${activeCoursesCount} ${activeCoursesCount === 1 ? 'كورس نشط' : 'كورسات نشطة'}. استمر في التقدم!`
              : 'ابدأ رحلتك التعليمية بتصفح الكورسات المتاحة.'}
          </p>
        </div>
        <div className="dash-welcome-actions">
          <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('my-courses')}>
            متابعة التعلم
          </button>
          <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 14 }} onClick={() => navigate('course-catalog')}>
            استعراض الكورسات
          </button>
        </div>
      </div>

      {/* Metrics */}
      {summaryLoading || certsLoading ? (
        <div style={{ marginBottom: 28 }}><SkeletonLoader type="card" count={4} /></div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {metrics.map(m => (
            <div key={m.label} className="metric-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{m.icon}</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
              <div style={{ fontSize: 11.5, color: m.color, marginTop: 4, fontWeight: 500 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dash-main-grid">
        {/* Enrolled courses */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>كورساتي</h3>
            <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 10px' }} onClick={() => navigate('my-courses')}>
              عرض الكل ←
            </button>
          </div>

          {summaryLoading ? (
            <SkeletonLoader type="row" count={3} />
          ) : !summary || summary.courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>📚</div>
              <div style={{ marginBottom: 14 }}>لسا ما سجّلت بأي كورس.</div>
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={() => navigate('course-catalog')}>
                تصفّح الكورسات
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {summary.courses.slice(0, 4).map(c => {
                const progressPercent = Math.round(c.progressPercentage * 100)
                return (
                  <div key={c.courseId} onClick={() => goToCourse(c.courseId)} style={{ display: 'flex', gap: 14, cursor: 'pointer', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <img
                      src={getCourseCoverUrl(c.courseId) || PLACEHOLDER_IMAGE}
                      alt={c.courseTitle}
                      style={{ width: 72, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                      onError={handleImageFallback}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.courseTitle}</div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', flexShrink: 0, marginRight: 8 }}>{progressPercent}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                        {c.totalCount > 0 ? `${c.completedCount} من ${c.totalCount} وحدة مكتملة` : 'لا توجد وحدات بعد'}
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Upcoming/ongoing live session */}
          {sessionsLoading ? (
            <SkeletonLoader type="card" count={1} />
          ) : highlightedSession ? (
            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 18, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{ongoingSession ? 'الحصة جارية الآن' : 'الحصة القادمة'}</span>
                {ongoingSession ? (
                  <span className="live-badge"><span className="live-dot" />مباشر الآن</span>
                ) : (
                  <span className="badge badge-primary">قريباً</span>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{highlightedSession.title}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{courseTitleForSession(highlightedSession)}</div>

              {!ongoingSession && !countdown.expired && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }} dir="ltr">
                  {[{ v: countdown.h, l: 'س' }, { v: countdown.m, l: 'د' }, { v: countdown.s, l: 'ث' }].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 22, fontWeight: 800, color: '#fff', minWidth: 52, fontVariantNumeric: 'tabular-nums' }}>{pad(item.v)}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{item.l}</div>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 14 }} onClick={() => navigate('live-class')}>
                {ongoingSession ? 'انضم الآن' : 'عرض التفاصيل'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>لا توجد حصص مباشرة قادمة حالياً.</div>
            </div>
          )}

          {/* Latest quiz results (بدل تقويم الحضور الوهمي — ما عندنا تفصيل يومي حقيقي) */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>آخر نتائج الاختبارات</h3>
            {summaryLoading ? (
              <SkeletonLoader type="row" count={3} />
            ) : !summary || summary.latestQuizResults.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>لا توجد نتائج اختبارات مُصحَّحة بعد.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {summary.latestQuizResults.slice(0, 5).map(q => (
                  <div key={q.quizId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.quizTitle}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>
                        {q.quizType === 'exam' ? 'امتحان نهائي' : 'اختبار'} · {new Date(q.gradedAt).toLocaleDateString('ar')}
                      </div>
                    </div>
                    <span className={`badge ${q.passed ? 'badge-success' : 'badge-danger'}`} style={{ flexShrink: 0 }}>
                      {Math.round(q.scorePercent)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly schedule (حصص مباشرة حقيقية فقط — لا يوجد endpoint لجدولة الاختبارات أسبوعياً) */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px' }}>الجدول الأسبوعي (حصص مباشرة)</h3>
        {sessionsLoading ? (
          <SkeletonLoader type="row" count={3} />
        ) : weekSessions.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد حصص مباشرة مجدولة خلال الأسبوع القادم.</p>
        ) : (
          <div className="dash-weekly-schedule">
            {weekSessions.map(s => {
              const isOngoing = s.status === 'ongoing'
              const color = isOngoing ? '#10b981' : '#7c3aed'
              const dayLabel = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(s.startTime))
              const timeLabel = new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(s.startTime))
              return (
                <div key={s._id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '14px 12px', textAlign: 'center',
                  borderTop: `3px solid ${color}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{dayLabel}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{timeLabel}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {courseTitleForSession(s)}
                  </div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 600, background: `${color}22`, color }}>
                    {isOngoing ? 'جارية الآن' : 'مباشر'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}