import React from 'react'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'

interface EnsoLogoProps {
  width?: number
  height?: number
  color?: string
}

export const EnsoLogo: React.FC<EnsoLogoProps> = ({ 
  width = 64, 
  height = 64,
  color 
}) => {
  const strokeColor = color || '#1a1a1a'
  
  return (
    <Svg width={width} height={height} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="ensoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>
      
      <Path
        d="M 256 96 C 336 96, 400 160, 400 240 C 400 320, 336 384, 256 384 C 176 384, 112 320, 112 240 C 112 180, 150 128, 205 108"
        fill="none"
        stroke="url(#ensoGradient)"
        strokeWidth="32"
        strokeLinecap="round"
        opacity="0.9"
        transform="rotate(-45 256 256)"
      />
      
      <Path
        d="M 256 96 C 336 96, 400 160, 400 240 C 400 320, 336 384, 256 384 C 176 384, 112 320, 112 240 C 112 180, 150 128, 205 108"
        fill="none"
        stroke="url(#ensoGradient)"
        strokeWidth="28"
        strokeLinecap="round"
        opacity="0.3"
        transform="rotate(-45 256 256) translate(2, -1)"
        strokeDasharray="0,2,0,3,0,1"
      />
    </Svg>
  )
}