// interface EdujarLogoProps {
//   width?: number
//   height?: number
//   iconOnly?: boolean
// }

// export default function EdujarLogo({ width = 140, height = 38, iconOnly = false }: EdujarLogoProps) {
//   const uid = 'elg'
//   if (iconOnly) {
//     return (
//       <svg width="38" height="38" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
//         <defs>
//           <linearGradient id={`${uid}-i`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
//             <stop offset="0%" stopColor="#7c3aed" />
//             <stop offset="100%" stopColor="#a78bfa" />
//           </linearGradient>
//         </defs>
//         <rect x="0" y="0" width="48" height="48" rx="10" fill={`url(#${uid}-i)`} />
//         <svg x="12" y="12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
//           <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
//           <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
//         </svg>
//       </svg>
//     )
//   }
//   return (
//     <svg width={width} height={height} viewBox="0 0 180 48" xmlns="http://www.w3.org/2000/svg">
//       <defs>
//         <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
//           <stop offset="0%" stopColor="#7c3aed" />
//           <stop offset="100%" stopColor="#a78bfa" />
//         </linearGradient>
//       </defs>
//       <rect x="0" y="0" width="48" height="48" rx="10" fill={`url(#${uid}-g)`} />
//       <svg x="12" y="12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
//         <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
//         <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
//       </svg>
//       <text x="62" y="31" fontFamily="Outfit, Poppins, sans-serif" fontSize="24" fontWeight="800" fill="#ffffff">
//         Edujar
//       </text>
//     </svg>
//   )
// }



// import React from 'react'

// interface EdujarLogoProps {
//   width?: number | string
//   height?: number | string
//   iconOnly?: boolean
//   className?: string
//   style?: React.CSSProperties
// }

// export default function EdujarLogo({
//   width = 140,
//   height = 38,
//   iconOnly = false,
//   className = '',
//   style,
// }: EdujarLogoProps) {
//   const uid = 'elg'

//   if (iconOnly) {
//     return (
//       <svg
//         width={width || 38}
//         height={height || 38}
//         viewBox="0 0 48 48"
//         preserveAspectRatio="xMidYMid meet"
//         className={className}
//         style={style}
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <defs>
//           <linearGradient id={`${uid}-i`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
//             <stop offset="0%" stopColor="#7c3aed" />
//             <stop offset="100%" stopColor="#a78bfa" />
//           </linearGradient>
//         </defs>
//         <rect x="0" y="0" width="48" height="48" rx="10" fill={`url(#${uid}-i)`} />
//         <svg x="12" y="12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
//           <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
//           <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
//         </svg>
//       </svg>
//     )
//   }

//   return (
//     <svg
//       width={width}
//       height={height}
//       viewBox="0 0 180 48"
//       preserveAspectRatio="xMinYMid meet"
//       className={className}
//       style={style}
//       xmlns="http://www.w3.org/2000/svg"
//     >
//       <defs>
//         <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
//           <stop offset="0%" stopColor="#7c3aed" />
//           <stop offset="100%" stopColor="#a78bfa" />
//         </linearGradient>
//       </defs>
//       {/* 1. المربع البنفسجي في البداية عند x=0 */}
//       <rect x="0" y="0" width="48" height="48" rx="12" fill={`url(#${uid}-g)`} />
      
//       {/* 2. أيقونة الكتاب داخل المربع */}
//       <svg x="12" y="12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
//         <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
//         <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
//       </svg>
      
//       {/* 3. النص أزحناه إلى x=62 ليكون بجهة اليسار بجانب المربع تماماً */}
//       <text x="62" y="33" fontFamily="Outfit, sans-serif, system-ui" fontSize="24" fontWeight="800" fill="#ffffff">
//         Edujar
//       </text>
//     </svg>
//   )
// }
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
      viewBox="0 0 180 48"
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
        Edujar
      </text>
    </svg>
  )
}