// src/components/course/CourseContentPreviewModal.tsx
import { ModalPortal } from '../common/ModalPortal'
import { useCoursePreview } from '../../hooks/course/useCoursePreview'
import { useContentPreview } from '../../hooks/course/useContentPreview'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'
import type { ContentItem } from '../../services/courseService'

const CONTENT_ICONS: Record<ContentItem['content_type'], string> = {
    video: '🎥', document: '📄', link: '🔗', text: '📝',
}

interface Props {
    courseId: string | null
    viewerRole: 'instructor' | 'admin'
    onClose: () => void
}

export function CourseContentPreviewModal({ courseId, viewerRole, onClose }: Props) {
    const { course, units, quizzes, loading } = useCoursePreview(courseId, { viewerRole })
    const contentPreview = useContentPreview(courseId)

    if (!courseId) return null

    const totalContentItems = units.reduce((sum, u) => sum + (u.content?.length || 0), 0)
    const finalExams = quizzes.filter(q => q.quiz_type === 'exam')
    const unitQuizzes = quizzes.filter(q => q.quiz_type === 'quiz')

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>معاينة محتوى الكورس</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>

                    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                        {loading || !course ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                                    <img
                                        src={getCourseCoverUrl(course._id) || PLACEHOLDER_IMAGE}
                                        alt={course.title}
                                        style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                                        onError={handleImageFallback}
                                    />
                                    <div>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>{course.title}</h2>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <span className="badge badge-primary">{course.category}</span>
                                            <span className="badge badge-neutral">{course.course_type === 'free' ? 'مجاني' : `مدفوع — ${course.price} ر.س`}</span>
                                            {course.is_synchronous && <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>مباشر</span>}
                                        </div>
                                    </div>
                                </div>

                                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>{course.description}</p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
                                    {[
                                        ['📦', units.length, 'وحدات'],
                                        ['📄', totalContentItems, 'عنصر محتوى'],
                                        ['📝', unitQuizzes.length, 'اختبار وحدة'],
                                        ['🏆', finalExams.length, 'امتحان نهائي'],
                                    ].map(([icon, val, label]) => (
                                        <div key={label as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 16 }}>{icon}</div>
                                            <div style={{ fontSize: 15, fontWeight: 800 }}>{val}</div>
                                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>محتوى الوحدات</div>
                                {units.length === 0 ? (
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>لا توجد وحدات بعد.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                                        {units.map((unit, uIdx) => (
                                            <div key={unit._id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                                                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', fontSize: 13.5, fontWeight: 700 }}>
                                                    الوحدة {uIdx + 1}: {unit.title}
                                                </div>
                                                <div style={{ padding: '4px 0' }}>
                                                    {(unit.content || []).length === 0 ? (
                                                        <div style={{ padding: '8px 14px', fontSize: 12.5, color: 'rgba(255,255,255,0.35)' }}>لا يوجد محتوى.</div>
                                                    ) : (
                                                        unit.content.map(item => {
                                                            const isExpanded = contentPreview.expandedId === item._id
                                                            const needsBlob = item.content_type === 'video' || item.content_type === 'document'
                                                            const fileUrl = contentPreview.fileUrls[item._id]
                                                            return (
                                                                <div key={item._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <div
                                                                        onClick={() => contentPreview.toggle(item._id, needsBlob)}
                                                                        style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                                                                    >
                                                                        <span>{CONTENT_ICONS[item.content_type]} {item.title}</span>
                                                                        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{isExpanded ? '▲' : '▼'}</span>
                                                                    </div>
                                                                    {isExpanded && (
                                                                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)' }}>
                                                                            {item.content_type === 'video' && fileUrl ? (
                                                                                <video controls src={fileUrl} style={{ width: '100%', maxHeight: 260, borderRadius: 8 }} />
                                                                            ) : item.content_type === 'document' && fileUrl ? (
                                                                                item.mime_type === 'application/pdf' ? (
                                                                                    <embed src={fileUrl} type="application/pdf" width="100%" height="320" />
                                                                                ) : (
                                                                                    <a href={fileUrl} download style={{ color: '#a855f7', fontSize: 13 }}>⬇ تحميل الملف</a>
                                                                                )
                                                                            ) : item.content_type === 'link' ? (
                                                                                <a href={item.content_data?.url} target="_blank" rel="noreferrer" style={{ color: '#a855f7', fontSize: 13 }}>{item.content_data?.url}</a>
                                                                            ) : item.content_type === 'text' ? (
                                                                                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.content_data?.text}</div>
                                                                            ) : null}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>الاختبارات</div>
                                {quizzes.length === 0 ? (
                                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>لا توجد اختبارات بعد.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {quizzes.map(q => (
                                            <div key={q._id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                                <div>
                                                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{q.quiz_type === 'exam' ? '🏆' : '📝'} {q.title}</span>
                                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                                                        {q.questions.length} سؤال | {q.duration_minutes} دقيقة | نجاح {q.passing_score_percent}%
                                                    </div>
                                                </div>
                                                <span className="badge" style={{ background: q.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: q.status === 'published' ? '#34d399' : '#94a3b8', fontSize: 10.5 }}>
                                                    {q.status === 'published' ? 'منشور' : 'مسودة'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}