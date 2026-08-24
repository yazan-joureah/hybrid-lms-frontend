// src/components/course/CoursePreviewModal.tsx
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { ModalPortal } from '../common/ModalPortal'
import { courseService, type CourseSummary, type CourseUnit, type ContentItem } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'

const CONTENT_ICONS: Record<ContentItem['content_type'], string> = {
    video: '🎥', document: '📄', link: '🔗', text: '📝',
}

interface Props {
    courseId: string | null
    viewerState: 'guest' | 'student' | 'other'
    onClose: () => void
    onEnrolled: () => void
    onRequireAuth: () => void
}

export function CoursePreviewModal({ courseId, viewerState, onClose, onEnrolled, onRequireAuth }: Props) {
    const { success, error: toastError, info } = useToast()
    const [course, setCourse] = useState<CourseSummary | null>(null)
    const [units, setUnits] = useState<CourseUnit[]>([])
    const [firstUnitContent, setFirstUnitContent] = useState<ContentItem[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [enrolling, setEnrolling] = useState(false)

    useEffect(() => {
        if (!courseId) { setCourse(null); setUnits([]); setFirstUnitContent(null); return }
        let cancelled = false
        setLoading(true)
        setFirstUnitContent(null)

        Promise.all([courseService.getById(courseId), courseService.getUnits(courseId)])
            .then(async ([c, u]) => {
                if (cancelled) return
                setCourse(c)
                setUnits(u)

                // معاينة مجانية: نجيب محتوى الوحدة الأولى فقط
                if (u.length > 0) {
                    try {
                        const detail = await courseService.getUnitDetail(courseId, u[0]._id)
                        if (!cancelled) setFirstUnitContent(detail?.content || [])
                    } catch {
                        if (!cancelled) setFirstUnitContent([]) // فشل جلب المعاينة لا يجب أن يكسر النافذة كاملة
                    }
                } else if (!cancelled) {
                    setFirstUnitContent([])
                }
            })
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
        <ModalPortal>

            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
                onClick={enrolling ? undefined : onClose}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 32, maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
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

                            {/* قائمة الوحدات */}
                            <div style={{ marginBottom: 16 }}>
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

                            {/* معاينة فعلية لمحتوى الوحدة الأولى */}
                            {firstUnitContent && firstUnitContent.length > 0 && (
                                <div style={{ marginBottom: 24, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#c4b5fd' }}>🔓 معاينة من {units[0]?.title}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {firstUnitContent.map(item => (
                                            <div key={item._id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>{CONTENT_ICONS[item.content_type]}</span>
                                                    <span>{item.title}</span>
                                                    {(item.content_type === 'video' || item.content_type === 'document') && (
                                                        <span style={{ marginRight: 'auto', fontSize: 10.5, color: '#fbbf24' }}>🔒 يتطلب التسجيل</span>
                                                    )}
                                                </div>

                                                {item.content_type === 'text' && (
                                                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                        {item.content_data?.text}
                                                    </div>
                                                )}
                                                {item.content_type === 'link' && item.content_data?.url && (
                                                    <a href={item.content_data.url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: '#a855f7' }}>
                                                        {item.content_data.url}
                                                    </a>
                                                )}
                                                {(item.content_type === 'video' || item.content_type === 'document') && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 90, background: 'rgba(0,0,0,0.25)', borderRadius: 8, color: 'rgba(255,255,255,0.3)', fontSize: 22 }}>
                                                        🔒
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <span style={{ fontSize: 22, fontWeight: 800, color: '#a855f7' }}>
                                    {course.course_type === 'free' ? 'مجاني' : `${course.price} ر.س`}
                                </span>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} disabled={enrolling} onClick={onClose}>إغلاق</button>
                                    {viewerState === 'student' && (
                                        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} disabled={enrolling} onClick={handleEnroll}>
                                            {enrolling ? 'جارٍ التسجيل...' : 'سجّل الآن'}
                                        </button>
                                    )}
                                    {viewerState === 'guest' && (
                                        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={onRequireAuth}>
                                            أنشئ حساباً للتسجيل →
                                        </button>
                                    )}
                                </div>
                            </div>
                            {viewerState === 'guest' && (
                                <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
                                    لديك حساب بالفعل؟{' '}
                                    <button
                                        onClick={onClose}
                                        style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, padding: 0, textDecoration: 'underline' }}
                                    >
                                        أغلق هذه النافذة وسجّل الدخول من الأعلى
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ModalPortal>
    )
}