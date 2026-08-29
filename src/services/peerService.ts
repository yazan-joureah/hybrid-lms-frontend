// src/services/peerService.ts
import API from '../config/api'

export interface RubricCriterion {
    criterion: string
    maxScore: number
    weight: number // 0..1
}

export type PeerAssignmentStatus = 'open' | 'distributed' | 'completed'

export interface PeerAssignment {
    _id: string
    courseId: string | { _id: string; title?: string }
    unitId?: string | { _id: string; title?: string } | null
    title: string
    description?: string
    rubric: RubricCriterion[]
    reviewersPerSubmission: number
    allowFileSubmission: boolean
    maxAttempts: number
    submissionDeadline?: string
    reviewDeadline?: string
    status: PeerAssignmentStatus
    pendingIssue?: string
}

export interface PeerAssignmentFormPayload {
    title: string
    description?: string
    unitId?: string
    submissionDeadline?: string
    reviewDeadline?: string
    reviewersPerSubmission: number
    allowFileSubmission: boolean
    maxAttempts: number
    rubric: RubricCriterion[]
}

export interface PeerSubmission {
    _id: string
    studentId?: string
    submittedAt: string
    fileId?: string | null
    textContent?: string
    attemptNumber: number
}

export interface AssignedReview {
    reviewId: string
    status: 'assigned' | 'completed'
    submissionDisplayId?: number
}

export interface ReviewSubmissionContent {
    displaySequentialId?: number
    textContent?: string
    hasFile?: boolean
}

export interface ReviewerFeedback {
    totalScore: number
    feedbackText?: string
}

export interface StudentGradeData {
    finalScorePercentage: number | null
    gradeOverridden?: boolean
    overrideReason?: string
    gradingFlagged?: boolean
    gradingFlagReason?: 'NO_REVIEWER_COMPLETED' | 'HIGH_VARIANCE' | string
    reviews?: ReviewerFeedback[]
}

export interface InstructorGradeRow {
    _id: string
    studentId?: { _id: string; full_name?: string; email?: string }
    finalScorePercentage: number | null
    gradeOverridden?: boolean
    overrideReason?: string
    gradingFlagged?: boolean
    gradingFlagReason?: string
}

export interface InstructorSubmissionRow {
    _id: string
    studentId?: { _id: string; full_name?: string; email?: string }
    submittedAt: string
    fileId?: string | null
}

export interface QualityReviewEntry {
    reviewId: string
    reviewer?: { name?: string; email?: string }
    status: 'assigned' | 'completed'
    totalScore?: number
    feedbackText?: string
}

export interface QualityAttempt {
    attemptNumber: number
    isCurrentAttempt: boolean
    reviewsCompleted: number
    reviewsAssigned: number
    averageScore?: number | null
    reviews: QualityReviewEntry[]
}

export interface QualityTimelineEntry {
    submissionId: string
    student?: { name?: string; email?: string }
    totalAttempts: number
    currentFinalScorePercentage: number | null
    gradeOverridden?: boolean
    attempts: QualityAttempt[]
}

export const peerService = {
    // ---------- عام (طالب + محاضر) ----------
    listAssignments: async (): Promise<PeerAssignment[]> => {
        const res = await API.get('/peer/assignments')
        return res.data?.data?.assignments || []
    },

    getAssignment: async (assignmentId: string): Promise<PeerAssignment | null> => {
        const res = await API.get(`/peer/assignments/${assignmentId}`)
        return res.data?.data?.assignment || null
    },

    // ---------- المحاضر: إدارة المهام ----------
    createAssignment: async (courseId: string, data: PeerAssignmentFormPayload): Promise<void> => {
        await API.post('/peer/assignments', { ...data, courseId })
    },

    updateAssignment: async (assignmentId: string, data: PeerAssignmentFormPayload): Promise<void> => {
        await API.patch(`/peer/assignments/${assignmentId}`, data)
    },

    deleteAssignment: async (assignmentId: string): Promise<void> => {
        await API.delete(`/peer/assignments/${assignmentId}`)
    },

    distributeReviews: async (assignmentId: string): Promise<void> => {
        await API.post(`/peer/assignments/${assignmentId}/distribute`)
    },

    calculateGrades: async (assignmentId: string, lockAssignment: boolean): Promise<void> => {
        await API.post(`/peer/assignments/${assignmentId}/calculate-grades?lockAssignment=${lockAssignment}`)
    },

    listSubmissions: async (assignmentId: string): Promise<InstructorSubmissionRow[]> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/submissions`)
        return res.data?.data?.submissions || []
    },

    getAllGrades: async (assignmentId: string): Promise<InstructorGradeRow[]> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/grades`)
        return res.data?.data?.submissions || []
    },

    listReviewQualityTimeline: async (assignmentId: string): Promise<QualityTimelineEntry[]> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/reviews`)
        return res.data?.data?.timeline || []
    },

    overrideGrade: async (assignmentId: string, submissionId: string, finalScorePercentage: number, reason?: string): Promise<void> => {
        await API.patch(`/peer/assignments/${assignmentId}/submissions/${submissionId}/override-grade`, {
            finalScorePercentage,
            reason: reason || undefined,
        })
    },

    // ---------- الطالب: التسليم ----------
    getMySubmission: async (assignmentId: string): Promise<PeerSubmission | null> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/my-submission`)
        return res.data?.data?.submission || null
    },

    submitAssignment: async (assignmentId: string, textContent: string, file: File | null): Promise<void> => {
        const formData = new FormData()
        if (textContent.trim()) formData.append('textContent', textContent.trim())
        if (file) formData.append('file', file)
        await API.post(`/peer/assignments/${assignmentId}/submit`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    getMyGrade: async (assignmentId: string): Promise<StudentGradeData | null> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/grades`)
        return res.data?.data || null
    },

    // ---------- الطالب: مراجعة زملائه ----------
    listMyReviews: async (assignmentId: string): Promise<AssignedReview[]> => {
        const res = await API.get(`/peer/assignments/${assignmentId}/my-reviews`)
        return res.data?.data?.reviews || []
    },

    getReviewSubmission: async (reviewId: string): Promise<ReviewSubmissionContent | null> => {
        const res = await API.get(`/peer/reviews/${reviewId}/submission`)
        return res.data?.data || null
    },

    downloadReviewSubmissionFile: async (reviewId: string): Promise<Blob> => {
        const res = await API.get(`/peer/reviews/${reviewId}/submission/download`, { responseType: 'blob' })
        return res.data
    },

    submitReview: async (reviewId: string, scores: { criterion: string; score: number }[], feedbackText?: string): Promise<void> => {
        await API.post(`/peer/reviews/${reviewId}`, { scores, feedbackText: feedbackText || undefined })
    },
}