import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInstructorCourses } from '../../hooks/course/useInstructorCourses'
import { CourseListPanel } from './course-builder/CourseListPanel'
import { CourseDetailPanel, type TabKey } from './course-builder/CourseDetailPanel'
import { CreateCourseModal } from './course-builder/CreateCourseModal'
import { SkeletonLoader } from '../../components/common/Loading'
import { CourseContentPreviewModal } from '../../components/course/CourseContentPreviewModal'

export default function CourseBuilder() {
  const { courses, loading, refetch } = useInstructorCourses()
  const [searchParams, setSearchParams] = useSearchParams()
  const courseIdFromQuery = searchParams.get('courseId')
  const tabFromQuery = searchParams.get('tab') as TabKey | null

  const [selectedId, setSelectedId] = useState<string | null>(courseIdFromQuery)
  const [showCreate, setShowCreate] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // ✅ يزامن التحديد المحلي مع أي رابط خارجي يوصل بـ ?courseId=... (مثلاً
  // زر "إدارة الحصة" بلوحة تحكم المدرّس)، حتى لو الصفحة كانت مفتوحة أصلاً
  useEffect(() => {
    if (courseIdFromQuery) setSelectedId(courseIdFromQuery)
  }, [courseIdFromQuery])

  const handleSelect = (courseId: string) => {
    setSelectedId(prev => (prev === courseId ? null : courseId))
    // اختيار يدوي من القائمة يُلغي أي تبويب/كورس مفروض جاي من رابط خارجي
    if (searchParams.toString()) setSearchParams({}, { replace: true })
  }

  const handleDeleted = () => {
    setSelectedId(null)
    setSearchParams({}, { replace: true })
    refetch()
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="section-title">بناء الكورس</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>أنشئ وعدّل كورساتك ومحتواها</p>
        </div>
        <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => setShowCreate(true)}>+ كورس جديد</button>
      </div>

      {loading ? (
        <SkeletonLoader type="row" count={3} />
      ) : (
        <CourseListPanel
          courses={courses} selectedId={selectedId}
          onSelect={handleSelect} onCreateClick={() => setShowCreate(true)}
          onPreview={setPreviewId}
        />)}

      {selectedId && (
        <CourseDetailPanel
          key={`${selectedId}:${tabFromQuery || ''}`}
          courseId={selectedId}
          initialTab={tabFromQuery || undefined}
          onChanged={refetch}
          onDeleted={handleDeleted}
        />
      )}

      {showCreate && (
        <CreateCourseModal onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
      {previewId && (
        <CourseContentPreviewModal courseId={previewId} viewerRole="instructor" onClose={() => setPreviewId(null)} />
      )}
    </div>
  )
}