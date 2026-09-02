import type { Enrollment } from '../../services/courseService'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'

interface Props {
    enrollment: Enrollment
    progressPercentage: number
    unavailable: boolean
    onClick: () => void
    onCancel?: () => void
    onRequestRefund?: () => void
    actionLoading?: boolean
}

export function EnrollmentCard({ enrollment, progressPercentage, unavailable, onClick, onCancel, onRequestRefund, actionLoading }: Props) {
    const course = enrollment.course_id
    const isPendingPayment = enrollment.status === 'pending_payment'
    const isCancelled = enrollment.status === 'cancelled'
    const isCompleted = enrollment.status === 'completed'
    const isActive = enrollment.status === 'active'
    // إلغاء ذاتي مباشر: كورس مجاني فعّال، أو أي كورس لسا بانتظار الدفع
    const canSelfCancel = (isActive && course?.course_type === 'free') || isPendingPayment
    // كورس مدفوع فعّال → لازم يمر عبر طلب استرداد بدل الإلغاء المباشر
    const canRequestRefund = isActive && course?.course_type === 'paid'

    return (
        <div
            className="course-card"
            style={{ opacity: isCancelled || unavailable ? 0.6 : 1, cursor: isCancelled ? 'default' : 'pointer' }}
            onClick={onClick}
        >
            <div style={{ position: 'relative' }}>
                <img
                    src={getCourseCoverUrl(course?._id) || PLACEHOLDER_IMAGE}
                    alt={course?.title || 'كورس'}
                    style={{ width: '100%', height: 168, objectFit: 'cover' }}
                    onError={handleImageFallback}
                />
                {unavailable && !isCancelled && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        🛠️ قيد التحديث
                    </span>
                )}
                {isCompleted && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        ✅ مكتمل
                    </span>
                )}
                {isPendingPayment && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        💳 بانتظار الدفع
                    </span>
                )}
                {isCancelled && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(148,163,184,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        🚫 ملغى
                    </span>
                )}
            </div>
            <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{course?.title || 'كورس غير معروف'}</h3>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>{course?.category || '—'}</div>

                {!isCancelled && !isPendingPayment && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>التقدم</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{Math.round(progressPercentage * 100)}%</span>
                        </div>
                        <div className="progress-bar" style={{ marginBottom: 14 }}>
                            <div className="progress-fill" style={{ width: `${progressPercentage * 100}%` }} />
                        </div>
                    </>
                )}

                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: 13.5 }} disabled={isCancelled} onClick={e => { e.stopPropagation(); onClick() }}>
                    {isCancelled ? '🚫 غير متاح' : unavailable ? '🛠️ قيد التحديث' : isPendingPayment ? '💳 إتمام الدفع' : isCompleted ? '🏆 مكتمل — مراجعة' : '▶ متابعة التعلم'}
                </button>

                {(canSelfCancel || canRequestRefund) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {canSelfCancel && onCancel && (
                            <button
                                className="btn-ghost"
                                style={{ flex: 1, fontSize: 12, padding: '6px', color: '#f87171' }}
                                disabled={actionLoading}
                                onClick={e => { e.stopPropagation(); onCancel() }}
                            >
                                {actionLoading ? '...' : '🚫 إلغاء التسجيل'}
                            </button>
                        )}
                        {canRequestRefund && onRequestRefund && (
                            <button
                                className="btn-ghost"
                                style={{ flex: 1, fontSize: 12, padding: '6px', color: '#fbbf24' }}
                                disabled={actionLoading}
                                onClick={e => { e.stopPropagation(); onRequestRefund() }}
                            >
                                {actionLoading ? '...' : '↩️ طلب استرداد'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}