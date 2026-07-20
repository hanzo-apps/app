import { SVGProps } from "react"

interface HanzoLogoProps extends SVGProps<SVGSVGElement> {
  animated?: boolean
}

interface HanzoBrandProps {
  /** Wrapper classes — set the text color here; the mark inherits currentColor. */
  className?: string
  /** Size/position of the logomark. Defaults to the ONE canonical 32×32 chrome
   *  size (matches the dashboard sidebar) — pass a size only for a deliberate
   *  exception, never to re-tune the default. */
  markClassName?: string
  /** Extra classes for the wordmark text. */
  wordmarkClassName?: string
  /** Hide the wordmark to show the mark alone (compact/collapsed chrome). */
  showWordmark?: boolean
  /** Label — the product surface reads "Hanzo App", "Hanzo Dev", etc. */
  label?: string
  /** One-time brand reveal: show the wordmark, then animate it away leaving just
   *  the H (a slow width+opacity collapse, ~2.4s in). No-op under
   *  prefers-reduced-motion (the wordmark stays put). */
  collapse?: boolean
}

/**
 * The canonical Hanzo brand lockup: the real geometric logomark + the wordmark,
 * side by side. This is the ONE brand mark for ALL chrome (header / sidebar /
 * footer / auth) — never a bare letter "H", never a per-call size/label re-tune.
 * The mark inherits `currentColor`, so a neutral wrapper (`text-white`) keeps the
 * whole lockup monochrome with no per-call color plumbing. Default size 32×32 and
 * default label "Hanzo App" are the single source of brand truth — override only
 * for a deliberate, documented exception.
 */
export function HanzoBrand({
  className = "",
  markClassName = "h-8 w-8",
  wordmarkClassName = "",
  showWordmark = true,
  label = "Hanzo App",
  collapse = false,
}: HanzoBrandProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <HanzoLogo className={markClassName} />
      {showWordmark && (
        <span
          className={`overflow-hidden whitespace-nowrap text-lg font-medium tracking-tight ${
            collapse ? "hanzo-wordmark-collapse" : ""
          } ${wordmarkClassName}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}

export function HanzoLogo({ animated = false, ...props }: HanzoLogoProps) {
  const fillColor = "currentColor"
  const accentColor = "currentColor"
  const opacity = animated ? 0.9 : 1

  const paths = (
    <>
      <path d="M22.21 67V44.6369H0V67H22.21Z" fill={fillColor} opacity={opacity} />
      <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill={accentColor} opacity={opacity * 0.8} />
      <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill={fillColor} opacity={opacity} />
      <path d="M22.21 0H0V22.3184H22.21V0Z" fill={fillColor} opacity={opacity} />
      <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill={fillColor} opacity={opacity} />
      <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill={accentColor} opacity={opacity * 0.8} />
      <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill={fillColor} opacity={opacity} />
    </>
  )

  if (!animated) {
    return (
      <svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
        {paths}
      </svg>
    )
  }

  // Subtle, Vercel-restrained idle animation: a slow breathing opacity drift
  // that lifts on hover. `hanzo-logo-idle` is defined in globals.css and is
  // wrapped in `@media (prefers-reduced-motion: no-preference)`, so it is a
  // no-op for reduced-motion users (the mark simply renders static).
  return (
    <svg viewBox="0 0 67 67" xmlns="http://www.w3.org/2000/svg" fill="none" {...props}>
      <g className="hanzo-logo-idle origin-center">{paths}</g>
    </svg>
  )
}