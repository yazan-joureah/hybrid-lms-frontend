// src/services/aiService.ts
import API from '../config/api'

export interface AIMessage {
    sender: 'user' | 'assistant'
    text: string
    flagged: boolean
    createdAt: string
}

export interface AIQueryResult {
    reply: string
    flagged: boolean
}

export interface AIStudentSessionResult {
    sessionId: string
}

export type InstructorAIOption = 'content_suggestions' | 'performance_summary'

export interface AIInstructorSessionResult {
    sessionId: string
    options: InstructorAIOption[]
}

export const aiService = {
    // ---------- الطالب (UC-AI-01/02/03) ----------
    startStudentSession: async (courseId: string): Promise<AIStudentSessionResult> => {
        const res = await API.post(`/ai/courses/${courseId}/student/session`)
        return res.data?.data
    },

    queryAssistant: async (courseId: string, message: string): Promise<AIQueryResult> => {
        const res = await API.post(`/ai/courses/${courseId}/student/query`, { message })
        return res.data?.data
    },

    getHistory: async (courseId: string): Promise<AIMessage[]> => {
        const res = await API.get(`/ai/courses/${courseId}/student/history`)
        return res.data?.data?.messages || []
    },

    // ---------- المحاضر (UC-AI-04/05/06) ----------
    startInstructorSession: async (courseId: string): Promise<AIInstructorSessionResult> => {
        const res = await API.post(`/ai/courses/${courseId}/instructor/session`)
        return res.data?.data
    },

    generateContentSuggestions: async (courseId: string, message: string): Promise<AIQueryResult> => {
        const res = await API.post(`/ai/courses/${courseId}/instructor/suggestions`, { message })
        return res.data?.data
    },

    getPerformanceSummary: async (courseId: string, focus?: string): Promise<AIQueryResult> => {
        const res = await API.post(`/ai/courses/${courseId}/instructor/performance-summary`, { focus })
        return res.data?.data
    },
}