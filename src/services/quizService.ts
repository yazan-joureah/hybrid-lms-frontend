// src/services/quizService.ts
import API from '../config/api'

export type QuizType = 'quiz' | 'exam'
export type QuizStatus = 'draft' | 'published'
export type QuestionType = 'mcq' | 'true_false'

export interface QuizChoice {
    _id?: string
    text: string
    is_correct: boolean
}

export interface QuizQuestion {
    _id?: string
    question_type: QuestionType
    text: string
    choices: QuizChoice[]
}

export interface Quiz {
    _id: string
    course_id?: string
    unit_id?: string | null
    title: string
    description?: string
    quiz_type: QuizType
    status: QuizStatus
    locked?: boolean
    start_time?: string
    end_time?: string
    duration_minutes: number
    passing_score_percent: number
    max_attempts: number
    allow_back_navigation: boolean
    questions: QuizQuestion[]
}

export interface QuizFormPayload {
    title: string
    description?: string
    quiz_type: QuizType
    unit_id?: string
    start_time?: string
    end_time?: string
    duration_minutes: number
    passing_score_percent: number
    max_attempts: number
    allow_back_navigation: boolean
    questions: QuizQuestion[]
}

// ---------- Student-facing shapes (بدون كشف الإجابات الصحيحة) ----------
export interface StudentQuizSummary {
    _id: string
    title: string
    description?: string
    quiz_type: QuizType
    unit_id?: string | null
    duration_minutes: number
    passing_score_percent: number
    max_attempts: number
    last_result?: { passed: boolean; score_percent: number } | null
}

export interface AttemptChoice { _id: string; text: string }
export interface AttemptQuestion { _id: string; text: string; choices: AttemptChoice[] }
export interface ActiveAttempt {
    attempt_id: string
    expires_at: string
    server_time: string
    quiz: { _id: string; title: string; questions: AttemptQuestion[] }
    previous_answers?: { question_id: string; selected_choice_id: string }[]
}

export interface QuizResult {
    score: number
    total_possible: number
    percentage: number
    passed: boolean
}

function buildPayload(courseId: string | undefined, form: QuizFormPayload) {
    const payload: Record<string, unknown> = {
        quiz_type: form.quiz_type,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : undefined,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : undefined,
        duration_minutes: Number(form.duration_minutes),
        passing_score_percent: Number(form.passing_score_percent),
        max_attempts: Number(form.max_attempts),
        allow_back_navigation: Boolean(form.allow_back_navigation),
        questions: form.questions.map(q => ({
            question_type: q.question_type,
            text: q.text,
            choices: q.choices.map(c => ({ text: c.text, is_correct: c.is_correct })),
        })),
    }
    if (form.quiz_type === 'quiz') payload.unit_id = form.unit_id
    if (courseId) payload.course_id = courseId
    return payload
}

export const quizService = {
    // ---------- Instructor ----------
    listForCourse: async (courseId: string): Promise<Quiz[]> => {
        const res = await API.get('/quizzes', { params: { course_id: courseId } })
        return res.data?.data?.quizzes || []
    },

    getById: async (quizId: string): Promise<Quiz | null> => {
        const res = await API.get(`/quizzes/${quizId}`)
        return res.data?.data?.quiz || null
    },

    create: async (courseId: string, form: QuizFormPayload): Promise<void> => {
        await API.post('/quizzes', buildPayload(courseId, form))
    },

    update: async (quizId: string, form: QuizFormPayload): Promise<void> => {
        await API.put(`/quizzes/${quizId}`, buildPayload(undefined, form))
    },

    delete: async (quizId: string): Promise<void> => {
        await API.delete(`/quizzes/${quizId}`)
    },

    publish: async (quizId: string): Promise<void> => {
        await API.post(`/quizzes/${quizId}/publish`)
    },

    // ---------- Admin / معاينة للقراءة فقط ----------
    listForCourseAdmin: async (courseId: string): Promise<Quiz[]> => {
        const res = await API.get(`/quizzes/admin/course/${courseId}`)
        return res.data?.data?.quizzes || []
    },

    // ---------- Student ----------
    listAvailableForCourse: async (courseId: string): Promise<StudentQuizSummary[]> => {
        const res = await API.get(`/quizzes/course/${courseId}/available`)
        return res.data?.data?.quizzes || res.data?.data || []
    },

    getCurrentAttempt: async (quizId: string): Promise<ActiveAttempt | null> => {
        const res = await API.get(`/quizzes/${quizId}/current-attempt`)
        return res.data?.data || null
    },

    startAttempt: async (quizId: string): Promise<ActiveAttempt> => {
        const res = await API.post(`/quizzes/${quizId}/start`)
        return res.data?.data
    },

    saveAnswer: async (attemptId: string, questionId: string, choiceId: string): Promise<void> => {
        await API.post(`/quizzes/attempts/${attemptId}/answers`, { question_id: questionId, selected_choice_id: choiceId })
    },

    submitAttempt: async (attemptId: string): Promise<QuizResult> => {
        const res = await API.post(`/quizzes/attempts/${attemptId}/submit`)
        return res.data?.data
    },
}