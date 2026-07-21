'use client'

// The ONE canonical cloud-usage surface for hanzo.app — the SAME @hanzo/usage
// components every Hanzo surface renders (console, billing, chat): the native
// <UsagePanel> over GET /v1/get-cloud-usages beside <ConnectedUsage> over
// GET /v1/ai/connections/:provider/usage. This component owns ONLY the fetch + honest
// async state (bearer mode, via THIS surface's IAM token); the two @hanzo/usage
// components own all rendering, so usage reads identically here as in the console —
// nothing is re-derived, and the shape is the published CloudUsageOverview/ProviderUsage.
//
// <UsagePanel>/<ConnectedUsage> are @hanzo/gui (Tamagui) components, so they render
// inside a scoped <GuiProvider> — the rest of hanzo.app stays on @hanzo/ui (Radix +
// Tailwind). Honest by construction: an unreachable ledger renders a typed error with
// retry, an empty window its empty state — NEVER fabricated spend, tokens, or trend.
import { useCallback, useEffect, useState } from 'react'
import { Text, YStack } from '@hanzo/gui'
import { UsagePanel } from '@hanzo/usage/panel'
import { ConnectedUsage } from '@hanzo/usage/connected'
import {
  fetchCloudUsage,
  fetchProviderUsage,
  normalizeProviderUsage,
  type CloudUsageOverview,
  type ProviderUsage,
  type UsageRange,
} from '@hanzo/usage'
import { useIamToken } from '@hanzo/iam/react'


// get-cloud-usages + ai/connections live on the cloud API (api.hanzo.ai), not this origin.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.hanzo.ai'

// The providers a customer can connect to import third-party usage (backend allow-list).
const CONNECTED_PROVIDERS = ['openai', 'anthropic', 'google'] as const

type NativeState = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; data: CloudUsageOverview }
type ConnState = { phase: 'loading' } | { phase: 'error'; message: string } | { phase: 'ready'; items: ProviderUsage[] }

const errMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e))

/** Map the panel's 24h/7d/30d range to an RFC3339 [from,to] window for the connected
 *  provider import (the provider APIs are day-bucketed). Mirrors the console module. */
function rangeWindow(range: UsageRange): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  const days = range === '24h' ? 1 : range === '7d' ? 7 : 30
  from.setUTCDate(from.getUTCDate() - days)
  return { from: from.toISOString(), to: to.toISOString() }
}

function Panels({ token }: { token: string }) {
  const [range, setRange] = useState<UsageRange>('7d')
  const [native, setNative] = useState<NativeState>({ phase: 'loading' })
  const [conn, setConn] = useState<ConnState>({ phase: 'loading' })

  const loadNative = useCallback(
    (r: UsageRange) => {
      setNative({ phase: 'loading' })
      fetchCloudUsage({ baseUrl: API_BASE, token, range: r })
        .then((data) => setNative({ phase: 'ready', data }))
        .catch((e) => setNative({ phase: 'error', message: errMessage(e) }))
    },
    [token],
  )

  const loadConnected = useCallback(
    (r: UsageRange) => {
      setConn({ phase: 'loading' })
      const { from, to } = rangeWindow(r)
      const providers = CONNECTED_PROVIDERS
      // Per-provider isolation: one provider's import failing yields an honest failed
      // card for THAT provider, never blanking the others (mirrors console listWithUsage).
      Promise.allSettled(providers.map((provider) => fetchProviderUsage({ baseUrl: API_BASE, token, provider, from, to })))
        .then((settled) =>
          setConn({
            phase: 'ready',
            items: settled.map((res, i) => {
              const provider = providers[i]!
              return res.status === 'fulfilled'
                ? res.value
                : normalizeProviderUsage({ provider, connected: false, available: false, note: 'Usage import failed — retry.' }, provider)
            }),
          }),
        )
        .catch((e) => setConn({ phase: 'error', message: errMessage(e) }))
    },
    [token],
  )

  useEffect(() => {
    loadNative(range)
    loadConnected(range)
  }, [loadNative, loadConnected, range])

  return (
    <YStack gap="$6">
      <UsagePanel
        title="Usage"
        subtitle="Requests, tokens, spend, and per-model usage — native Hanzo usage (GET /v1/get-cloud-usages)."
        range={range}
        onRangeChange={setRange}
        data={native.phase === 'ready' ? native.data : null}
        loading={native.phase === 'loading'}
        error={native.phase === 'error' ? native.message : null}
        onRetry={() => loadNative(range)}
      />
      <ConnectedUsage
        subtitle="Imported spend and usage from your connected OpenAI, Anthropic, and Google accounts — beside your native Hanzo usage."
        items={conn.phase === 'ready' ? conn.items : null}
        loading={conn.phase === 'loading'}
        error={conn.phase === 'error' ? conn.message : null}
        onRetry={() => loadConnected(range)}
      />
    </YStack>
  )
}

// <UsagePanel>/<ConnectedUsage> are @hanzo/gui components; they render under the
// ONE root <GuiProvider> (app/providers.tsx). A second, scoped GuiProvider here
// nested a second Tamagui PortalProvider — which warns and causes hydration
// mismatches — so this surface just uses the root provider. The bearer is THIS
// surface's IAM access token (the same one it already carries for /v1 calls).
export default function CloudUsagePanel() {
  const { token } = useIamToken()
  return token ? (
    <Panels token={token} />
  ) : (
    <Text fontSize="$3" color="$color10">
      Loading usage…
    </Text>
  )
}
