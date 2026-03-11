import { AsyncStorage } from './storage'
import {Assets} from '../assets'
import {FileIcon} from '../components/FileIcon'
import {Parser} from 'expr-eval'
import {hanzoNative} from '../lib/HanzoNative'
import {CONSTANTS} from '../lib/constants'
import {googleTranslate} from '../lib/translator'
import {autorun, makeAutoObservable, runInAction, toJS} from 'mobx'
// Pure React - no React Native dependencies

// Type definitions for web compatibility
type EmitterSubscription = {
  remove: () => void;
}
type NativeEventSubscription = {
  remove: () => void;
}

// Import global types
type CalendarAuthorizationStatus = globalThis.CalendarAuthorizationStatus;
type OnboardingStep = globalThis.OnboardingStep;
type FileDescription = globalThis.FileDescription;
type INativeEvent = globalThis.INativeEvent;
type Item = globalThis.Item;
import {IRootStore} from '../store'

// Pure React utilities
const openUrl = (url: string) => {
  if (url.startsWith('/')) {
    // For system paths, use Tauri's open command
    hanzoNative.openFile(url);
  } else {
    // For URLs, use standard browser API
    window.open(url, '_blank');
  }
};

const getColorScheme = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
import {createBaseItems} from './items'
// Simple plist parser stub for web compatibility
const plist = {
  parse: (content: string) => {
    // Basic XML plist parsing - just extract CFBundleIdentifier
    const match = content.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
    return { CFBundleIdentifier: match ? match[1] : null };
  }
};
import MiniSearch from 'minisearch'
// Sentry not needed for Tauri app
import {storage} from './storage'
import {defaultShortcuts, validShortcutTokensRegex} from '../lib/shortcuts'

const exprParser = new Parser()

let onShowListener: EmitterSubscription | undefined
let onHideListener: EmitterSubscription | undefined
let onFileSearchListener: EmitterSubscription | undefined
let onHotkeyListener: EmitterSubscription | undefined
let mediaQueryListener: MediaQueryList | undefined
let handleColorSchemeChange: (() => void) | undefined

export enum Widget {
  ONBOARDING = 'ONBOARDING',
  SEARCH = 'SEARCH',
  CALENDAR = 'CALENDAR',
  TRANSLATION = 'TRANSLATION',
  SETTINGS = 'SETTINGS',
  CREATE_ITEM = 'CREATE_ITEM',
  GOOGLE_MAP = 'GOOGLE_MAP',
  SCRATCHPAD = 'SCRATCHPAD',
  EMOJIS = 'EMOJIS',
  CLIPBOARD = 'CLIPBOARD',
  PROCESSES = 'PROCESSES',
  FILE_SEARCH = 'FILE_SEARCH',
  AI = 'AI',
}

export enum ItemType {
  FILE = 'FILE',
  APPLICATION = 'APPLICATION',
  CONFIGURATION = 'CONFIGURATION',
  CUSTOM = 'CUSTOM',
  TEMPORARY_RESULT = 'TEMPORARY_RESULT',
  BOOKMARK = 'BOOKMARK',
  PREFERENCE_PANE = 'PREFERENCE_PANE',
}

// ScratchPadColor is imported from unified.store

let stopWords = new Set([
  'and',
  'or',
  'to',
  'in',
  'a',
  'the',
  'google',
  'is',
  'of',
  'for',
  'on',
  'with',
  'how',
  'when',
  'where',
  'why',
  'who',
  'which',
  'at',
  'from',
  'by',
  'that',
  'this',
  'my',
  'your',
  'do',
])

let minisearch = new MiniSearch({
  fields: ['name', 'alias'],
  storeFields: [
    'name',
    'icon',
    'iconName',
    'iconImage',
    'IconComponent',
    'color',
    'url',
    'preventClose',
    'type',
    'alias',
    'subName',
    'callback',
    'metaCallback',
    'isApplescript',
    'text',
    'shortcut',
    'isFavorite',
    'isRunning',
  ],
  searchOptions: {
    prefix: true,
    fuzzy: true,
  },
  processTerm: (term, _fieldName) =>
    stopWords.has(term) ? null : term.toLowerCase(),
})

