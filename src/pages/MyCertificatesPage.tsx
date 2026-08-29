import React, { useEffect, useState } from 'react';
import { certService, MyCertificateItem, DownloadCertificateData } from '../services/certService';
import { CertificateViewModal } from '../components/cert/CertificateViewModal';

export const MyCertificatesPage: React.FC = () => {
    const [certificates, setCertificates] = useState<MyCertificateItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeCertData, setActiveCertData] = useState<DownloadCertificateData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [downloadingCourseId, setDownloadingCourseId] = useState<string | null>(null);

    useEffect(() => {
        certService
            .getMyCertificates()
            .then((data) => {
                setCertificates(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    const handleOpenCertificate = async (courseId: string) => {
        setDownloadingCourseId(courseId);
        try {
            const data = await certService.downloadCertificate(courseId);
            setActiveCertData(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error('Failed to load certificate detail', err);
        } finally {
            setDownloadingCourseId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your certificates...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Issued Certificates</h1>

            {certificates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No certificates issued yet. Complete course requirements to unlock certificates.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {certificates.map((cert) => (
                        <div
                            key={cert.certificate_id}
                            className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
                        >
                            <div>
                                <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 mb-2">
                                    Active Credential
                                </span>
                                <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                                    {cert.course_title_snapshot}
                                </h3>
                                <p className="mt-2 text-xs text-gray-500">
                                    Issued to: <span className="font-medium text-gray-700">{cert.student_name_snapshot}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    Date: {new Date(cert.issued_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t">
                                <button
                                    disabled={downloadingCourseId === cert.course_id}
                                    onClick={() => handleOpenCertificate(cert.course_id)}
                                    className="w-full rounded-lg bg-indigo-50 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition flex justify-center items-center"
                                >
                                    {downloadingCourseId === cert.course_id ? (
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
                                    ) : (
                                        'View Certificate'
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal view displaying printable certificate & Open Badge export */}
            <CertificateViewModal
                isOpen={isModalOpen}
                data={activeCertData}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};