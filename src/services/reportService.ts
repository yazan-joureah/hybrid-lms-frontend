// src/services/reportService.ts
import API from '../config/api'

export interface PersonalCourseProgress {
    courseId: string
    courseTitle: string
    enrollmentStatus: 'active' | 'completed'
    
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
   
    overallAttendancePercentage: number | null
}

export const reportService = {
    
    getMyProgressSummary: async (): Promise<PersonalProgressSummary> => {
        const res = await API.get('/report/me')
        return res.data?.data
    },
}