import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type CourseSummary, type CourseUnit } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'

interface Props {
    courseId: string | null
    canEnroll: boolean
    onClose: () => void
    onEnrolled: () => void
}

export function CoursePreviewModal({ courseId, canEnroll, onClose, onEnrolled }: Props) {
    const { success, error: toastError, info } = useToast()
    const [course, setCourse] = useState<CourseSummary | null>(null)
    const [units, setUnits] = useState<CourseUnit[]>([])
    const [loading, setLoading] = useState(false)
    const [enrolling, setEnrolling] = useState(false)

    useEffect(() => {
        if (!courseId) { setCourse(null); setUnits([]); return }
        let cancelled = false
        setLoading(true)
        Promise.all([courseService.getById(courseId), courseService.getUnits(courseId)])
            .then(([c, u]) => { if (!cancelled) { setCourse(c); setUnits(u) } })
            .catch(err => { if (!cancelled) { toastError(getErrorMessage(err)); onClose() } })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    if (!courseId) return null

    const handleEnroll = async () => {
        setEnrolling(true)
        try {
            const enrollment = await courseService.enroll(courseId)
            if (enrollment?.status === 'pending_payment') {
                info('تم إنشاء طلب التسجيل بنجاح. ميزة الدفع الإلكتروني ستكون متاحة قريباً.')
            } else {
                success('تم تسجيلك في الكورس بنجاح!')
            }
            onEnrolled()
            onClose()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setEnrolling(false)
        }
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
            onClick={enrolling ? undefined : onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 32, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {loading || !course ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.5)' }}>جارٍ التحميل...</div>
                ) : (
                    <>
                        <img
                            src={getCourseCoverUrl(course._id) || PLACEHOLDER_IMAGE}
                            alt={course.title}
                            style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 20 }}
                            onError={handleImageFallback}
                        />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                            <span className="badge badge-primary">{course.category}</span>
                            <span className="badge badge-neutral">{course.course_type === 'free' ? 'مجاني' : 'مدفوع'}</span>
                            {course.is_synchronous && <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>مباشر</span>}
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>{course.title}</h2>
                        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>{course.description}</div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>محتوى الكورس:</div>
                            {units.length === 0 ? (
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>لا توجد وحدات منشورة بعد.</div>
                            ) : (
                                units.map((u, idx) => (
                                    <div key={u._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
                                        <span style={{ color: '#a855f7', fontWeight: 700 }}>{idx + 1}.</span>
                                        <span style={{ color: 'rgba(255,255,255,0.75)' }}>{u.title}</span>
                                        {idx === 0 && <span className="badge badge-success" style={{ marginRight: 'auto', fontSize: 10.5 }}>معاينة مجانية</span>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <span style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>
                                {course.course_type === 'free' ? 'مجاني' : `${course.price} ر.س`}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} disabled={enrolling} onClick={onClose}>إغلاق</button>
                                {canEnroll && (
                                    <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} disabled={enrolling} onClick={handleEnroll}>
                                        {enrolling ? 'جارٍ التسجيل...' : 'سجّل الآن'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}