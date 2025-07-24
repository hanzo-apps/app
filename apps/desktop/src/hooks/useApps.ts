import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface App {
  name: string
  path: string
  icon?: string
}

export function useApps() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true)
        const result = await invoke<App[]>('get_apps')
        setApps(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load apps')
      } finally {
        setLoading(false)
      }
    }

    loadApps()
  }, [])

  return { apps, loading, error }
}