import { SVGProps } from "react"

interface HanzoLogoProps extends SVGProps<SVGSVGElement> {
  animated?: boolean
}

interface HanzoBrandProps {
  /** Wrapper classes — set the text color here; the mark inherits currentColor. */
  className?: string
  /** Size/position of the logomark (defaults to a header-sized 8×8). */
  markClassName?: string
  /** Extra classes for the "Hanzo" wordmark text. */
  wordmarkClassName?: string
  /** Hide the wordmark to show the mark alone (compact/collapsed chrome). */
  showWordmark?: boolean
  /** Label — the product surface can read "Hanzo", "Hanzo Dev", etc. */
  label?: string
}

/**
 * The canonical Hanzo brand lockup: the real geometric logomark + the "Hanzo"
 * wordmark, side by side. This is the ONE brand mark for chrome (header /
 * sidebar / footer / auth) — never a bare letter "H". The mark inherits
 * `currentColor`, so a neutral wrapper (`text-white`, `text-foreground`) keeps
 * the whole lockup monochrome with no per-call color plumbing.
 */
export function HanzoBrand({
  className = "",
  markClassName = "w-8 h-8",
  wordmarkClassName = "",
  showWordmark = true,
  label = "Hanzo",
}: HanzoBrandProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <HanzoLogo className={markClassName} />
      {showWordmark && (
        <span className={`font-semibold text-lg tracking-tight ${wordmarkClassName}`}>
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
  
  if (!animated) {
    return (
      <svg 
        viewBox="0 0 67 67" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none"
        {...props}
      >
        <path d="M22.21 67V44.6369H0V67H22.21Z" fill={fillColor} opacity={opacity} />
        <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill={accentColor} opacity={opacity * 0.8} />
        <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill={fillColor} opacity={opacity} />
        <path d="M22.21 0H0V22.3184H22.21V0Z" fill={fillColor} opacity={opacity} />
        <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill={fillColor} opacity={opacity} />
        <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill={accentColor} opacity={opacity * 0.8} />
        <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill={fillColor} opacity={opacity} />
      </svg>
    )
  }
  
  // Animated version with subtle pulse effect
  return (
    <svg 
      viewBox="0 0 67 67" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none"
      {...props}
    >
      <g className="animate-pulse">
        <path d="M22.21 67V44.6369H0V67H22.21Z" fill={fillColor} opacity={opacity} />
        <path d="M0 44.6369L22.21 46.8285V44.6369H0Z" fill={accentColor} opacity={opacity * 0.8} />
        <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill={fillColor} opacity={opacity} />
        <path d="M22.21 0H0V22.3184H22.21V0Z" fill={fillColor} opacity={opacity} />
        <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill={fillColor} opacity={opacity} />
        <path d="M66.6753 22.3185L44.5098 20.0822V22.3185H66.6753Z" fill={accentColor} opacity={opacity * 0.8} />
        <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill={fillColor} opacity={opacity} />
      </g>
    </svg>
  )
}