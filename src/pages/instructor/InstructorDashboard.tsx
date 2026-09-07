// src/pages/instructor/InstructorDashboard.tsx
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../../context/NavContext'
import { courseService, type InstructorCourse } from '../../services/courseService'
import { useInstructorCourseAnalytics } from '../../hooks/report/useInstructorCourseAnalytics'
import { useInstructorLiveSessions } from '../../hooks/live/useInstructorLiveSessions'
import { COURSE_BUILDER_TAB_PATH } from '../../routes/dynamicRoutes'
import { SkeletonLoader } from '../../components/common/Loading'
import { ModalPortal } from '../../components/common/ModalPortal' // added

const ALERT_TYPE_LABELS: Record<string, string> = {
  LOW_PERFORMANCE: 'أداء منخفض بالاختبارات',
  LOW_ATTENDANCE: 'حضور منخفض',
}

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
}

export default function InstructorDashboard() {
  const { navigate, userName } = useNav()
  const routerNavigate = useNavigate()

  const [courses, setCourses] = useState<InstructorCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null) // added

  useEffect(() => {
    courseService.getMyInstructorCourses()
      .then(list => {
        setCourses(list)
        setSelectedCourseId(prev => prev ?? (list.length > 0 ? list[0]._id : null))
      })
      .finally(() => setCoursesLoading(false))
  }, [])

  const { analytics, loading: analyticsLoading } = useInstructorCourseAnalytics(selectedCourseId)
  const { sessions, loading: sessionsLoading } = useInstructorLiveSessions(selectedCourseId)

  // added
  const selectedFlagged = useMemo(
    () => analytics?.flaggedStudents.find(s => s.studentId === selectedStudentId) ?? null,
    [analytics, selectedStudentId]
  )
  const selectedStudentRow = useMemo(
    () => analytics?.students.find(s => s.studentId === selectedStudentId) ?? null,
    [analytics, selectedStudentId]
  )

  const goToLiveTab = () => {
    if (selectedCourseId) routerNavigate(COURSE_BUILDER_TAB_PATH(selectedCourseId, 'live'))
    else navigate('course-builder') // احتياط نظري — هذا الزر لا يظهر أصلاً بدون كورس محدد
  }

  const upcomingSessions = useMemo(
    () => sessions.filter(s => s.status === 'scheduled' || s.status === 'ongoing').slice(0, 4),
    [sessions]
  )

  const avgQuizScore = useMemo(() => {
    if (!analytics) return null
    const scored = analytics.quizPerformance.filter(q => q.averageScorePercent != null)
    if (scored.length === 0) return null
    return Math.round(scored.reduce((sum, q) => sum + (q.averageScorePercent || 0), 0) / scored.length)
  }, [analytics])

  const avgAttendance = useMemo(() => {
    if (!analytics) return null
    const rated = analytics.students.filter(s => s.attendancePercent != null)
    if (rated.length === 0) return null
    return Math.round(rated.reduce((sum, s) => sum + (s.attendancePercent || 0), 0) / rated.length)
  }, [analytics])

  const metrics = [
    { icon: '👥', label: 'الطلاب المسجّلون', value: analytics ? String(analytics.students.length) : '—', sub: 'بهذا الكورس', color: '#7c3aed' },
    { icon: '📊', label: 'متوسط درجات الاختبارات', value: avgQuizScore == null ? '—' : `${avgQuizScore}%`, sub: avgQuizScore == null ? 'لا توجد نتائج مُصحَّحة بعد' : `عبر ${analytics?.quizPerformance.length ?? 0} اختبار منشور`, color: '#06b6d4' },
    { icon: '✅', label: 'متوسط الحضور', value: avgAttendance == null ? '—' : `${avgAttendance}%`, sub: avgAttendance == null ? 'لا توجد حصص منتهية بعد' : 'عبر الحصص المنتهية', color: '#10b981' },
    {
      icon: '⚠️', label: 'تنبيهات نشطة', value: analytics ? String(analytics.courseLevelAlerts.length) : '—',
      sub: analytics && analytics.courseLevelAlerts.length > 0 ? 'تحتاج مراجعة' : 'كل شيء ضمن المعدل',
      color: analytics && analytics.courseLevelAlerts.length > 0 ? '#f59e0b' : '#10b981',
    },
  ]

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title">مرحباً، {(userName || 'أستاذنا').split(' ')[0]}! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>
            {courses.length > 0 ? `لديك ${courses.length} ${courses.length === 1 ? 'كورس' : 'كورسات'}` : 'لم تُنشئ أي كورس بعد'}
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('course-builder')}>
          + إنشاء كورس جديد
        </button>
      </div>

      {coursesLoading ? (
        <SkeletonLoader type="card" count={4} />
      ) : courses.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🏗️</div>
          <h3 style={{ marginBottom: 8 }}>ابدأ بإنشاء أول كورس لك</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, marginBottom: 20 }}>بمجرد إنشاء كورس، رح تشوف هون إحصائيات حقيقية عن أداء طلابك.</p>
          <button className="btn-primary" onClick={() => navigate('course-builder')}>+ إنشاء كورس جديد</button>
        </div>
      ) : (
        <>
          {/* الإحصائيات مبنية دائماً على كورس واحد محدد (عقد UC-REPORT-02) */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">عرض إحصائيات كورس</label>
            <select
              className="form-input"
              style={{ maxWidth: 360 }}
              value={selectedCourseId || ''}
              onChange={e => setSelectedCourseId(e.target.value)}
            >
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {analyticsLoading ? (
            <div style={{ marginBottom: 28 }}><SkeletonLoader type="card" count={4} /></div>
          ) : (
            <div className="grid-4" style={{ marginBottom: 28 }}>
              {metrics.map(m => (
                <div key={m.label} className="metric-card">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{m.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
                  <div style={{ fontSize: 11.5, color: m.color, marginTop: 4, fontWeight: 500 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          )}

          <div className="instr-dash-2col">
            {/* تنبيهات + طلاب يحتاجون متابعة — بدل "التسليمات الأخيرة" الوهمية */}
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>تنبيهات وطلاب يحتاجون متابعة</h3>

              {analyticsLoading ? (
                <SkeletonLoader type="row" count={3} />
              ) : !analytics || (analytics.courseLevelAlerts.length === 0 && analytics.flaggedStudents.length === 0) ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد تنبيهات — أداء الكورس ضمن المعدل الطبيعي حالياً.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analytics.courseLevelAlerts.map((a, i) => {
                    const color = SEVERITY_COLORS[a.severity] || '#94a3b8'
                    return (
                      <div key={`alert-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: `${color}11`, border: `1px solid ${color}33` }}>
                        <span style={{ fontSize: 13 }}>{ALERT_TYPE_LABELS[a.type] || a.type}</span>
                        <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                          {Math.round(a.value * 100)}% / {Math.round(a.threshold * 100)}%
                        </span>
                      </div>
                    )
                  })}
                  {analytics.flaggedStudents.map(s => (
                    <div
                      key={s.studentId}
                      onClick={() => setSelectedStudentId(s.studentId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') setSelectedStudentId(s.studentId) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer' }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {s.fullName?.[0] || '؟'}
                      </div>
                      <span style={{ fontSize: 13 }}>{s.fullName} — تقدّم أو حضور أقل من المتوقع</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* الحصص القادمة — حقيقية من useInstructorLiveSessions */}
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>الحصص القادمة</h3>
                <button className="btn-ghost" style={{ fontSize: 12.5, color: '#a855f7', padding: '4px 8px' }} onClick={goToLiveTab}>إدارة ←</button>
              </div>

              {sessionsLoading ? (
                <SkeletonLoader type="row" count={2} />
              ) : upcomingSessions.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا توجد حصص مباشرة مجدولة لهذا الكورس.</p>
              ) : (
                upcomingSessions.map(s => {
                  const isOngoing = s.status === 'ongoing'
                  const dayLabel = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date(s.startTime))
                  const timeLabel = new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(s.startTime))
                  return (
                    <div key={s._id} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                          {isOngoing && <span className="live-badge"><span className="live-dot" />جارية الآن</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>{dayLabel} {timeLabel}</div>
                      </div>
                      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: 12.5 }} onClick={goToLiveTab}>
                        🚀 إدارة الحصة
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick actions — نفس الأزرار الوظيفية القديمة، بلا أرقام وهمية */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px', marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>إجراءات سريعة</h3>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            ['🏗️', 'كورس جديد', 'course-builder'],
            ['⚙️', 'الإعدادات', 'profile'],
          ].map(([icon, label, page]) => (
            <button
              key={label}
              onClick={() => navigate(page as any)}
              style={{
                flex: '1 1 140px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 14, padding: '16px 12px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.15s', color: '#fff',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal to display student details */}
      {selectedFlagged && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 420 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>تفاصيل الطالب</h3>
                <button onClick={() => setSelectedStudentId(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {selectedFlagged.fullName?.[0] || '؟'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedFlagged.fullName}</div>
                    {selectedStudentRow && (
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>{selectedStudentRow.email}</div>
                    )}
                  </div>
                </div>

                {selectedStudentRow ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>نسبة مشاهدة المحتوى</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {selectedStudentRow.contentViewedPercent == null ? '—' : `${Math.round(selectedStudentRow.contentViewedPercent * 100)}%`}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {selectedStudentRow.contentViewedCount} عنصر تمت مشاهدته
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>نسبة الحضور</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {selectedStudentRow.attendancePercent == null ? '—' : `${Math.round(selectedStudentRow.attendancePercent * 100)}%`}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {selectedStudentRow.attendedSessionsCount} حصة تم حضورها
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                    لا تتوفر تفاصيل إضافية لهذا الطالب حالياً.
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}