const userName = hanzoNative.userName()
let defaultSearchFolders = [
  `/Users/${userName}/Downloads`,
  `/Users/${userName}/Documents`,
  `/Users/${userName}/Desktop`,
  `/Users/${userName}/Pictures`,
  `/Users/${userName}/Movies`,
  `/Users/${userName}/Music`,
]

export type UIStore = ReturnType<typeof createUIStore>

// Import and export the ScratchPadColor enum for backward compatibility
import { ScratchPadColor } from './unified.store'
export { ScratchPadColor }
type SearchEngine = 'google' | 'bing' | 'duckduckgo' | 'perplexity' | 'custom'

const itemsThatShouldShowWindow = [
  'emoji_picker',
  'clipboard_manager',
  'process_manager',
  'scratchpad',
]

export const createUIStore = (root: IRootStore) => {
  let persist = async () => {
    let plainState = toJS(store)
    try {
      storage.set('@ui.store', JSON.stringify(plainState))
    } catch (e) {
      console.error('UI store error:', e)
    }
  }

  let hydrate = async () => {
    let storeState: string | null | undefined
    try {
      storeState = storage.getString('@ui.store')
    } catch {
      // intentionally left blank
    }
    if (!storeState) {
      storeState = await AsyncStorage.getItem('@ui.store')
    }

    if (storeState) {
      let parsedStore = JSON.parse(storeState)

      runInAction(() => {
        store.frequencies = parsedStore.frequencies
        store.onboardingStep = parsedStore.onboardingStep
        store.firstTranslationLanguage =
          parsedStore.firstTranslationLanguage ?? 'en'
        store.secondTranslationLanguage =
          parsedStore.secondTranslationLanguage ?? 'de'
        store.thirdTranslationLanguage =
          parsedStore.thirdTranslationLanguage ?? null
        store.customItems = parsedStore.customItems ?? []
        if (
          store.onboardingStep !== 'v1_completed' &&
          store.onboardingStep !== 'v1_skipped'
        ) {
          store.focusedWidget = Widget.ONBOARDING
        }
        store.note = parsedStore.note ?? ''
        // temporary code to prevent loss of data
        if (parsedStore.notes) {
          store.note = parsedStore.notes.reduce((acc: string, n: string) => {
            return acc + '\n' + n
          }, '')
        }
        store.globalShortcut = parsedStore.globalShortcut
        store.showWindowOn = parsedStore.showWindowOn ?? 'screenWithFrontmost'
        store.calendarEnabled = parsedStore.calendarEnabled ?? true
        store.showAllDayEvents = parsedStore.showAllDayEvents ?? true
        store.launchAtLogin = parsedStore.launchAtLogin ?? true
        store.useBackgroundOverlay = parsedStore.useBackgroundOverlay ?? true
        store.mediaKeyForwardingEnabled =
          parsedStore.mediaKeyForwardingEnabled ?? true
        store.reduceTransparency = parsedStore.reduceTransparency ?? false
        store.history = parsedStore.history ?? []
        store.showUpcomingEvent = parsedStore.showUpcomingEvent ?? true
        store.scratchPadColor =
          parsedStore.scratchPadColor ?? ScratchPadColor.SYSTEM
        store.searchFolders = parsedStore.searchFolders ?? defaultSearchFolders
        store.searchEngine = parsedStore.searchEngine ?? 'google'
        store.customSearchUrl = parsedStore.customSearchUrl ?? 'https://google.com/search?q=%s'
        store.shortcuts = parsedStore.shortcuts ?? defaultShortcuts
      })

      hanzoNative.setLaunchAtLogin(parsedStore.launchAtLogin ?? true)
      hanzoNative.setGlobalShortcut(parsedStore.globalShortcut)
      hanzoNative.setShowWindowOn(
        parsedStore.showWindowOn ?? 'screenWithFrontmost',
      )
      hanzoNative.useBackgroundOverlay(store.useBackgroundOverlay)
      hanzoNative.setMediaKeyForwardingEnabled(store.mediaKeyForwardingEnabled)
      hanzoNative.updateHotkeys(toJS(store.shortcuts))
      store.getApps()
      store.migrateCustomItems()
    } else {
      runInAction(() => {
        store.focusedWidget = Widget.ONBOARDING
      })
    }
  }

  let baseItems = createBaseItems(root)

  let store = makeAutoObservable({
    //    ____  _                              _     _
    //   / __ \| |                            | |   | |
    //  | |  | | |__  ___  ___ _ ____   ____ _| |__ | | ___  ___
    //  | |  | | '_ \/ __|/ _ \ '__\ \ / / _` | '_ \| |/ _ \/ __|
    //  | |__| | |_) \__ \  __/ |   \ V / (_| | |_) | |  __/\__ \
    //   \____/|_.__/|___/\___|_|    \_/ \__,_|_.__/|_|\___||___/
    note: '',
    isAccessibilityTrusted: false,
    calendarAuthorizationStatus: null as CalendarAuthorizationStatus | null,
    onboardingStep: 'v1_start' as OnboardingStep,
    searchEngine: 'google' as SearchEngine,
    customSearchUrl: 'https://google.com/search?q=%s' as string,
    globalShortcut: 'command' as 'command' | 'option' | 'control',
    scratchpadShortcut: 'command' as 'command' | 'option' | 'none',
    clipboardManagerShortcut: 'shift' as 'shift' | 'option' | 'none',
    showWindowOn: 'screenWithFrontmost' as
      | 'screenWithFrontmost'
      | 'screenWithCursor',
    query: '',
    selectedIndex: 0,
    focusedWidget: Widget.SEARCH,
    events: [] as INativeEvent[],
    customItems: [] as Item[],
    apps: [] as Item[],
    isLoading: false,
    translationResults: [] as string[],
    frequencies: {} as Record<string, number>,
    temporaryResult: null as string | null,
    firstTranslationLanguage: 'en' as string,
    secondTranslationLanguage: 'de' as string,
    thirdTranslationLanguage: null as null | string,
    fileResults: [] as FileDescription[],
    calendarEnabled: true,
    showAllDayEvents: true,
    launchAtLogin: true,
    useBackgroundOverlay: true,
    hasFullDiskAccess: false,
    safariBookmarks: [] as {title: string; url: string}[],
    braveBookmarks: [] as {title: string; url: string}[],
    chromeBookmarks: [] as {title: string; url: string}[],
    mediaKeyForwardingEnabled: true,
    targetHeight: 64,
    isDarkMode: getColorScheme() === 'dark',
    reduceTransparency: false,
    history: [] as string[],
    historyPointer: 0,
    showUpcomingEvent: true,
    scratchPadColor: ScratchPadColor.SYSTEM,
    searchFolders: [] as string[],
    shortcuts: defaultShortcuts as Record<string, string>,
    //    _____                            _           _
    //   / ____|                          | |         | |
    //  | |     ___  _ __ ___  _ __  _   _| |_ ___  __| |
    //  | |    / _ \| '_ ` _ \| '_ \| | | | __/ _ \/ _` |
    //  | |___| (_) | | | | | | |_) | |_| | ||  __/ (_| |
    //   \_____\___/|_| |_| |_| .__/ \__,_|\__\___|\__,_|
    //                        | |
    //                        |_|
    get files(): Item[] {
      if (!!store.query && store.focusedWidget === Widget.FILE_SEARCH) {
        runInAction(() => {
          store.isLoading = true
        })
        const fileResults = hanzoNative.searchFiles(
          toJS(store.searchFolders),
          store.query,
        )

        const results = fileResults.map(f => ({
          id: f.path,
          type: ItemType.FILE,
          name: f.name,
          url: f.path,
        }))
        runInAction(() => {
          store.isLoading = false
        })
        return results
      } else {
        return []
      }
    },
    get items(): Item[] {
      let allItems = [
        ...store.apps,
        ...baseItems.map(i => {
          if (i.name === 'Clipboard Manager') {
            return {
              ...i,
              shortcut:
                store.clipboardManagerShortcut === 'option'
                  ? '⌘ + ⌥ + V'
                  : '⌘ + ⇧ + V',
            }
          }

          return i
        }),
        ...store.customItems,
        ...store.safariBookmarks.map((bookmark, idx): Item => {
          return {
            id: `${bookmark.title}_safari_${idx}`,
            name: bookmark.title,
            type: ItemType.BOOKMARK,
            iconImage: Assets.Safari,
            callback: () => {
              openUrl(bookmark.url)
            },
          }
        }),
        ...store.braveBookmarks.map((bookmark, idx): Item => {
          return {
            id: `${bookmark.title}_brave_${idx}`,
            name: bookmark.title,
            type: ItemType.BOOKMARK,
            iconImage: Assets.Brave,
            callback: () => {
              openUrl(bookmark.url)
            },
          }
        }),
        ...store.chromeBookmarks.map((bookmark, idx): Item => {
          return {
            id: `${bookmark.title}_chrome_${idx}`,
            name: bookmark.title,
            type: ItemType.BOOKMARK,
            iconImage: Assets.Chrome,
            callback: async () => {
              if (!bookmark.url) {
                hanzoNative.showToast('Cannot open bookmark without url', 'error')
              }

              try {
                openUrl(bookmark.url)
              } catch (e) {
                hanzoNative.showToast(`Could not open url: ${e}`, 'error')
              }
            },
          }
        }),
      ]

      if (!store.query) {
        return allItems
      } else {
        if (minisearch.documentCount === 0) {
          for (let item of allItems) {
            if (!item.id) {
              console.warn('Item without id:', item);
            }
          }
          minisearch.addAll(allItems)
        } else {
          // Add new items to search index
          for (let item of allItems) {
            if (!!item.id && !minisearch.has(item.id)) {
              minisearch.add(item)
            }
          }
        }
      }

      let results: Item[] = minisearch.search(store.query) as any

      results = results.sort((a, b) => {
        const freqA = store.frequencies[a.name] ?? 0
        const freqB = store.frequencies[b.name] ?? 0
        return freqB - freqA
      })

      const temporaryResultItems = !!store.temporaryResult
        ? [{id: 'temporary', type: ItemType.TEMPORARY_RESULT, name: ''}]
        : []

      const finalResults: Item[] = [
        ...(CONSTANTS.LESS_VALID_URL.test(store.query)
          ? [
              {
                id: 'open_url',
                type: ItemType.CONFIGURATION,
                name: 'Open Url',
                icon: '🌎',
                callback: () => {
                  if (store.query.startsWith('https://')) {
                    openUrl(store.query)
                  } else {
                    openUrl(`https://${store.query}`)
                  }
                },
              },
            ]
          : []),
        ...temporaryResultItems,
        ...results,
        ...store.fileResults.map(f => ({
          id: f.path,
          name: f.filename,
          subName:
            f.path.length > 60
              ? `...${f.path.substring(f.path.length - 60, f.path.length)}`
              : f.path,
          type: ItemType.CONFIGURATION,
          IconComponent: (...props: any[]) => (
            <FileIcon path={f.path} size={16} {...props} />
          ),
          callback: () => {
            openUrl(f.path)
          },
          metaCallback: () => {
            if (f.kind !== 'Folder') {
              openUrl(f.location)
            }
          },
        })),
      ]

      return finalResults
    },
    get currentItem(): Item | undefined {
      return store.items[store.selectedIndex]
    },
    get validatedShortcuts(): Record<
      string,
      {shortcut: string; valid: boolean}
    > {
      let res: Record<string, {shortcut: string; valid: boolean}> = {}
      for (let key in store.shortcuts) {
        let shortcut = store.shortcuts[key]
        let valid = false
        if (shortcut) {
          let tokens = shortcut.split('+')
          valid = tokens.every(token => validShortcutTokensRegex.test(token))
        }
        res[key] = {shortcut, valid}
      }
      return res
    },
    //                _   _
    //      /\       | | (_)
    //     /  \   ___| |_ _  ___  _ __  ___
    //    / /\ \ / __| __| |/ _ \| '_ \/ __|
    //   / ____ \ (__| |_| | (_) | | | \__ \
    //  /_/    \_\___|\__|_|\___/|_| |_|___/
    rotateScratchPadColor: () => {
      if (store.scratchPadColor === ScratchPadColor.SYSTEM) {
        store.scratchPadColor = ScratchPadColor.BLUE
      } else if (store.scratchPadColor === ScratchPadColor.BLUE) {
        store.scratchPadColor = ScratchPadColor.ORANGE
      } else {
        store.scratchPadColor = ScratchPadColor.SYSTEM
      }
    },
    setShowUpcomingEvent: (v: boolean) => {
      store.showUpcomingEvent = v
      root.calendar.fetchEvents()
    },
    showEmojiPicker: () => {
      store.focusWidget(Widget.EMOJIS)
      store.query = ''
    },
    showSettings: () => {
      store.focusWidget(Widget.SETTINGS)
    },
    setSelectedIndex: (idx: number) => {
      store.selectedIndex = idx
    },
    setNote: (note: string) => {
      store.note = note
    },
    createCustomItem: (item: Item) => {
      store.customItems.push(item)
    },
    translateQuery: async () => {
      store.isLoading = true
      store.translationResults = []
      store.focusedWidget = Widget.TRANSLATION
      store.selectedIndex = 0

      try {
        const translations = await googleTranslate(
          store.firstTranslationLanguage,
          store.secondTranslationLanguage,
          store.thirdTranslationLanguage,
          store.query,
        )

        runInAction(() => {
          store.translationResults = translations
          store.isLoading = false
        })
      } catch (e) {
        runInAction(() => {
          store.isLoading = false
        })
      }
    },
    openKeyboardSettings: () => {
      try {
        openUrl(`/System/Library/PreferencePanes/Keyboard.prefPane`)
      } catch (e) {
        console.error(`Could not open keyboard preferences ${e}`)
      }
    },
    setFirstTranslationLanguage: (l: string) => {
      store.firstTranslationLanguage = l
    },
    setSecondTranslationLanguage: (l: string) => {
      store.secondTranslationLanguage = l
    },
    setThirdTranslationLanguage: (l: string) => {
      store.thirdTranslationLanguage = l
    },
    setOnboardingStep: (step: OnboardingStep) => {
      store.onboardingStep = step
    },
    setGlobalShortcut: (key: 'command' | 'option' | 'control') => {
      hanzoNative.setGlobalShortcut(key)
      store.globalShortcut = key
    },
    setShowWindowOn: (on: 'screenWithFrontmost' | 'screenWithCursor') => {
      hanzoNative.setShowWindowOn(on)
      store.showWindowOn = on
    },
    focusWidget: (widget: Widget) => {
      store.selectedIndex = 0
      store.focusedWidget = widget
    },
    setFocus: (widget: Widget) => {
      store.focusedWidget = widget
    },
    setQuery: (query: string) => {
      store.query = query.replace('\n', ' ')
      store.selectedIndex = 0

      if (store.focusedWidget === Widget.SEARCH) {
        try {
          const res = exprParser.evaluate(store.query)
          if (res && typeof res !== 'function') {
            store.temporaryResult = res.toString()
          } else {
            store.temporaryResult = null
          }
        } catch (e) {
          store.temporaryResult = null
        }

        if (query === 'ip') {
          let info = hanzoNative.getWifiInfo()
          if (info.ip) {
            store.temporaryResult = info.ip
          }
        }
      }
    },
    getApps: () => {
      hanzoNative
        .getApps()
        .then(apps => {
          let appsRecord: Record<string, Item> = {}

          for (let app of apps) {
            // Handle both old and new format
            const name = app.name;
            const path = app.path || app.url?.replace('file://', '');
            const url = app.url || `file://${app.path}`;
            const isRunning = app.is_running || app.isRunning || false;
            const alias = app.bundle_id || app.bundleId || app.alias;
            
            if (name === 'hanzo' || name === 'Hanzo') {
              continue
            }

            appsRecord[url] = {
              id: url,
              type: ItemType.APPLICATION as ItemType.APPLICATION,
              url: decodeURI(url.replace('file://', '')),
              name: name,
              isRunning,
              alias,
            }
          }

          runInAction(() => {
            store.apps = Object.values(appsRecord)
          })
        })
        .catch(e => {
          hanzoNative.showToast(`Could not get apps: ${e}`, 'error')
          console.error('Apps fetch error:', e)
        })
    },
    onShow: ({target}: {target?: string}) => {
      if (target === Widget.CLIPBOARD) {
        store.showClipboardManager()
        return
      }

      if (target === Widget.SCRATCHPAD) {
        store.showScratchpad()
        return
      }

      if (target === Widget.EMOJIS) {
        store.showEmojiPicker()
        return
      }

      if (target === Widget.SETTINGS) {
        store.showSettings()
        return
      }

      store.getApps()

      setImmediate(() => {
        if (!store.isAccessibilityTrusted) {
          store.getAccessibilityStatus()
        }

        store.getFullDiskAccessStatus()
      })
    },
    onHide: () => {
      store.focusedWidget = Widget.SEARCH
      store.setQuery('')
      store.selectedIndex = 0
      store.translationResults = []
      store.historyPointer = 0
    },
    cleanUp: () => {
      onShowListener?.remove()
      onHideListener?.remove()
      onFileSearchListener?.remove()
      onHotkeyListener?.remove()
      // Remove color scheme change listener
      if (mediaQueryListener && handleColorSchemeChange) {
        mediaQueryListener.removeEventListener('change', handleColorSchemeChange);
      }
    },
    getCalendarAccess: () => {
      store.calendarAuthorizationStatus =
        hanzoNative.getCalendarAuthorizationStatus()
    },
    getAccessibilityStatus: () => {
      hanzoNative.getAccessibilityStatus().then(v => {
        runInAction(() => {
          store.isAccessibilityTrusted = v
        })
      })
    },
    showScratchpad: () => {
      store.focusWidget(Widget.SCRATCHPAD)
    },
    showClipboardManager: () => {
      store.query = ''
      store.focusWidget(Widget.CLIPBOARD)
    },
    showProcessManager: () => {
      store.query = ''
      store.focusWidget(Widget.PROCESSES)
    },
    onFileSearch: (files: FileDescription[]) => {
      store.fileResults = files
    },
    setCalendarEnabled: (v: boolean) => {
      store.calendarEnabled = v
    },
    setShowAllDayEvents: (v: boolean) => {
      store.showAllDayEvents = v
    },
    setLaunchAtLogin: (v: boolean) => {
      store.launchAtLogin = v
      hanzoNative.setLaunchAtLogin(v)
    },
    setUseBackgroundOverlay: (v: boolean) => {
      store.useBackgroundOverlay = v
      hanzoNative.useBackgroundOverlay(v)
    },
    getFullDiskAccessStatus: async () => {
      const hasAccess = await hanzoNative.hasFullDiskAccess()
      runInAction(() => {
        store.hasFullDiskAccess = hasAccess
        if (hasAccess) {
          store.getSafariBookmarks()
        }
      })
      store.getBraveBookmarks()
      store.getChromeBookmarks()
    },
    getSafariBookmarks: async () => {
      if (store.hasFullDiskAccess) {
        const safariBookmarks = await hanzoNative.getSafariBookmarks()

        runInAction(() => {
          store.safariBookmarks = safariBookmarks
        })
      }
    },
    getBraveBookmarks: async () => {
      const username = hanzoNative.userName()
      const path = `/Users/${username}/Library/Application Support/BraveSoftware/Brave-Browser/Default/Bookmarks`
      const exists = hanzoNative.exists(path)
      if (exists) {
        const bookmarksString = hanzoNative.readFile(path)
        if (!bookmarksString) {
          return
        }
        const OGbookmarks = JSON.parse(bookmarksString)
        let bookmarks = OGbookmarks.roots.bookmark_bar.children.map(
          (v: any) => ({
            title: v.name,
            url: v.url,
          }),
        )

        store.braveBookmarks = bookmarks
      }
    },
    getChromeBookmarks: async () => {
      const username = hanzoNative.userName()
      const path = `/Users/${username}/Library/Application Support/Google/Chrome/Default/Bookmarks`
      const exists = hanzoNative.exists(path)
      if (exists) {
        const bookmarksString = hanzoNative.readFile(path)
        if (!bookmarksString) {
          return
        }
        const OGbookmarks = JSON.parse(bookmarksString)
        let bookmarks = OGbookmarks.roots.bookmark_bar.children.map(
          (v: any) => ({
            title: v.name,
            url: v.url,
          }),
        )

        store.chromeBookmarks = bookmarks
      }
    },

    setMediaKeyForwardingEnabled: (enabled: boolean) => {
      store.mediaKeyForwardingEnabled = enabled
      hanzoNative.setMediaKeyForwardingEnabled(enabled)
    },

    setTargetHeight: (height: number) => {
      store.targetHeight = height
    },

    onColorSchemeChange({
      colorScheme,
    }: {
      colorScheme: 'light' | 'dark' | null | undefined
    }) {
      store.isDarkMode = colorScheme === 'dark'
      hanzoNative.restart()
    },

    setReduceTransparency: (v: boolean) => {
      store.reduceTransparency = v
    },

    addToHistory: (query: string) => {
      store.history.push(query)
    },

    setHistoryPointer: (pointer: number) => {
      if (pointer > store.history.length - 1) {
        return
      }
      store.historyPointer = pointer
    },

    showFileSearch: () => {
      store.focusWidget(Widget.FILE_SEARCH)
      store.query = ''
    },

    addSearchFolder: (folder: string) => {
      store.searchFolders.push(folder)
    },

    removeSearchFolder: (folder: string) => {
      store.searchFolders = store.searchFolders.filter(f => f !== folder)
    },

    setSearchEngine: (engine: SearchEngine) => {
      store.searchEngine = engine
    },

    setCustomSearchUrl: (url: string) => {
      store.customSearchUrl = url
    },
    
    onHotkey({id}: {id: string}) {
      let item = store.items.find(i => i.id === id)
      if (item == null) {
        return
      }

      if (item.callback) {
        item.callback()
      } else if (item.url) {
        hanzoNative.openFile(item.url)
      }

      if (itemsThatShouldShowWindow.includes(item.id)) {
        setTimeout(hanzoNative.showWindow, 0)
      }
    },

    setShorcut(id: string, shortcut: string) {
      store.shortcuts[id] = shortcut
      hanzoNative.updateHotkeys(toJS(store.shortcuts))
    },

    restoreDefaultShorcuts() {
      store.shortcuts = defaultShortcuts
      hanzoNative.updateHotkeys(toJS(store.shortcuts))
    },

    setWindowHeight(e: any) {
      hanzoNative.setWindowHeight(e.nativeEvent.layout.height)
    },

    // Old custom items are not migrated to the new format which has an id
    // This function is used to migrate the old custom items to the new format
    // by just adding a random id
    migrateCustomItems() {
      store.customItems = store.customItems.map(i => {
        if (i.id) {
          return i
        }

        return {...i, id: Math.random().toString()}
      })
    },
  })

  // Set up color scheme change listener
  mediaQueryListener = window.matchMedia('(prefers-color-scheme: dark)');
  handleColorSchemeChange = () => {
    store.onColorSchemeChange({ colorScheme: mediaQueryListener!.matches ? 'dark' : 'light' });
  };
  mediaQueryListener.addEventListener('change', handleColorSchemeChange);

  hydrate().then(() => {
    autorun(persist)
    store.getCalendarAccess()
    store.getAccessibilityStatus()
    store.getFullDiskAccessStatus()
  })

  onShowListener = hanzoNative.addListener('onShow', store.onShow)
  onHideListener = hanzoNative.addListener('onHide', store.onHide)
  onHotkeyListener = hanzoNative.addListener('hotkey', store.onHotkey)
  onFileSearchListener = hanzoNative.addListener(
    'onFileSearch',
    store.onFileSearch,
  )

  return store
}
