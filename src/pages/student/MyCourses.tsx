// src/pages/student/MyCourses.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../context/ToastContext'
import { useMyCourses } from '../../hooks/course/useMyCourses'
import { EnrollmentCard } from '../../components/course/EnrollmentCard'
import { CourseOverviewPanel } from './my-courses/CourseOverviewPanel'
import { SkeletonLoader } from '../../components/common/Loading'
import { CHECKOUT_PATH, MY_COURSES_LIST_PATH, MY_COURSES_DETAIL_PATH } from '../../routes/dynamicRoutes'
import type { Enrollment, EnrollmentStatus } from '../../services/courseService'
import { useEnrollmentActions } from '../../hooks/course/useEnrollmentActions'
import { RefundRequestModal } from '../payments/student/RefundRequestModal'
import type { Payment } from '../../services/payService'

type TabKey = Extract<EnrollmentStatus, 'active' | 'completed' | 'pending_payment' | 'cancelled'>

const TAB_LABELS: Record<TabKey, string> = {
  active: 'قيد التقدم',
  completed: 'مكتملة',
  pending_payment: 'بانتظار الدفع',
  cancelled: 'ملغاة',
}

export default function MyCourses() {
  const { navigate } = useNav()
  const routerNavigate = useNavigate()
  const { enrollmentId } = useParams<{ enrollmentId: string }>()
  const { info } = useToast()
  const { enrollments, progressMap, loading, byStatus, refetch } = useMyCourses()

  const [activeTab, setActiveTab] = useState<TabKey>('active')

  const {
    cancelEnrollment, cancellingId,
    findPaymentForEnrollment, findingPaymentId,
    requestRefund, submittingRefund,
  } = useEnrollmentActions()
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)

  // ✅ الـ enrollment المختار هلق مشتق من الـ URL مباشرة، مش من sessionStorage.
  // إذا الرابط بيشاور على enrollment غير صالح (ملغى/بانتظار دفع/كورس غير منشور)
  // منرجع تلقائيًا للقائمة — نفس السلوك القديم بالضبط بس عبر الراوتر الحقيقي.
  useEffect(() => {
    if (!enrollmentId || loading) return
    const found = enrollments.find(e => e._id === enrollmentId)
    if (!found) return // لسا عم يحمّل أو الرابط خاطئ — بيتعامل معه بالعرض تحت

    const course = found.course_id
    const isValid = found.status !== 'cancelled' &&
      found.status !== 'pending_payment' &&
      (!course?.status || course.status === 'published')

    if (!isValid) {
      routerNavigate(MY_COURSES_LIST_PATH, { replace: true })
    }
  }, [enrollmentId, enrollments, loading, routerNavigate])

  const selected: Enrollment | null =
    enrollmentId ? enrollments.find(e => e._id === enrollmentId) || null : null

  const handleBackFromPlayer = () => {
    routerNavigate(MY_COURSES_LIST_PATH)
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
    if (enrollment.status === 'pending_payment') {
      routerNavigate(CHECKOUT_PATH(enrollment._id))
      return
    }
    if (enrollment.status === 'cancelled') { info('تم إلغاء هذا التسجيل واسترداد المبلغ. لا يمكن الوصول لمحتوى الكورس.'); return }
    if (course?.status && course.status !== 'published') {
      info('هذا الكورس قيد التحديث حالياً من قبل المحاضر وينتظر مراجعة الإدارة. سيعود الوصول تلقائياً بعد الاعتماد.')
      return
    }
    routerNavigate(MY_COURSES_DETAIL_PATH(enrollment._id))
  }

  const handleRequestRefundClick = async (enrollment: Enrollment) => {
    const payment = await findPaymentForEnrollment(enrollment._id)
    if (!payment) {
      info('لم يتم العثور على عملية دفع مرتبطة بهذا التسجيل.')
      return
    }
    setRefundTarget(payment)
  }

  const handleCancelClick = async (enrollment: Enrollment) => {
    if (!window.confirm('هل أنت متأكد من إلغاء تسجيلك بهذا الكورس؟')) return
    const result = await cancelEnrollment(enrollment._id)
    if (result === 'cancelled') {
      await refetch()
    } else if (result === 'refund_required') {
      info('هذا الكورس مدفوع فعليًا — يرجى تقديم طلب استرداد بدلاً من الإلغاء المباشر.')
      await handleRequestRefundClick(enrollment)
    }
  }

  const handleSubmitRefund = async (reason?: string) => {
    if (!refundTarget) return
    const ok = await requestRefund(refundTarget._id, reason)
    if (ok) {
      setRefundTarget(null)
      await refetch()
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <h2 className="section-title" style={{ marginBottom: 20 }}>كورساتي</h2>
        <SkeletonLoader type="card" count={3} />
      </div>
    )
  }

  if (enrollmentId && selected) {
    return (
      <div className="page-wrapper">
        <CourseOverviewPanel enrollment={selected} onBack={handleBackFromPlayer} />
      </div>
    )
  }

  // ✅ الرابط فيه enrollmentId بس لسا ما لقيناه بالقائمة (مثلاً تحديث أو رابط خاطئ)
  if (enrollmentId && !selected) {
    return (
      <div className="page-wrapper">
        <SkeletonLoader type="row" count={4} />
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
        <div className="grid-3">
          {visible.map(e => (
            <EnrollmentCard
              key={e._id}
              enrollment={e}
              progressPercentage={progressMap[e.course_id?._id || ''] ?? 0}
              unavailable={Boolean(e.course_id?.status && e.course_id.status !== 'published')}
              onClick={() => handleCardClick(e)}
              onCancel={() => handleCancelClick(e)}
              onRequestRefund={() => handleRequestRefundClick(e)}
              actionLoading={cancellingId === e._id || findingPaymentId === e._id}
            />
          ))}
        </div>
      )}

      {refundTarget && (
        <RefundRequestModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSubmit={handleSubmitRefund}
          submitting={submittingRefund}
        />
      )}
    </div>
  )
}