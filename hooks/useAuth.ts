'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  fullname: string
  name: string
  email: string
  avatarUrl: string
  isPro: boolean
}

interface AuthState {
  user: AuthUser | null
  authenticated: boolean
  loading: boolean
}

export function useAuth({ redirectTo }: { redirectTo?: string } = {}) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user: null,
    authenticated: false,
    loading: true,
  })

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/check')
      const data = await response.json()

      if (!data.authenticated) {
        setState({ user: null, authenticated: false, loading: false })
        if (redirectTo) {
          router.push(redirectTo)
        }
        return
      }

      setState({
        user: data.user,
        authenticated: true,
        loading: false,
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      setState({ user: null, authenticated: false, loading: false })
      if (redirectTo) {
        router.push(redirectTo)
      }
    }
  }, [redirectTo, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    ...state,
    refresh: checkAuth,
  }
}
