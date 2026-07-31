// Server-side Hanzo run-target client.
//
// Binds hanzo.app to the cloud /v1/agents/targets registry — the MACHINES an org
// runs work on, which `hanzo code` refreshes on every run. Sessions attach to
// these; the console groups by them.
//
// This is the machine list rather than one inferred from session strings: a
// machine exists whether or not something is running on it right now, so a box
// that finished its last session still shows up (idle) instead of vanishing.
//
// IAM-native and per-org, exactly as lib/platform.ts: the user's IAM token is
// forwarded and the control plane derives the org from it.

import { API_BASE, PlatformAuthError, PlatformError } from './platform';

/** Base for the machine registry. */
export const TARGETS_BASE = `${API_BASE}/v1/agents/targets`;

/** Live load, when the machine reported any. */
export interface MachineMetrics {
  cpuPercent?: number;
  memPercent?: number;
  diskPercent?: number;
  loadAvg?: number;
}

/** Hardware, as the machine described itself. */
export interface MachineSpec {
  os?: string;
  arch?: string;
  cpus?: number;
  memGb?: number;
  gpu?: string;
}

/** One machine in the org. */
export interface Machine {
  id: string;
  label: string;
  kind: string;
  /** online | offline | busy — the control plane derives this from last contact. */
  status: string;
  capacity?: string;
  host?: string;
  spec?: MachineSpec;
  metrics?: MachineMetrics;
  metricsAt?: string;
  /** Totals the control plane counts, so the UI does not re-derive them. */
  sessions: number;
  running: number;
  updatedAt: string;
}

export interface MachineList {
  targets: Machine[];
}

/** List the caller's org's machines. */
export async function listMachines(token: string): Promise<MachineList> {
  if (!token) throw new PlatformAuthError();

  const res = await fetch(TARGETS_BASE, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) throw new PlatformError(res.status, text);
  return (text ? JSON.parse(text) : { targets: [] }) as MachineList;
}
