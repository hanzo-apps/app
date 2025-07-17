import { View, ViewStyle } from 'react-native-web'
import { cssInterop } from 'lib/nativewind-shim'
import { FC } from 'react'

type BlurViewProps = {
  children?: any
  onLayout?: (e: any) => void
  style?: ViewStyle
  borderRadius?: number
  disabled?: boolean
  materialName?:
    | 'windowBackground'
    | 'menu'
    | 'sidebar'
    | 'header'
    | 'sheet'
    | 'popover'
    | 'hudWindow'
    | 'fullScreenUI'
  className?: string
}

// Web fallback for native blur view
export const BlurViewNative = View

export const BlurView: FC<BlurViewProps> = props => {
  const blurStyle = {
    ...props.style,
    // @ts-ignore
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
  
  return (
    <View
      {...props}
      style={blurStyle}
    />
  )
}

cssInterop(BlurView, {
  className: 'style',
  nativeStyleToProp: {
    // @ts-expect-error
    borderRadius: 'borderRadius',
  },
})
