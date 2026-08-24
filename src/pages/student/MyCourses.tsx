import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../context/ToastContext'
import { useMyCourses } from '../../hooks/course/useMyCourses'
import { EnrollmentCard } from '../../components/course/EnrollmentCard'
import { CourseOverviewPanel } from './my-courses/CourseOverviewPanel'
import { SkeletonLoader } from '../../components/common/Loading'
import type { Enrollment, EnrollmentStatus } from '../../services/courseService'

type TabKey = Extract<EnrollmentStatus, 'active' | 'completed' | 'pending_payment' | 'cancelled'>

const TAB_LABELS: Record<TabKey, string> = {
  active: 'قيد التقدم',
  completed: 'مكتملة',
  pending_payment: 'بانتظار الدفع',
  cancelled: 'ملغاة',
}

export default function MyCourses() {
  const { navigate } = useNav()
  const { info } = useToast()
  const { enrollments, progressMap, loading, byStatus, refetch } = useMyCourses()

  const [activeTab, setActiveTab] = useState<TabKey>('active')
  const [selected, setSelected] = useState<Enrollment | null>(null)

  const handleBackFromPlayer = () => {
    setSelected(null)
    refetch()
  }

  const counts: Record<TabKey, number> = {
    active: byStatus('active').length,
    completed: byStatus('completed').length,
    pending_payment: byStatus('pending_payment').length,
    cancelled: byStatus('cancelled').length,
  }
  const visible = byStatus(activeTab)

  const handleCardClick = (enrollment: Enrollment) => {
    const course = enrollment.course_id
    if (enrollment.status === 'pending_payment') { info('إتمام الدفع غير مفعّل بعد بهذه المرحلة.'); return }
    if (enrollment.status === 'cancelled') { info('تم إلغاء هذا التسجيل واسترداد المبلغ. لا يمكن الوصول لمحتوى الكورس.'); return }
    if (course?.status && course.status !== 'published') {
      info('هذا الكورس قيد التحديث حالياً من قبل المحاضر وينتظر مراجعة الإدارة. سيعود الوصول تلقائياً بعد الاعتماد.')
      return
    }
    setSelected(enrollment)
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <h2 className="section-title" style={{ marginBottom: 20 }}>كورساتي</h2>
        <SkeletonLoader type="card" count={3} />
      </div>
    )
  }

  if (selected) {
    return (
      <div className="page-wrapper">
        <CourseOverviewPanel enrollment={selected} onBack={handleBackFromPlayer} />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">كورساتي</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>تابع تقدمك في جميع الكورسات المسجّلة</p>
      </div>

      <div className="tab-bar" style={{ marginBottom: 24, display: 'inline-flex', flexWrap: 'wrap' }}>
        {(Object.keys(TAB_LABELS) as TabKey[])
          .filter(key => key === 'active' || key === 'completed' || counts[key] > 0)
          .map(key => (
            <div key={key} className={`tab-item${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>
              {TAB_LABELS[key]} ({counts[key]})
            </div>
          ))}
      </div>

      {enrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📚</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لم تسجّل في أي كورس بعد</div>
          <div style={{ fontSize: 13.5, marginBottom: 18 }}>تصفّح الكورسات المتاحة وابدأ رحلتك التعليمية</div>
          <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => navigate('course-catalog')}>
            استعراض الكورسات
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14.5 }}>لا توجد كورسات في هذا القسم حالياً</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {visible.map(e => (
            <EnrollmentCard
              key={e._id}
              enrollment={e}
              progressPercentage={progressMap[e.course_id?._id || ''] ?? 0}
              unavailable={Boolean(e.course_id?.status && e.course_id.status !== 'published')}
              onClick={() => handleCardClick(e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}