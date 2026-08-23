import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type CourseSummary } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'
import { useDebouncedValue } from '../useDebouncedValue'

export type CourseTypeFilter = 'all' | 'free' | 'paid'
export type SortOption = 'relevance' | 'popular' | 'rating' | 'newest'

export function useCourseCatalog() {
    const { error: toastError } = useToast()

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebouncedValue(search, 400)
    const [category, setCategory] = useState('')
    const [courseType, setCourseType] = useState<CourseTypeFilter>('all')
    const [sortBy, setSortBy] = useState<SortOption>('relevance')
    const [page, setPage] = useState(1)

    const [courses, setCourses] = useState<CourseSummary[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)

    const hasActiveFilters = Boolean(search || category || courseType !== 'all' || sortBy !== 'relevance')

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            const result = await courseService.list({
                search: debouncedSearch,
                category,
                course_type: courseType === 'all' ? undefined : courseType,
                page,
                sort: sortBy,
            })
            setCourses(result.courses)
            setTotalPages(result.totalPages)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, category, courseType, sortBy, page, toastError])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    // أي تغيير بالفلاتر (غير الصفحة نفسها) يرجّع الصفحة للأولى
    useEffect(() => { setPage(1) }, [debouncedSearch, category, courseType, sortBy])

    const clearFilters = () => {
        setSearch('')
        setCategory('')
        setCourseType('all')
        setSortBy('relevance')
    }

    return {
        search, setSearch, category, setCategory, courseType, setCourseType, sortBy, setSortBy,
        page, setPage, totalPages, courses, loading, hasActiveFilters, clearFilters,
        refetch: fetchCourses,
    }
}