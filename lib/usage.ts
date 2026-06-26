/**
 * Honest account usage.
 *
 * The Hanzo platform DOES meter per-app CPU / memory / storage / egress into
 * `appUsageMetrics`, but that data is not yet exposed through any user-facing
 * REST or tRPC endpoint (it is service-token / billing-internal only). So the
 * one usage figure we can state truthfully today is the user's real project
 * count, sourced from the Hanzo Base data plane. Everything else is reported as
 * not-yet-metered rather than invented.
 *
 * When the platform ships a per-org usage query, wire `metered` dimensions here
 * — the dashboard already renders whatever this returns.
 */

export interface UsageMetric {
  label: string;
  value: number;
  /** null = no published limit (e.g. unlimited or unknown), never a fake cap. */
  limit: number | null;
  unit?: string;
}

export interface AccountUsage {
  /** True only when real consumption metering is wired. */
  metered: boolean;
  /** Real, currently-knowable figures. */
  metrics: UsageMetric[];
  /** Shown verbatim when `metered` is false — the honest state. */
  note?: string;
}

export function buildUsage(projectCount: number): AccountUsage {
  return {
    metered: false,
    metrics: [
      { label: "Projects", value: Math.max(0, projectCount | 0), limit: null },
    ],
    note: "Consumption metering (compute, storage, requests) is coming soon.",
  };
}
