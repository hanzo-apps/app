import React from 'react'

interface HanzoLogoProps {
  width?: number
  height?: number
  color?: string
}

export const HanzoLogo: React.FC<HanzoLogoProps> = ({ 
  width = 64, 
  height = 64,
  color 
}) => {
  const primaryColor = color || '#FF6B6B'
  const secondaryColor = color || '#4ECDC4'
  
  return (
    <svg width={width} height={height} viewBox="0 0 512 512">
      <defs>
        <linearGradient id="hanzoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
        </linearGradient>
      </defs>
      
      <g>
        {/* Stylized H logo */}
        <path
          d="M 128 96 L 128 416 L 192 416 L 192 288 L 320 288 L 320 416 L 384 416 L 384 96 L 320 96 L 320 224 L 192 224 L 192 96 L 128 96 Z"
          fill="url(#hanzoGradient)"
          opacity="0.9"
        />
        
        {/* Subtle shadow/depth effect */}
        <path
          d="M 136 104 L 136 408 L 184 408 L 184 288 L 328 288 L 328 408 L 376 408 L 376 104 L 328 104 L 328 224 L 184 224 L 184 104 L 136 104 Z"
          fill="#000000"
          opacity="0.1"
          transform="translate(4, 4)"
        />
      </g>
    </svg>
  )
}