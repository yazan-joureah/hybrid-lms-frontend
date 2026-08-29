// src/components/common/EmptyState.tsx
interface Props {
    icon: string
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
    return (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: description ? 6 : 0 }}>{title}</div>
            {description && <div style={{ fontSize: 13, marginBottom: action ? 16 : 0 }}>{description}</div>}
            {action && (
                <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 13.5 }} onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    )
}