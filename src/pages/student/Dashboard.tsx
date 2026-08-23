import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../contexts/ToastContext'
import API from '../../config/api'
import { getErrorMessage } from '../../utils/errorMessages'
import type { Enrollment, ProgressSummary } from '../../types'

type CourseTab = 'in-progress' | 'completed' | 'all'

interface EnrollmentWithProgress extends Enrollment {
  progress: number
}

export default function StudentDashboard() {
  const { navigate, userName } = useNav()
  const { showMsg } = useToast()

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [progressData, setProgressData] = useState<Record<string, ProgressSummary | undefined>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<CourseTab>('in-progress')

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    setLoading(true)
    try {
      const res = await API.get('/courses/enrollments/my-courses')
      const list: Enrollment[] = res.data?.data?.enrollments || []
      setEnrollments(list)

      await Promise.all(
        list.map(async (enrollment) => {
          const courseId = enrollment.course_id?._id
          if (!courseId) return
          try {
            const progressRes = await API.get(`/courses/${courseId}/progress-summary`)
            setProgressData((prev) => ({ ...prev, [courseId]: progressRes.data?.data }))
          } catch {
            // Progress summary is best-effort; a missing one just shows 0%.
          }
        })
      )
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCourses = (tab: CourseTab): EnrollmentWithProgress[] => {
    const list: EnrollmentWithProgress[] = enrollments.map((e) => ({
      ...e,
      progress: progressData[e.course_id?._id || '']?.progress_percentage || 0,
    }))
    if (tab === 'in-progress') return list.filter((c) => c.progress > 0 && c.progress < 1)
    if (tab === 'completed') return list.filter((c) => c.progress >= 1)
    return list
  }

  const inProgress = getFilteredCourses('in-progress')
  const completed = getFilteredCourses('completed')
  const allCourses = getFilteredCourses('all')
  const avgProgress = allCourses.length
    ? Math.round((allCourses.reduce((sum, c) => sum + c.progress, 0) / allCourses.length) * 100)
    : 0

  const shownCourses = activeTab === 'in-progress' ? inProgress : activeTab === 'completed' ? completed : allCourses

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="glass" style={{ height: 100, opacity: 0.5 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="glass" style={{ height: 100, opacity: 0.5 }} />)}
          </div>
          <div className="glass" style={{ height: 220, opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.15) 100%)',
        border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20,
        padding: '24px 28px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>مرحباً يا {(userName || 'صديقنا').split(' ')[0]}! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
            {allCourses.length > 0 ? `أنت مسجّل في ${allCourses.length} كورس. استمر في التقدم!` : 'ابدأ رحلتك التعليمية اليوم!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, position: 'relative' }}>
          <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('my-courses')}>
            متابعة التعلم
          </button>
          <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 14 }} onClick={() => navigate('course-catalog')}>
            استعراض الكورسات
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
        {[
          { icon: '📚', label: 'الكورسات المسجّلة', value: String(enrollments.length), color: '#7c3aed' },
          { icon: '🔥', label: 'قيد التقدم', value: String(inProgress.length), color: '#06b6d4' },
          { icon: '✅', label: 'مكتملة', value: String(completed.length), color: '#10b981' },
          { icon: '📈', label: 'متوسط التقدم', value: `${avgProgress}%`, color: '#f59e0b' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{m.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="glass" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>كورساتي</h3>
          <div className="tab-bar">
            <div className={`tab-item${activeTab === 'in-progress' ? ' active' : ''}`} onClick={() => setActiveTab('in-progress')}>
              قيد التقدم {inProgress.length > 0 && `· ${inProgress.length}`}
            </div>
            <div className={`tab-item${activeTab === 'completed' ? ' active' : ''}`} onClick={() => setActiveTab('completed')}>
              مكتملة {completed.length > 0 && `· ${completed.length}`}
            </div>
            <div className={`tab-item${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>
              الكل {allCourses.length > 0 && `· ${allCourses.length}`}
            </div>
          </div>
        </div>

        {allCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🎓</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>ابدأ رحلتك التعليمية</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, margin: '0 0 20px' }}>استعرض كتالوج الكورسات لتجد ما يناسب أهدافك.</p>
            <button className="btn-primary" onClick={() => navigate('course-catalog')}>استعراض الكورسات ←</button>
          </div>
        ) : shownCourses.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, textAlign: 'center', padding: '24px 0' }}>لا توجد كورسات في هذا التصنيف.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {shownCourses.map((enrollment) => {
              const course = enrollment.course_id
              const percentage = Math.round(enrollment.progress * 100)
              const isComplete = enrollment.progress >= 1
              return (
                <div key={enrollment._id} className="course-card" onClick={() => navigate('my-courses')}>
                  <div style={{ height: 110, background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, position: 'relative' }}>
                    📘
                    {isComplete && (
                      <span className="badge badge-success" style={{ position: 'absolute', top: 10, left: 10 }}>✅ مكتمل</span>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course?.title || 'كورس بدون عنوان'}</h4>
                    <span className="badge badge-neutral" style={{ marginBottom: 12 }}>{course?.category || 'بدون تصنيف'}</span>
                    <div className="progress-bar" style={{ marginTop: 12 }}>
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{percentage}% مكتمل</span>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '8px', fontSize: 13 }}
                      onClick={(e) => { e.stopPropagation(); navigate('my-courses') }}
                    >
                      {isComplete ? 'مراجعة الكورس' : 'متابعة التعلم'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
