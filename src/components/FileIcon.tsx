import {cssInterop} from 'lib/nativewind-shim'
import {View, ViewStyle} from 'react-native-web'

// Web fallback for native FileIcon component
export const FileIcon = (props: {
  url: string
  style?: ViewStyle
  className?: string
}) => {
  // For web, we can use a simple view with an icon or image
  return (
    <View {...props}>
      {/* File icon placeholder */}
      <View style={{width: 24, height: 24, backgroundColor: '#ddd', borderRadius: 4}} />
    </View>
  )
}

cssInterop(FileIcon, {
  className: 'style',
})
