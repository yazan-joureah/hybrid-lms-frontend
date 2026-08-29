// src/components/common/Loading.tsx
interface SkeletonLoaderProps {
    type?: 'card' | 'row'
    count?: number
    columns?: number
}

export function SkeletonLoader({ type = 'card', count = 3, columns = 3 }: SkeletonLoaderProps) {
    const items = Array.from({ length: count })

    return (
        <>
            <style>{`
        .skeleton-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          animation: skeleton-sweep 1.4s infinite;
        }
        @keyframes skeleton-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

            {type === 'row' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((_, i) => (
                        <div key={i} style={{ height: 64, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                            <div className="skeleton-shimmer" />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns},1fr)`, gap: 22 }}>
                    {items.map((_, i) => (
                        <div key={i} style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div style={{ height: 168, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                                <div className="skeleton-shimmer" />
                            </div>
                            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ height: 14, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
                                <div style={{ height: 12, width: '55%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                                <div style={{ height: 34, width: '100%', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', marginTop: 6 }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}