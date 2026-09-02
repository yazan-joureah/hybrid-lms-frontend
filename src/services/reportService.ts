// src/services/reportService.ts
import API from '../config/api'

export interface PersonalCourseProgress {
    courseId: string
    courseTitle: string
    enrollmentStatus: 'active' | 'completed'
    // ⚠️ افتراض غير مؤكد: حسب تعليق الباك اند بـ UC-REPORT-03، هذا الحقل
    // بنفس ستايل getCompletionCounts (كسر عشري 0..1)، مش نسبة جاهزة 0..100.
    // إذا تأكد لاحقاً إنه Backend يرجعها كنسبة جاهزة، بدّل فقط استخدام *100
    // بالمكونات أدناه بسطر واحد.
    progressPercentage: number
    completedCount: number
    totalCount: number
}

export type QuizResultType = 'quiz' | 'exam'

export interface LatestQuizResult {
    quizId: string
    quizTitle: string
    quizType: QuizResultType
    courseId: string
    scorePercent: number
    passed: boolean
    gradedAt: string
}

export interface PersonalProgressSummary {
    courses: PersonalCourseProgress[]
    latestQuizResults: LatestQuizResult[]
    // null = لا توجد أي حصة مباشرة منتهية بعد بأي كورس مسجَّل — حالة مختلفة عن 0%
    overallAttendancePercentage: number | null
}

export const reportService = {
    /** GET /report/me — UC-REPORT-03: بيانات الطالب الشخصية فقط (JWT، بلا MFA/KYC) */
    getMyProgressSummary: async (): Promise<PersonalProgressSummary> => {
        const res = await API.get('/report/me')
        return res.data?.data
    },
}