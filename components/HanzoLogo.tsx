'use client';

import { SizableText, XStack } from '@hanzo/gui';
import { SVGProps } from "react"
import { MARK_PATHS, MARK_VIEWBOX } from "@hanzo/logo/logos"
import { HanzoLogo as BrandMotion } from "@hanzo/logo/react"

interface HanzoLogoProps extends SVGProps<SVGSVGElement> {
  animated?: boolean
  /** Rendered box in px (square). */
  size?: number
}

interface HanzoBrandProps {
  /** Lockup color — the mark inherits currentColor. */
  color?: string
  /** Size of the logomark in px. Defaults to the ONE canonical 32×32 chrome
   *  size (matches the dashboard sidebar) — pass a size only for a deliberate
   *  exception, never to re-tune the default. */
  markSize?: number
  /** Wordmark type size in px (defaults to the lockup register). */
  wordmarkSize?: number
  /** Hide the wordmark on small screens (compact mobile chrome). */
  wordmarkFromSm?: boolean
  /** Hide the wordmark to show the mark alone (compact/collapsed chrome). */
  showWordmark?: boolean
  /** Label — the product surface reads "Hanzo App", "Hanzo Dev", etc. */
  label?: string
  /** One-time brand reveal via the @hanzo/logo motion shell: intro flip + idle
   *  breathe + the wordmark slides in, holds, then collapses (returns on hover).
   *  Pure CSS, reduced-motion-safe — the ONE brand motion shared with
   *  hanzo.ai / console / team. */
  collapse?: boolean
}

/**
 * The canonical Hanzo brand lockup: the real geometric logomark + the wordmark,
 * side by side. This is the ONE brand mark for ALL chrome (header / sidebar /
 * footer / auth) — never a bare letter "H", never a per-call size/label re-tune.
 * Geometry comes from @hanzo/logo (`MARK_PATHS`, the canonical 7-path shaded H)
 * and inherits `currentColor`, so a neutral wrapper (`text-white`) keeps the
 * whole lockup monochrome with no per-call color plumbing.
 */
export function HanzoBrand({
  color,
  markSize = 32,
  wordmarkSize,
  wordmarkFromSm = false,
  showWordmark = true,
  label = "Hanzo App",
  collapse = false,
}: HanzoBrandProps) {
  if (collapse && showWordmark) {
    // The animated reveal is the @hanzo/logo motion shell (flip + breathe +
    // wordmark collapse) — package CSS, not a local keyframe.
    return (
      <SizableText fontSize="$6" letterSpacing={-0.4} color={color}>
        <BrandMotion animated size={32} wordmark={label} />
      </SizableText>
    )
  }
  return (
    <XStack alignItems="center" gap="$2">
      <HanzoLogo size={markSize} color={color} />
      {showWordmark && (
        <SizableText
          overflow="hidden" whiteSpace="nowrap" fontWeight="500" letterSpacing={-0.4} color={color}
          fontSize={wordmarkSize ?? "$6"}
          {...(wordmarkFromSm ? { display: "none", $sm: { display: "inline" } } : null)}
        >
          {label}
        </SizableText>
      )}
    </XStack>
  )
}

/**
 * The Hanzo mark as an inline SVG icon. Geometry is @hanzo/logo's `MARK_PATHS`
 * (the ONE home of the 7-path shaded H — never re-typed here); the body inherits
 * `currentColor`, the two shade slivers carry the canonical accent. `animated`
 * keeps the subtle idle breathe (`hanzo-logo-idle` in globals.css, reduced-motion
 * gated) for mark-only chrome; the full brand motion is `HanzoBrand collapse`.
 */
export function HanzoLogo({ animated = false, size = 32, ...props }: HanzoLogoProps) {
  const paths = <g dangerouslySetInnerHTML={{ __html: MARK_PATHS }} />

  if (!animated) {
    return (
      <svg viewBox={MARK_VIEWBOX} width={size} height={size} xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        {paths}
      </svg>
    )
  }

  return (
    <svg viewBox={MARK_VIEWBOX} width={size} height={size} xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
      <g className="hanzo-logo-idle">{paths}</g>
    </svg>
  )
}
