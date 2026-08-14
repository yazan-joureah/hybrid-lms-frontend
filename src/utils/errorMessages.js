// src/utils/errorMessages.js
export function getErrorMessage(err) {
    if (err?.response?.data?.error?.message) {
        return err.response.data.error.message;
    }
    if (err?.response?.data?.message) {
        return err.response.data.message;
    }
    if (err?.message) {
        return err.message;
    }
    return 'حدث خطأ غير متوقع. حاول مرة ثانية.';
}
