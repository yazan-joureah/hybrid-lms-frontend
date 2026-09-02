// src/services/instructorAnalyticsService.ts
import API from '../config/api'

export type AlertType = 'LOW_PERFORMANCE' | 'LOW_ATTENDANCE'
export type AlertSeverity = 'high' | 'medium'

export interface CourseLevelAlert {
    type: AlertType
    courseId: string
    value: number
    threshold: number
    severity: AlertSeverity
}

export interface QuizPerformanceItem {
    quizId: string
    title: string
    quizType: 'quiz' | 'exam'
    averageScorePercent: number | null
    passRate: number | null
    attemptCount: number
}

export interface InstructorStudentRow {
    studentId: string
    fullName: string
    email: string
    contentViewedCount: number
    contentViewedPercent: number | null
    attendedSessionsCount: number
    attendancePercent: number | null
}

export interface FlaggedStudent {
    studentId: string
    fullName: string
}

export interface InstructorCourseAnalytics {
    courseTitle: string
    quizPerformance: QuizPerformanceItem[]
    students: InstructorStudentRow[]
    flaggedStudents: FlaggedStudent[]
    courseLevelAlerts: CourseLevelAlert[]
}

export const instructorAnalyticsService = {
    /** GET /report/instructor/courses/:courseId — UC-REPORT-02 */
    getCourseAnalytics: async (courseId: string): Promise<InstructorCourseAnalytics> => {
        const res = await API.get(`/report/instructor/courses/${courseId}`)
        return res.data?.data
    },
}