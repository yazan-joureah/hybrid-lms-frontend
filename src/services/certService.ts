// src/services/certService.ts
import axios from 'axios'
import api, { BASE_URL } from '../config/api'

export type VerifyStatus = 'valid' | 'revoked' | 'not_found';

export interface VerifiedCertificateDetail {
    certificate_id: string;
    student_name: string;
    course_title: string;
    issued_at: string;
    superseded_by?: string | null;
}

export interface VerifyCertificateResponse {
    status: VerifyStatus;
    certificate?: VerifiedCertificateDetail;
    credential_jwt?: string;
}

export interface MyCertificateItem {
    certificate_id: string;
    course_id: string;
    course_title_snapshot: string;
    student_name_snapshot: string;
    issued_at: string;
    status: 'active' | 'revoked';
    superseded_by?: string | null;
}

export interface DownloadCertificateData {
    certificate_id: string;
    student_name: string;
    course_title: string;
    issued_at: string;
    qr_code_image_base64: string;
    credential_jwt?: string;
}

export const certService = {
    /**
     * Public endpoint — NO cookies sent. This page is opened by anonymous
     * third parties scanning a QR code; it must never require or send
     * credentials, both for correctness (this exact CORS bug) and for
     * security (least privilege — no reason to expose session cookies to
     * a purely public, unauthenticated verification call).
     */
    async verifyCertificate(certificateId: string): Promise<VerifyCertificateResponse> {
        const response = await axios.get<{ success: boolean; data: VerifyCertificateResponse }>(
            `${BASE_URL}/certificates/verify/${certificateId}`,
            { withCredentials: false }
        )
        return response.data.data
    },

    /**
     * Authenticated endpoint to retrieve all active/issued certificates for the student.
     */
    async getMyCertificates(): Promise<MyCertificateItem[]> {
        const response = await api.get<{ success: boolean; data: MyCertificateItem[] }>(
            `/certificates/my-certificates`
        )
        return response.data.data
    },

    /**
     * Authenticated endpoint to fetch printable data, QR image, and VC-JWT for a specific course.
     */
    async downloadCertificate(courseId: string): Promise<DownloadCertificateData> {
        const response = await api.get<{ success: boolean; data: DownloadCertificateData }>(
            `/certificates/download/${courseId}`
        )
        return response.data.data
    },

    /**
     * Downloads the raw VC-JWT as a standard Open Badges 3.0 / W3C Verifiable Credential file (.json).
     */
    downloadBadgeJwtFile(filename: string, jwtToken: string): void {
        const blob = new Blob([jwtToken], { type: 'application/vc+jwt' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }
}