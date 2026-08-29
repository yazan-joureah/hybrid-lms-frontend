import { CATEGORY_OPTIONS } from '../../constants/courseOptions'
import type { CourseTypeFilter, SortOption } from '../../hooks/course/useCourseCatalog'

const TYPE_OPTIONS: { value: CourseTypeFilter; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'free', label: 'مجاني' },
    { value: 'paid', label: 'مدفوع' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'الأكثر ملاءمة' },
    { value: 'popular', label: 'الأكثر شعبية' },
    { value: 'rating', label: 'الأعلى تقييماً' },
    { value: 'newest', label: 'الأحدث' },
]

interface Props {
    search: string
    onSearchChange: (v: string) => void
    category: string
    onCategoryChange: (v: string) => void
    courseType: CourseTypeFilter
    onCourseTypeChange: (v: CourseTypeFilter) => void
    sortBy: SortOption
    onSortByChange: (v: SortOption) => void
}

export function CourseFilterBar({ search, onSearchChange, category, onCategoryChange, courseType, onCourseTypeChange, sortBy, onSortByChange }: Props) {
    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    className="form-input"
                    style={{ flex: '0 0 260px', paddingTop: 9, paddingBottom: 9 }}
                    placeholder="🔍 ابحث عن كورس..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                />
                <select className="form-input" style={{ flex: '0 0 200px' }} value={category} onChange={e => onCategoryChange(e.target.value)}>
                    <option value="">كل التصنيفات</option>
                    {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                    {TYPE_OPTIONS.map(o => (
                        <button
                            key={o.value}
                            onClick={() => onCourseTypeChange(o.value)}
                            style={{
                                padding: '7px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 500, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                                background: courseType === o.value ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
                                borderColor: courseType === o.value ? 'transparent' : 'rgba(255,255,255,0.15)', color: '#fff',
                            }}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
                <select className="form-input" style={{ flex: '0 0 170px' }} value={sortBy} onChange={e => onSortByChange(e.target.value as SortOption)}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        </div>
    )
}