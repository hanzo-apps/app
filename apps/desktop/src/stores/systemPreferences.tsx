import {hanzoNative} from '../lib/HanzoNative'
import React from 'react'
import {ItemType} from './unified.store'
import {FileIcon} from 'components/FileIcon'

// Web-compatible helpers
const Linking = {
  openURL: (url: string) => {
    window.open(url, '_blank');
  }
};

type ImageSourcePropType = string | { uri: string };
// Simple plist parser stub for web compatibility
const plist = {
  parse: (content: string) => {
    // Basic XML plist parsing
    const result: any = {};
    const matches = content.matchAll(/<key>([^<]+)<\/key>\s*<string>([^<]+)<\/string>/g);
    for (const match of matches) {
      result[match[1]] = match[2];
    }
    return result;
  }
};
import {Assets, Icons} from 'assets'

const ignoreList = [
  'ClassKitPreferencePane.prefPane',
  'ClassroomSettings.prefPane',
  'DesktopScreenEffectsPref.prefPane',
  'DigiHubDiscs.prefPane',
  'EnergySaver.prefPane',
  'EnergySaverPref.prefPane',
  'Expose.prefPane',
  'PrintAndFax.prefPane',
  'Spotlight.prefPane',
  'Sound.prefPane',
  'UniversalAccessPref.prefPane',
  'TouchID.prefPane',
  'Displays.prefPane',
  'Battery.prefPane',
  'Network.prefPane',
]

const nameMappings: Record<string, string> = {
  'Accounts.prefPane': 'Users & Groups',
  'AppleIDPrefPane.prefPane': 'Apple ID',
  'DateAndTime.prefPane': 'Date & Time',
  'DesktopScreenEffectsPref.prefPane': 'Desktop & Screen Saver',
  'FamilySharingPrefPane.prefPane': 'Family',
  'PrintAndScan.prefPane': 'Printers & Scanners',
  'PrivacyAndSecurity.prefPane': 'Privacy & Security',
  'SharingPref.prefPane': 'Sharing',
  'TouchID.prefPane': 'Touch ID',
  'UniversalAccessPref.prefPane': 'Accessibility',
}

const iconMap: Record<string, ImageSourcePropType> = {
  'Bluetooth.prefPane': Icons.Bluetooth,
}

const SYSTEM_PREFERENCE_PANES = '/System/Library/PreferencePanes'
const GLOBAL_PREFERENCE_PANES = '/Library/PreferencePanes'
const USER_PREFERENCE_PANES = `/Users/${hanzoNative.userName()}/Library/PreferencePanes`

function extractObjectFromPrefPanePath(path: string, fileName: string) {
  if (ignoreList.includes(fileName)) {
    return null
  }

  let plistFileExists = hanzoNative.exists(`${path}/Contents/Info.plist`)

  if (plistFileExists) {
    let plistContent = hanzoNative.readFile(path)

    let parsed = plistContent ? plist.parse(plistContent) : null

    return {
      name: parsed?.CFBundleDisplayName ?? nameMappings[fileName],
      preferenceId: path,
      icon: iconMap[fileName],
    }
  } else {
    // We don't have a plist file, so we'll just use the filename (with mapping)
    let name = nameMappings[fileName]

    if (!name) {
      const tokens = fileName.split('/')
      name = tokens[tokens.length - 1]
        .replace('.prefPane', '')
        .split(/(?=[A-Z])/)
        .join(' ')
    }
    return {
      name,
      preferenceId: `${path}/${fileName}`,
      icon: iconMap[fileName],
    }
  }
}

const systemPanes = hanzoNative.exists(SYSTEM_PREFERENCE_PANES)
  ? hanzoNative
      .ls(SYSTEM_PREFERENCE_PANES)
      .map(pane => extractObjectFromPrefPanePath(SYSTEM_PREFERENCE_PANES, pane))
  : []

const globalPanes = hanzoNative.exists(GLOBAL_PREFERENCE_PANES)
  ? hanzoNative
      .ls(GLOBAL_PREFERENCE_PANES)
      .map(pane => extractObjectFromPrefPanePath(GLOBAL_PREFERENCE_PANES, pane))
  : []

const userPanes = hanzoNative.exists(USER_PREFERENCE_PANES)
  ? hanzoNative
      .ls(USER_PREFERENCE_PANES)
      .map(pane => extractObjectFromPrefPanePath(USER_PREFERENCE_PANES, pane))
  : []

