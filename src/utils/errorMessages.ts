// src/utils/errorMessages.ts
import { AxiosError } from 'axios';

/**
 * Extracts a user-friendly (Arabic) error message from an API error.
 * Falls back to a generic message if the server didn't send one.
 */
export function getErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'isAxiosError' in err) {
        const axiosErr = err as AxiosError<{ error?: { message?: string }; message?: string }>;
        const serverMessage = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message;
        if (serverMessage) return serverMessage;
        if (axiosErr.code === 'ERR_NETWORK') return 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
        if (axiosErr.response?.status === 404) return 'العنصر المطلوب غير موجود.';
        if (axiosErr.response?.status === 403) return 'ليس لديك صلاحية للقيام بهذا الإجراء.';
        if (axiosErr.response?.status === 500) return 'حدث خطأ في الخادم. حاول لاحقاً.';
    }
    if (err instanceof Error && err.message) return err.message;
    return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
