import { useState } from 'react'
import { useInstructorCourses } from '../../hooks/course/useInstructorCourses'
import { CourseListPanel } from './course-builder/CourseListPanel'
import { CourseDetailPanel } from './course-builder/CourseDetailPanel'
import { CreateCourseModal } from './course-builder/CreateCourseModal'
import { SkeletonLoader } from '../../components/common/Loading'

export default function CourseBuilder() {
  const { courses, loading, refetch } = useInstructorCourses()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const handleSelect = (courseId: string) => {
    setSelectedId(prev => (prev === courseId ? null : courseId))
  }

  const handleDeleted = () => {
    setSelectedId(null)
    refetch()
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="section-title">بناء الكورس</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>أنشئ وعدّل كورساتك ومحتواها</p>
        </div>
        <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={() => setShowCreate(true)}>+ كورس جديد</button>
      </div>

      {loading ? (
        <SkeletonLoader type="row" count={3} />
      ) : (
        <CourseListPanel courses={courses} selectedId={selectedId} onSelect={handleSelect} onCreateClick={() => setShowCreate(true)} />
      )}

      {selectedId && (
        <CourseDetailPanel courseId={selectedId} onChanged={refetch} onDeleted={handleDeleted} />
      )}

      {showCreate && (
        <CreateCourseModal onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
    </div>
  )
}