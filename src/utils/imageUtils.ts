// src/utils/imageUtils.ts
import { BASE_URL } from '../config/api'

export const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%231a0f3d'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='Arial' font-size='18' fill='%23a855f7'%3Eلا توجد صورة%3C/text%3E%3C/svg%3E"

export function getCourseCoverUrl(courseId?: string | null): string | null {
    if (!courseId) return null
    return `${BASE_URL}/courses/${courseId}/cover-image`
}

export function getUserProfilePictureUrl(userId?: string | null): string | null {
    if (!userId) return null
    return `${BASE_URL}/users/${userId}/profile-picture`
}

// onError handler موحّد لأي <img> بدل تكرار نفس الكود بكل صفحة
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.currentTarget
    target.onerror = null
    target.src = PLACEHOLDER_IMAGE
}