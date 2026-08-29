import type { CourseFormPayload } from '../services/courseService'

export const CATEGORY_OPTIONS = [
    { value: 'Technology & Computer Science', label: 'تقنية وعلوم حاسوب' },
    { value: 'Business & Finance', label: 'أعمال ومال' },
    { value: 'Health, Medicine & Wellness', label: 'صحة وطب' },
    { value: 'Arts, Design & Creative', label: 'فنون وتصميم' },
    { value: 'Mathematics, Science & Engineering', label: 'رياضيات وهندسة' },
    { value: 'Humanities & Social Sciences', label: 'علوم إنسانية' },
    { value: 'Languages', label: 'لغات' },
    { value: 'Personal Development & Lifestyle', label: 'تطوير ذاتي' },
]

export const EMPTY_COURSE_FORM: CourseFormPayload = {
    title: '', description: '', category: CATEGORY_OPTIONS[0].value, course_type: 'free',
    price: 0, is_synchronous: false, max_students: null, completion_threshold: 0.7,
}