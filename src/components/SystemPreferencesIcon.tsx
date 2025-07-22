import {hanzoNative} from 'lib/HanzoNative'
import React from 'react'
import {ViewStyle} from 'react-native-web'
import {FileIcon} from './FileIcon'

export const SystemPreferencesIcon = ({style}: {style?: ViewStyle} = {}) => {
  return (
    <FileIcon
      style={style}
      className="w-6 h-6"
      url={
        hanzoNative.OSVersion >= 13
          ? '/System/Applications/System Settings.app'
          : '/System/Applications/System Preferences.app'
      }
    />
  )
}
