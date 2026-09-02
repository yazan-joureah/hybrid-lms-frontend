// src/services/courseService.ts
import API from '../config/api'

export interface CourseSummary {
    _id: string
    title: string
    description: string
    category: string
    course_type: 'free' | 'paid'
    price: number
    is_synchronous: boolean
    status?: string
    rating?: number
    enrolledCount?: number
}

export interface CourseUnit {
    _id: string
    title: string
    desc?: string
}

export interface CourseListParams {
    search?: string
    category?: string
    course_type?: 'free' | 'paid'
    page?: number
    limit?: number
    sort?: 'relevance' | 'popular' | 'rating' | 'newest'
}

export interface CourseListResult {
    courses: CourseSummary[]
    totalPages: number
}

export type EnrollmentStatus = 'active' | 'pending_payment' | 'completed' | 'cancelled'

export interface Enrollment {
    _id: string
    status: EnrollmentStatus
    course_id: CourseSummary
    enrolled_at?: string
}

export interface ProgressSummary {
    progress_percentage: number
}

// ---------- Instructor types ----------
export interface InstructorCourse extends CourseSummary {
    status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'suspended' | 'archived'
    rejection_reason?: string
    max_students?: number | null
    completion_threshold?: number
}

export interface PendingCourseSummary extends CourseSummary {
    status: string
    updatedAt: string
    instructor_id: { full_name?: string } | string
}

export type CourseReviewDecision = 'publish' | 'needs_revision' | 'reject'
export type CourseModerationStatus = 'suspended' | 'archived' | 'published'
export interface EnrolledStudent {
    _id: string
    student_id: { _id: string; full_name: string; email: string } | null
    enrolled_at: string
    status: EnrollmentStatus
}

export interface AdminCourseListParams {
    status?: string
    page?: number
    limit?: number
}

export interface AdminCourseListResult {
    courses: PendingCourseSummary[]
    totalPages: number
    totalRecords: number
}

export interface CourseFormPayload {
    title: string
    description: string
    category: string
    course_type: 'free' | 'paid'
    price: number
    is_synchronous: boolean
    max_students?: number | null
    completion_threshold: number
}

export interface ContentItem {
    _id: string
    title: string
    desc?: string
    content_type: 'video' | 'document' | 'link' | 'text'
    content_data?: { url?: string; text?: string }
    mime_type?: string
    completed?: boolean
}

export interface UnitDetail extends CourseUnit {
    content: ContentItem[]
}

export interface PlayerUnit extends CourseUnit {
    content?: ContentItem[]
}

export interface ContentFormInput {
    title: string
    desc?: string
    contentType: 'video' | 'document' | 'link' | 'text'
    url?: string
    text?: string
    file?: File | null
}

