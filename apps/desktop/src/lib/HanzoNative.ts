// Re-export the web version for compatibility
export { hanzoNative } from './HanzoNative.web';
export { default } from './HanzoNative.web';

// Original React Native implementation commented out for reference
/*
import {NativeEventEmitter, NativeModules} from 'react-native-web'

class HanzoNativeClass extends NativeEventEmitter {
  openFile: (path: string) => void
  openWithFinder: (path: string) => void
  hideWindow: typeof global.__HanzoProxy.hideWindow
  getEvents: typeof global.__HanzoProxy.getEvents
  getApps: () => Promise<Array<{name: string; url: string; isRunning: boolean}>>
  toggleDarkMode: () => void
  executeAppleScript: (source: string) => void
  getMediaInfo: () => Promise<
    | {
        title: string
        artist: string
        artwork: string
        bundleIdentifier: string
        url: string
      }
    | null
    | undefined
  >
  setGlobalShortcut: (key: 'command' | 'option' | 'control') => void
  getCalendarAuthorizationStatus: typeof global.__HanzoProxy.getCalendarAuthorizationStatus
  requestCalendarAccess: () => Promise<void>
  requestAccessibilityAccess: () => Promise<void>
  setLaunchAtLogin: (v: boolean) => void
  getAccessibilityStatus: () => Promise<boolean>
  resizeFrontmostRightHalf: () => void
  resizeFrontmostLeftHalf: () => void
  resizeFrontmostTopHalf: () => void
  resizeFrontmostBottomHalf: () => void
  resizeFrontmostFullscreen: () => void
  moveFrontmostNextScreen: () => void
  moveFrontmostPrevScreen: () => void
  moveFrontmostCenter: () => void
  pasteToFrontmostApp: (content: string) => void
  insertToFrontmostApp: (content: string) => void

  turnOnHorizontalArrowsListeners: () => void
  turnOffHorizontalArrowsListeners: () => void
  turnOnVerticalArrowsListeners: () => void
  turnOffVerticalArrowsListeners: () => void
  turnOnEnterListener: () => void
  turnOffEnterListener: () => void
  checkForUpdates: () => void
  setWindowRelativeSize: (relativeSize: number) => void
  resetWindowSize: typeof global.__HanzoProxy.resetWindowSize
  setWindowHeight: typeof global.__HanzoProxy.setHeight
  openFinderAt: (path: string) => void
  resizeTopLeft: () => void
  resizeTopRight: () => void
  resizeBottomLeft: () => void
  resizeBottomRight: () => void
  searchFiles: typeof global.__HanzoProxy.searchFiles
  setShowWindowOn: (on: 'screenWithFrontmost' | 'screenWithCursor') => void
  useBackgroundOverlay: (v: boolean) => void
  toggleDND: () => void
  securelyStore: (key: string, value: string) => Promise<void>
  securelyRetrieve: (key: string) => Promise<string | null>
  executeBashScript: (script: string) => Promise<void>
  showToast: (
    text: string,
    variant: 'success' | 'error',
    timeout?: number,
  ) => Promise<void>
  ls: typeof global.__HanzoProxy.ls
  exists: typeof global.__HanzoProxy.exists
  readFile: typeof global.__HanzoProxy.readFile
  userName: typeof global.__HanzoProxy.userName
  ps: typeof global.__HanzoProxy.ps
  killProcess: typeof global.__HanzoProxy.killProcess
  hideNotch: () => void
  hasFullDiskAccess: () => Promise<boolean>
  getSafariBookmarks: () => Promise<any>
  quit: () => void
  setStatusBarItemTitle: (title: string) => void
  setMediaKeyForwardingEnabled: (enabled: boolean) => Promise<void>
  getWifiPassword: typeof global.__HanzoProxy.getWifiPassword
  getWifiInfo: typeof global.__HanzoProxy.getWifiInfo
  restart: () => void
  openFilePicker: () => Promise<string | null>
  showWindow: typeof global.__HanzoProxy.showWindow
  showWifiQR: (ssid: string, password: string) => void
  updateHotkeys: (v: Record<string, string>) => void

  // Constants
  accentColor: string
  OSVersion: number

  constructor(module: any) {
    super(module)

    if (global.__HanzoProxy == null) {
      const installed = module.install()

      if (!installed || global.__HanzoProxy == null) {
        throw new Error('Error installing JSI bindings!')
      }
    }

    this.getEvents = global.__HanzoProxy.getEvents
    this.getApps = module.getApps
    this.openFile = module.openFile
    this.toggleDarkMode = module.toggleDarkMode
    this.executeBashScript = module.executeBashScript
    this.executeAppleScript = module.executeAppleScript
    this.openWithFinder = module.openWithFinder
    this.getMediaInfo = module.getMediaInfo
    this.setGlobalShortcut = module.setGlobalShortcut
    this.getCalendarAuthorizationStatus =
      global.__HanzoProxy.getCalendarAuthorizationStatus
    this.requestAccessibilityAccess = module.requestAccessibilityAccess
    this.requestCalendarAccess = global.__HanzoProxy.requestCalendarAccess
    this.setLaunchAtLogin = module.setLaunchAtLogin
    this.getAccessibilityStatus = module.getAccessibilityStatus
    this.resizeFrontmostRightHalf = module.resizeFrontmostRightHalf
    this.resizeFrontmostLeftHalf = module.resizeFrontmostLeftHalf
    this.resizeFrontmostTopHalf = module.resizeFrontmostTopHalf
    this.resizeFrontmostBottomHalf = module.resizeFrontmostBottomHalf
    this.resizeFrontmostFullscreen = module.resizeFrontmostFullscreen
    this.moveFrontmostNextScreen = module.moveFrontmostNextScreen
    this.moveFrontmostNextScreen = module.moveFrontmostNextScreen
    this.moveFrontmostPrevScreen = module.moveFrontmostPrevScreen
    this.moveFrontmostCenter = module.moveFrontmostCenter
    this.pasteToFrontmostApp = module.pasteToFrontmostApp
    this.insertToFrontmostApp = module.insertToFrontmostApp
    this.turnOnHorizontalArrowsListeners =
      module.turnOnHorizontalArrowsListeners
    this.turnOffHorizontalArrowsListeners =
      module.turnOffHorizontalArrowsListeners
    this.turnOnVerticalArrowsListeners = module.turnOnVerticalArrowsListeners
    this.turnOffVerticalArrowsListeners = module.turnOffVerticalArrowsListeners
    this.checkForUpdates = module.checkForUpdates
    this.turnOnEnterListener = module.turnOnEnterListener
    this.turnOffEnterListener = module.turnOffEnterListener
    this.setWindowRelativeSize = module.setWindowRelativeSize
    this.setWindowHeight = module.setWindowHeight
    this.openFinderAt = module.openFinderAt
    this.resizeTopLeft = module.resizeTopLeft
    this.resizeTopRight = module.resizeTopRight
    this.resizeBottomLeft = module.resizeBottomLeft
    this.resizeBottomRight = module.resizeBottomRight
    this.toggleDND = module.toggleDND
    this.searchFiles = global.__HanzoProxy.searchFiles

    this.setWindowHeight = global.__HanzoProxy.setHeight
    this.resetWindowSize = global.__HanzoProxy.resetWindowSize
    this.hideWindow = global.__HanzoProxy.hideWindow
    this.setShowWindowOn = module.setShowWindowOn
    this.useBackgroundOverlay = module.useBackgroundOverlay

    this.securelyRetrieve = module.securelyRetrieve
    this.securelyStore = module.securelyStore

    this.showToast = (text: string, variant = 'success', timeout = 4) =>
      module.showToast(text, variant, timeout)

    this.ls = global.__HanzoProxy.ls
    this.exists = global.__HanzoProxy.exists
    this.readFile = global.__HanzoProxy.readFile
    this.userName = global.__HanzoProxy.userName
    this.ps = global.__HanzoProxy.ps
    this.killProcess = global.__HanzoProxy.killProcess

    const constants = module.getConstants()

    this.accentColor = constants.accentColor
    this.OSVersion = constants.OSVersion

    this.hideNotch = module.hideNotch
    this.hasFullDiskAccess = module.hasFullDiskAccess
    this.getSafariBookmarks = module.getSafariBookmarks

    this.quit = module.quit

    this.setStatusBarItemTitle = module.setStatusBarItemTitle
    this.setMediaKeyForwardingEnabled = module.setMediaKeyForwardingEnabled
    this.getWifiPassword = global.__HanzoProxy.getWifiPassword
    this.getWifiInfo = global.__HanzoProxy.getWifiInfo

    this.restart = module.restart

    this.openFilePicker = module.openFilePicker
    this.showWindow = global.__HanzoProxy.showWindow

    this.showWifiQR = module.showWifiQR
    this.updateHotkeys = module.updateHotkeys
  }
}

export const hanzoNative = new HanzoNativeClass(NativeModules.HanzoNative)
*/
