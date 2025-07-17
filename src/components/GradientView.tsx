import {cssInterop} from 'lib/nativewind-shim'
import {View, ViewStyle} from 'react-native-web'

type GradientProps = {
  children?: any
  onLayout?: (e: any) => void
  style?: ViewStyle
  startColor: string
  endColor: string
  angle: number
  className?: string
  cornerRadius?: number
}

// Web fallback for native gradient view
export const GradientView = (props: GradientProps) => {
  const gradientStyle = {
    ...props.style,
    background: `linear-gradient(${props.angle}deg, ${props.startColor}, ${props.endColor})`,
    borderRadius: props.cornerRadius || 0,
  }
  
  return (
    <View {...props} style={gradientStyle}>
      {props.children}
    </View>
  )
}

cssInterop(GradientView, {
  className: 'style',
})