export const courseService = {
    list: async (params: CourseListParams = {}): Promise<CourseListResult> => {
        const res = await API.get('/courses', {
            params: {
                search: params.search || undefined,
                category: params.category || undefined,
                course_type: params.course_type || undefined,
                page: params.page || 1,
                limit: params.limit || 12,
                sort: params.sort || 'relevance',
            },
        })
        const data = res.data?.data
        return {
            courses: data?.courses || [],
            totalPages: data?.pagination?.totalPages || 1,
        }
    },

    getById: async (courseId: string): Promise<CourseSummary | null> => {
        const res = await API.get(`/courses/${courseId}`)
        return res.data?.data?.course || res.data?.data || null
    },

    getUnits: async (courseId: string): Promise<CourseUnit[]> => {
        const res = await API.get(`/courses/${courseId}/units`)
        const data = res.data?.data
        return Array.isArray(data) ? data : data?.units || []
    },

    enroll: async (courseId: string): Promise<Enrollment | null> => {
        const res = await API.post(`/courses/${courseId}/enroll`)
        return res.data?.data?.enrollment || null
    },

    // ---------- Student: enrollments ----------
    getMyCourses: async (): Promise<Enrollment[]> => {
        const res = await API.get('/courses/enrollments/my-courses', { params: { limit: 100 } })
        return res.data?.data?.enrollments || []
    },

    cancelEnrollment: async (enrollmentId: string): Promise<void> => {
        await API.delete(`/courses/enrollments/${enrollmentId}`)
    },

    getProgressSummary: async (courseId: string): Promise<ProgressSummary | null> => {
        try {
            const res = await API.get(`/courses/${courseId}/progress-summary`)
            return res.data?.data || null
        } catch {
            return null
        }
    },

    // ---------- Instructor: course CRUD ----------
    getMyInstructorCourses: async (): Promise<InstructorCourse[]> => {
        const res = await API.get('/courses/instructor/my-courses')
        return res.data?.data?.courses || []
    },

    createCourse: async (payload: CourseFormPayload): Promise<InstructorCourse | null> => {
        const body: Record<string, unknown> = {
            title: payload.title.trim(),
            description: payload.description.trim(),
            category: payload.category,
            course_type: payload.course_type,
            price: Number(payload.price) || 0,
            is_synchronous: payload.is_synchronous,
            completion_threshold: Number(payload.completion_threshold) || 0.7,
        }
        if (payload.max_students !== null && payload.max_students !== undefined && payload.max_students !== ('' as unknown)) {
            body.max_students = Number(payload.max_students)
        }
        const res = await API.post('/courses', body)
        return res.data?.data?.course || res.data?.data || null
    },

    updateCourse: async (courseId: string, payload: Partial<CourseFormPayload>): Promise<void> => {
        await API.put(`/courses/${courseId}`, payload)
    },

    deleteCourse: async (courseId: string): Promise<void> => {
        await API.delete(`/courses/${courseId}`)
    },

    uploadCoverImage: async (courseId: string, file: File): Promise<void> => {
        const formData = new FormData()
        formData.append('image', file)
        await API.patch(`/courses/${courseId}/cover-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    submitForReview: async (courseId: string): Promise<void> => {
        await API.post(`/courses/${courseId}/submit-review`)
    },

    cancelReview: async (courseId: string): Promise<void> => {
        await API.post(`/courses/${courseId}/cancel-review`)
    },

    // ---------- Instructor: units ----------
    getUnitDetail: async (courseId: string, unitId: string): Promise<UnitDetail | null> => {
        const res = await API.get(`/courses/${courseId}/units/${unitId}`)
        return res.data?.data?.unit || res.data?.data || null
    },

    getUnitsWithContent: async (courseId: string): Promise<UnitDetail[]> => {
        const list = await courseService.getUnits(courseId)
        const detailed = await Promise.all(
            list.map(async u => {
                try {
                    const full = await courseService.getUnitDetail(courseId, u._id)
                    return full || { ...u, content: [] }
                } catch {
                    return { ...u, content: [] }
                }
            })
        )
        return detailed
    },

    addUnit: async (courseId: string, title: string, desc?: string): Promise<void> => {
        await API.post(`/courses/${courseId}/units`, { title, desc })
    },

    updateUnit: async (courseId: string, unitId: string, title: string, desc?: string): Promise<void> => {
        await API.put(`/courses/${courseId}/units/${unitId}`, { title, desc })
    },

    deleteUnit: async (courseId: string, unitId: string): Promise<void> => {
        await API.delete(`/courses/${courseId}/units/${unitId}`)
    },

    reorderUnits: async (courseId: string, orderedUnitIds: string[]): Promise<void> => {
        await API.patch(`/courses/${courseId}/units/reorder`, { ordered_unit_ids: orderedUnitIds })
    },

    // ---------- Instructor: content ----------
    addContent: async (courseId: string, unitId: string, input: ContentFormInput): Promise<void> => {
        const formData = new FormData()
        formData.append('title', input.title)
        if (input.desc) formData.append('desc', input.desc)
        formData.append('content_type', input.contentType)
        if (input.url) formData.append('url', input.url)
        if (input.text) formData.append('text', input.text)
        if (input.file) formData.append('file', input.file)
        await API.post(`/courses/${courseId}/units/${unitId}/content`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    updateContent: async (courseId: string, unitId: string, contentId: string, input: ContentFormInput): Promise<void> => {
        const formData = new FormData()
        formData.append('title', input.title)
        formData.append('desc', input.desc || '')
        if (input.contentType === 'link' && input.url) {
            formData.append('contentData', JSON.stringify({ url: input.url }))
        }
        if (input.contentType === 'text' && input.text) {
            formData.append('contentData', JSON.stringify({ text: input.text }))
        }
        if (input.file) formData.append('file', input.file)
        await API.put(`/courses/${courseId}/units/${unitId}/content/${contentId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    deleteContent: async (courseId: string, unitId: string, contentId: string): Promise<void> => {
        await API.delete(`/courses/${courseId}/units/${unitId}/content/${contentId}`)
    },

    reorderContent: async (courseId: string, unitId: string, orderedContentIds: string[]): Promise<void> => {
        await API.patch(`/courses/${courseId}/units/${unitId}/content/reorder`, { ordered_content_ids: orderedContentIds })
    },

    // ---------- Student: content player ----------
    getContentFileBlob: async (courseId: string, contentId: string): Promise<Blob> => {
        const res = await API.get(`/courses/${courseId}/content/${contentId}/file`, { responseType: 'blob' })
        return res.data
    },

    markContentComplete: async (courseId: string, contentId: string): Promise<void> => {
        await API.post(`/courses/${courseId}/progress`, { content_id: contentId })
    },

    // ---------- Admin: course moderation ----------
    getPendingCourses: async (): Promise<PendingCourseSummary[]> => {
        const res = await API.get('/admin/courses/pending')
        return res.data?.data?.courses || []
    },

    /** GET /admin/courses?status=&page=&limit= — كل الكورسات (مو بس pending) */
    getAllCoursesForAdmin: async (params: AdminCourseListParams = {}): Promise<AdminCourseListResult> => {
        const res = await API.get('/admin/courses', { params })
        const data = res.data?.data
        return {
            courses: data?.courses || [],
            totalPages: data?.meta?.total_pages || 1,
            totalRecords: data?.meta?.total_records || 0,
        }
    },

    submitCourseReview: async (courseId: string, decision: CourseReviewDecision, reason?: string): Promise<void> => {
        const payload: Record<string, unknown> = { decision }
        if (decision !== 'publish' && reason) payload.reason = reason
        await API.post(`/admin/courses/${courseId}/review`, payload)
    },

    updateCourseStatus: async (courseId: string, status: CourseModerationStatus): Promise<void> => {
        await API.patch(`/admin/courses/${courseId}/status`, { status })
    },

    // ---------- Instructor: enrolled students ----------
    getEnrolledStudents: async (courseId: string): Promise<EnrolledStudent[]> => {
        const res = await API.get(`/courses/${courseId}/students`)
        return res.data?.data?.students || []
    },
}