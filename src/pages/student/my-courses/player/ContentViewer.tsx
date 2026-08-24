// src/pages/student/my-courses/player/ContentViewer.tsx
import type { ContentItem } from '../../../../services/courseService'

const TYPE_LABELS: Record<ContentItem['content_type'], string> = {
    video: 'فيديو', document: 'مستند', link: 'رابط', text: 'نص',
}

interface Props {
    item: ContentItem
    blobUrl: string | null
    loading: boolean
    marking: boolean
    onMarkComplete: () => void
}

export function ContentViewer({ item, blobUrl, loading, marking, onMarkComplete }: Props) {
    return (
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, minHeight: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <span className="badge badge-neutral" style={{ marginBottom: 8, display: 'inline-block' }}>{TYPE_LABELS[item.content_type]}</span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{item.title}</h3>
                    {item.desc && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>{item.desc}</p>}
                </div>
                <button
                    className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }}
                    disabled={marking || item.completed}
                    onClick={onMarkComplete}
                >
                    {item.completed ? '✓ مكتمل' : marking ? 'جارٍ الحفظ...' : 'تحديد كمكتمل'}
                </button>
            </div>

            {item.content_type === 'video' && (
                loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>جارٍ تحميل الفيديو...</div>
                ) : blobUrl ? (
                    <video controls src={blobUrl} style={{ width: '100%', maxHeight: 460, borderRadius: 12, background: '#000' }} />
                ) : null
            )}

            {item.content_type === 'document' && (
                loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>جارٍ تحميل المستند...</div>
                ) : blobUrl ? (
                    item.mime_type === 'application/pdf' ? (
                        <embed src={blobUrl} type="application/pdf" width="100%" height="500" style={{ borderRadius: 12 }} />
                    ) : (
                        <a href={blobUrl} download className="btn-outline" style={{ padding: '10px 22px', fontSize: 14 }}>
                            ⬇ تحميل الملف
                        </a>
                    )
                ) : null
            )}

            {item.content_type === 'link' && item.content_data?.url && (
                <a href={item.content_data.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                    🔗 فتح الرابط الخارجي
                </a>
            )}

            {item.content_type === 'text' && (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
                    {item.content_data?.text || 'لا يوجد نص.'}
                </div>
            )}
        </div>
    )
}