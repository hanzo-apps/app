export const TELEMETRY_ENDPOINT =
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || 'https://console.hanzo.ai/api/public/otel/v1/traces';

export const TELEMETRY_TOKEN =
  process.env.NEXT_PUBLIC_ANALYTICS_TOKEN || '';

export const TELEMETRY_ENABLED =
  process.env.NEXT_PUBLIC_TELEMETRY_ENABLED !== 'false';

export const TELEMETRY_DEBUG =
  process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === 'true';

export const FLUSH_INTERVAL_MS = 30_000;
export const MAX_BATCH_SIZE = 50;
export const MAX_RETRIES = 3;
export const RETRY_BASE_MS = 1_000;
export const HEARTBEAT_INTERVAL_MS = 300_000;

export function detectDeploymentType(): 'hanzo_cloud' | 'hf_space' | 'server' | 'browser' {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('hanzo.app') || hostname.includes('hanzo.ai')) {
      return 'hanzo_cloud';
    }
    if (hostname.includes('hf.space') || hostname.includes('huggingface.co')) {
      return 'hf_space';
    }
  }
  if (process.env.NEXT_PUBLIC_SERVER_MODE === 'true') {
    return 'server';
  }
  return 'browser';
}

import pkg from '@/package.json';

export function getAppVersion(): string {
  return pkg.version;
}
