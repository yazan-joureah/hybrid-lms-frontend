import type { CourseSummary } from '../../services/courseService'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../utils/imageUtils'

interface Props {
    course: CourseSummary
    onClick: () => void
}

export function CourseCard({ course, onClick }: Props) {
    return (
        <div className="course-card" onClick={onClick}>
            <div style={{ position: 'relative' }}>
                <img
                    src={getCourseCoverUrl(course._id) || PLACEHOLDER_IMAGE}
                    alt={course.title}
                    style={{ width: '100%', height: 168, objectFit: 'cover' }}
                    onError={handleImageFallback}
                />
                {course.is_synchronous && (
                    <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(6,182,212,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        مباشر
                    </span>
                )}
            </div>
            <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{course.category}</span>
                    <span className="badge badge-neutral">{course.course_type === 'free' ? 'مجاني' : 'مدفوع'}</span>
                </div>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.4, minHeight: 40 }}>{course.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>👥 {course.enrolledCount ?? 0} طالب</span>
                    {!!course.rating && <div className="stars">{'★'.repeat(Math.round(course.rating))}</div>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>
                        {course.course_type === 'free' ? 'مجاني' : `${course.price} ر.س`}
                    </span>
                    <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={e => { e.stopPropagation(); onClick() }}>
                        عرض التفاصيل
                    </button>
                </div>
            </div>
        </div>
    )
}