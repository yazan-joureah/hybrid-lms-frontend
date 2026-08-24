import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { useCourseCatalog } from '../../hooks/course/useCourseCatalog'
import { CourseFilterBar } from '../../components/course/CourseFilterBar'
import { CourseCard } from '../../components/course/CourseCard'
import { CoursePreviewModal } from '../../components/course/CoursePreviewModal'
import { SkeletonLoader } from '../../components/common/Loading'

export default function CourseCatalog() {
  const { role, isAuthenticated, navigate } = useNav()
  const catalog = useCourseCatalog()
  const [previewId, setPreviewId] = useState<string | null>(null)
  const viewerState: 'guest' | 'student' | 'other' = !isAuthenticated
    ? 'guest'
    : role === 'student' ? 'student' : 'other'

  const handleRequireAuth = () => {
    navigate('login')
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title">استعراض الكورسات</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>اكتشف الكورسات المنشورة وسجّل بأمان</p>
        </div>
        {catalog.hasActiveFilters && (
          <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={catalog.clearFilters}>
            مسح الفلاتر
          </button>
        )}
      </div>

      <CourseFilterBar
        search={catalog.search} onSearchChange={catalog.setSearch}
        category={catalog.category} onCategoryChange={catalog.setCategory}
        courseType={catalog.courseType} onCourseTypeChange={catalog.setCourseType}
        sortBy={catalog.sortBy} onSortByChange={catalog.setSortBy}
      />

      {catalog.loading ? (
        <SkeletonLoader type="card" count={6} />
      ) : catalog.courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لم يتم العثور على كورسات</div>
          <div style={{ fontSize: 13.5, marginBottom: 16 }}>حاول تغيير كلمة البحث أو الفلاتر</div>
          {catalog.hasActiveFilters && (
            <button className="btn-primary" style={{ padding: '9px 22px' }} onClick={catalog.clearFilters}>مسح الفلاتر</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
          {catalog.courses.map(c => (
            <CourseCard key={c._id} course={c} onClick={() => setPreviewId(c._id)} />
          ))}
        </div>
      )}

      {!catalog.loading && catalog.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 28 }}>
          <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} disabled={catalog.page === 1} onClick={() => catalog.setPage(p => Math.max(1, p - 1))}>
            السابق
          </button>
          <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>صفحة {catalog.page} من {catalog.totalPages}</span>
          <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} disabled={catalog.page === catalog.totalPages} onClick={() => catalog.setPage(p => Math.min(catalog.totalPages, p + 1))}>
            التالي
          </button>
        </div>
      )}

      <CoursePreviewModal
        courseId={previewId}
        viewerState={viewerState}
        onClose={() => setPreviewId(null)}
        onEnrolled={catalog.refetch}
        onRequireAuth={handleRequireAuth}
      />
    </div>
  )
}