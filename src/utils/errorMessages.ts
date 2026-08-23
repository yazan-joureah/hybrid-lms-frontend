// src/utils/errorMessages.ts
interface ApiErrorShape {
    response?: { data?: { error?: { code?: string; message?: string } } }
    message?: string
}

const ERROR_MESSAGES: Record<string, string> = {
    KYC_NOT_VERIFIED: 'يجب إكمال التحقق من الهوية (KYC) قبل تنفيذ هذا الإجراء. الرجاء التوجه إلى صفحة الإعدادات لرفع مستنداتك.',
    COURSE_NOT_FOUND: 'الكورس الذي تبحث عنه غير موجود.',
    FORBIDDEN: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    NOT_ENROLLED: 'أنت غير مسجّل في هذا الكورس.',
    ALREADY_ENROLLED: 'أنت مسجّل بالفعل في هذا الكورس.',
    COURSE_FULL: 'وصل هذا الكورس إلى الحد الأقصى لعدد المقاعد.',
    PREREQUISITES_NOT_MET: 'يجب إكمال الكورس (الكورسات) المتطلبة أولاً.',
    REVIEW_IN_PROGRESS: 'هناك مراجعة جارية لهذا الكورس بالفعل. الرجاء انتظار قرار الإدارة.',
    INVALID_CODE: 'رمز التحقق غير صحيح. حاول مرة أخرى.',
    CODE_EXPIRED: 'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.',
    TOO_MANY_ATTEMPTS: 'محاولات فاشلة كثيرة جداً. اطلب رمزاً جديداً.',
    EMAIL_NOT_VERIFIED: 'الرجاء تفعيل بريدك الإلكتروني قبل المتابعة.',
    GUARDIAN_PENDING: 'حسابك بانتظار موافقة ولي الأمر.',
    ACCOUNT_LOCKED: 'تم قفل حسابك مؤقتاً. حاول مرة أخرى بعد دقائق أو أعد تعيين كلمة المرور.',
    ACCOUNT_SUSPENDED: 'تم تعليق حسابك. الرجاء التواصل مع الدعم.',
    VALIDATION_ERROR: 'البيانات المدخلة غير صحيحة. تحقق من الحقول وحاول مجدداً.',
}

const DEFAULT_ERROR_MESSAGE = 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.'

export function getErrorCode(err: unknown): string | undefined {
    return (err as ApiErrorShape)?.response?.data?.error?.code
}

export function getErrorMessage(err: unknown): string {
    const e = err as ApiErrorShape
    const code = e?.response?.data?.error?.code
    const backendMessage = e?.response?.data?.error?.message
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
    return backendMessage || e?.message || DEFAULT_ERROR_MESSAGE
}