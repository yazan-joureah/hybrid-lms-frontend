
interface EdujarLogoProps {
  width?: number | string
  height?: number | string
  iconOnly?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function EdujarLogo({
  width = 140,
  height = 38,
  iconOnly = false,
  className = '',
  style,
}: EdujarLogoProps) {
  const uid = 'elg'

  if (iconOnly) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 48 48"
        className={className}
        style={{ direction: 'ltr', ...style }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-i`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="48" height="48" rx="12" fill={`url(#${uid}-i)`} />

        {/* أيقونة الكتاب */}
        <g transform="translate(12, 12)" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </g>
      </svg>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 230 48"
      className={className}
      style={{ direction: 'ltr', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="48" height="48" rx="12" fill={`url(#${uid}-g)`} />

      {/* أيقونة الكتاب */}
      <g transform="translate(12, 12)" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </g>

      <text x="62" y="33" fontFamily="Outfit, sans-serif" fontSize="24" fontWeight="800" fill="#fff">
        Hybrid LMS
      </text>
    </svg>
  )
}