import { useState } from 'react'
import { useInstructorCourses } from '../../hooks/course/useInstructorCourses'
import { CourseListPanel } from './course-builder/CourseListPanel'
import { CourseDetailPanel } from './course-builder/CourseDetailPanel'
import { CreateCourseModal } from './course-builder/CreateCourseModal'
import { SkeletonLoader } from '../../components/common/Loading'
import { CourseContentPreviewModal } from '../../components/course/CourseContentPreviewModal'

export default function CourseBuilder() {
  const { courses, loading, refetch } = useInstructorCourses()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const handleSelect = (courseId: string) => {
    setSelectedId(prev => (prev === courseId ? null : courseId))
  }

  const handleDeleted = () => {
    setSelectedId(null)
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
        <CourseDetailPanel courseId={selectedId} onChanged={refetch} onDeleted={handleDeleted} />
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