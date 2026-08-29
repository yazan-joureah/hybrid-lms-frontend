// src/hooks/cert/useMyCertificates.ts
import { useState, useEffect, useCallback } from 'react'
import { certService, type MyCertificateItem } from '../../services/certService'

/**
 * Extract certificate array from API response robustly.
 * Supports:
 *   - Direct array: [ ... ]
 *   - Nested object: { data: { certificates: [ ... ] } }
 *   - Any other shape falls back to [].
 */
function extractCertificates(response: unknown): MyCertificateItem[] {
    if (Array.isArray(response)) {
        return response
    }

    if (response && typeof response === 'object') {
        const obj = response as Record<string, unknown>
        // Check for response.data.certificates
        if (obj.data && typeof obj.data === 'object') {
            const dataObj = obj.data as Record<string, unknown>
            if (Array.isArray(dataObj.certificates)) {
                return dataObj.certificates
            }
        }
        // Check for response.certificates directly (if any)
        if (Array.isArray(obj.certificates)) {
            return obj.certificates
        }
    }

    return []
}

export function useMyCertificates() {
    const [certificates, setCertificates] = useState<MyCertificateItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchCertificates = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const response = await certService.getMyCertificates()
            const certs = extractCertificates(response)
            setCertificates(certs)
        } catch {
            setError('تعذّر تحميل الشهادات، حاول مرة أخرى')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCertificates()
    }, [fetchCertificates])

    // Active certificates only – revoked ones are replaced by active ones
    const activeCertificates = certificates.filter(c => c.status === 'active')

    return {
        certificates,
        activeCertificates,
        loading,
        error,
        refetch: fetchCertificates,
    }
}