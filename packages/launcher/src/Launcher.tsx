import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input, ScrollView, Spinner, Text, XStack, YStack } from '@hanzo/gui'
import { CornerDownLeft, Search } from '@hanzogui/lucide-icons-2'

import { createIndex, search } from './search'
import type { CommandItem, LauncherProps } from './types'

/**
 * The launcher — an Apple-style ⌘Space palette rendered entirely with
 * `@hanzo/gui` (Tamagui) primitives. ONE component; runs unchanged on:
 *   - desktop  (react-native-web bundle inside a Tauri window)
 *   - web      (react-native-web)
 *   - native   (iOS / Android via Metro + Expo)
 *
 * It owns query state, fuzzy filtering, async result merging, selection and
 * keyboard nav. Every side effect it can perform is handed in via `CommandItem.run`
 * and `onSearch`, so the component itself touches no platform API.
 *
 * Keyboard nav (↑/↓/↵/Esc) is a web/desktop enhancement guarded by feature
 * detection; on native the rows are pressable, which is the native affordance.
 */
export function Launcher({
  commands,
  onSearch,
  placeholder = 'Search apps and commands…',
  onRequestClose,
  autoFocus = true,
}: LauncherProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [asyncResults, setAsyncResults] = useState<CommandItem[]>([])
  const [loading, setLoading] = useState(false)

  const index = useMemo(() => createIndex(commands), [commands])
  const localResults = useMemo(() => search(index, commands, query), [index, commands, query])

  // Deduplicate: async results win their id over a local match of the same id.
  const results = useMemo(() => {
    const asyncIds = new Set(asyncResults.map((r) => r.id))
    return [...localResults.filter((r) => !asyncIds.has(r.id)), ...asyncResults]
  }, [localResults, asyncResults])

  const runSelected = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return
      void item.run()
      setQuery('')
      setAsyncResults([])
    },
    [],
  )

  // Debounced async source (installed apps, remote hits). Injected by the host.
  const searchToken = useRef(0)
  useEffect(() => {
    if (!onSearch) return
    const q = query.trim()
    if (!q) {
      setAsyncResults([])
      setLoading(false)
      return
    }
    const token = ++searchToken.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const hits = await onSearch(q)
        if (token === searchToken.current) setAsyncResults(hits)
      } catch {
        if (token === searchToken.current) setAsyncResults([])
      } finally {
        if (token === searchToken.current) setLoading(false)
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  // Clamp selection when the result set shrinks.
  useEffect(() => {
    setSelected((i) => Math.min(Math.max(i, 0), Math.max(results.length - 1, 0)))
  }, [results.length])

  // Web/desktop keyboard navigation. Feature-detected so native is unaffected.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelected((i) => Math.min(i + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelected((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          runSelected(results[selected])
          break
        case 'Escape':
          e.preventDefault()
          if (query) setQuery('')
          else onRequestClose?.()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, selected, query, runSelected, onRequestClose])

  return (
    <YStack
      width="100%"
      maxW={640}
      self="center"
      bg="$color2"
      rounded="$6"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      shadowColor="$shadowColor"
      shadowRadius={24}
      shadowOpacity={0.35}
    >
      <XStack items="center" gap="$3" px="$4" py="$3.5" borderBottomWidth={1} borderColor="$borderColor">
        <Search size={20} opacity={0.5} />
        <Input
          flex={1}
          size="$5"
          borderWidth={0}
          bg="transparent"
          autoFocus={autoFocus}
          value={query}
          placeholder={placeholder}
          onChangeText={setQuery}
        />
        {loading ? <Spinner size="small" /> : null}
      </XStack>

      {results.length > 0 ? (
        <ScrollView maxH={420}>
          <YStack py="$2" px="$2" gap="$0.5">
            {results.map((item, i) => (
              <Row key={item.id} item={item} active={i === selected} onPress={() => runSelected(item)} />
            ))}
          </YStack>
        </ScrollView>
      ) : query ? (
        <YStack px="$4" py="$5" items="center">
          <Text fontSize="$3" color="$color10">
            No results for “{query}”
          </Text>
        </YStack>
      ) : null}

      <XStack
        items="center"
        justify="space-between"
        px="$4"
        py="$2.5"
        borderTopWidth={1}
        borderColor="$borderColor"
      >
        <Text fontSize="$1" color="$color10">
          ↑↓ navigate · ↵ open · esc close
        </Text>
        <Text fontSize="$1" color="$color10">
          ⌘Space
        </Text>
      </XStack>
    </YStack>
  )
}

function Row({
  item,
  active,
  onPress,
}: {
  item: CommandItem
  active: boolean
  onPress: () => void
}) {
  const Icon = item.icon
  return (
    <XStack
      onPress={onPress}
      cursor="pointer"
      items="center"
      gap="$3"
      px="$3"
      py="$2.5"
      rounded="$4"
      bg={active ? '$color5' : 'transparent'}
      hoverStyle={{ bg: active ? '$color5' : '$color3' }}
    >
      {Icon ? (
        <YStack width={24} items="center">
          <Icon size={18} />
        </YStack>
      ) : null}
      <YStack flex={1}>
        <Text fontSize="$4" fontWeight="600" color="$color12" numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text fontSize="$1" color="$color10" numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </YStack>
      {item.group ? (
        <Text fontSize="$1" color="$color9">
          {item.group}
        </Text>
      ) : null}
      <CornerDownLeft size={13} opacity={active ? 0.8 : 0.25} />
    </XStack>
  )
}