const panes: {name: string; preferenceId: string}[] = [
  ...systemPanes,
  ...globalPanes,
  ...userPanes,
].filter(a => a) as any

export function buildSystemPreferenceItem({
  preferenceId,
  name,
  icon,
}: {
  preferenceId: string
  name?: string
  icon?: ImageSourcePropType
}): Item {
  name = name || preferenceId.split('.').pop()!

  return {
    id: preferenceId,
    name: name,
    IconComponent: (props: any[]) => {
      if (icon != null) {
        return <img src={typeof icon === 'string' ? icon : icon.uri} className="w-6 h-6" alt="" {...props} />
      } else {
        return (
          <FileIcon
            className="w-6 h-6"
            url={
              hanzoNative.OSVersion >= 13
                ? '/System/Applications/System Settings.app'
                : '/System/Applications/System Preferences.app'
            }
            {...props}
          />
        )
      }
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      if (hanzoNative.OSVersion >= 13) {
        Linking.openURL(preferenceId)
      } else {
        hanzoNative.executeAppleScript(`tell application "System Preferences"
        activate
        set current pane to pane "${preferenceId}"
       end tell
       `)
      }
    },
  }
}

const manualPanes: Item[] = [
  {
    id: 'wallpaper_settings',
    name: 'Wallpaper',
    IconComponent: (props: any[]) => {
      return <img src={Assets.wallpaper} className="w-6 h-6" alt="Wallpaper" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      hanzoNative.executeBashScript(
        'open x-apple.systempreferences:com.apple.Wallpaper-Settings.extension',
      )
    },
  },
  {
    id: 'siri_settings',
    name: 'Siri & Spotlight',
    IconComponent: (props: any[]) => {
      return <img src={Assets.siri} className="w-6 h-6" alt="Siri" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL('/System/Library/PreferencePanes/Spotlight.prefPane')
    },
  },
  {
    id: 'wifi_settings',
    name: 'Wi-Fi',
    IconComponent: (props: any[]) => {
      return <img src={Assets.wifi} className="w-6 h-6" alt="Wi-Fi" {...props} />
    },
    alias: 'wifi',
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      hanzoNative.executeBashScript(
        'open x-apple.systempreferences:com.apple.wifi-settings-extension',
      )
    },
  },
  {
    id: 'sound_settings',
    name: 'Sound',
    IconComponent: (props: any[]) => {
      return <img src={Assets.sound} className="w-6 h-6" alt="Sound" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL('/System/Library/PreferencePanes/Sound.prefPane')
    },
  },
  {
    id: 'accessibility_settings',
    name: 'Accessibility',
    IconComponent: (props: any[]) => {
      return (
        <img src={Assets.accessibility} className="w-6 h-6" alt="Accessibility" {...props} />
      )
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL(
        '/System/Library/PreferencePanes/UniversalAccessPref.prefPane',
      )
    },
  },
  {
    id: 'password_settings',
    name: 'Touch ID & Password',
    IconComponent: (props: any[]) => {
      return <img src={Assets.touch} className="w-6 h-6" alt="Touch ID" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL('/System/Library/PreferencePanes/TouchID.prefPane')
    },
  },
  {
    id: 'display_settings',
    name: 'Display',
    IconComponent: (props: any[]) => {
      return <img src={Assets.display} className="w-6 h-6" alt="Display" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL('/System/Library/PreferencePanes/Displays.prefPane')
    },
  },
  {
    id: 'battery_settings',
    name: 'Battery',
    IconComponent: (props: any[]) => {
      return <img src={Assets.battery} className="w-6 h-6" alt="Battery" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      hanzoNative.executeBashScript(
        'open x-apple.systempreferences:com.apple.preference.battery',
      )
    },
  },
  {
    id: 'network_settings',
    name: 'Network',
    IconComponent: (props: any[]) => {
      return <img src={Assets.network} className="w-6 h-6" alt="Network" {...props} />
    },
    type: ItemType.PREFERENCE_PANE,
    callback: () => {
      Linking.openURL('/System/Library/PreferencePanes/Network.prefPane')
    },
  },
]

export const systemPreferenceItems = [
  ...panes.map(buildSystemPreferenceItem),
  ...manualPanes,
]
