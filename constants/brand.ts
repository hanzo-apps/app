/**
 * Brand Constants
 *
 * Centralized brand color system for consistent styling across hanzo.app.
 * Use these constants instead of hardcoded hex values.
 *
 * Aligns with hanzo.ai brand colors:
 * - Primary: #171717
 * - Secondary: #404040
 * - Hover: #000000
 */

// Primary brand colors
export const BRAND = {
  primary: "#171717",
  secondary: "#404040",
  hover: "#000000",
} as const;

// Tailwind-compatible class strings
export const brandClasses = {
  // Text colors
  text: {
    primary: "text-[#171717]",
    secondary: "text-[#404040]",
  },

  // Background colors
  bg: {
    primary: "bg-[#171717]",
    secondary: "bg-[#404040]",
    hover: "hover:bg-[#000000]",
    primaryHover: "bg-[#171717] hover:bg-[#000000]",
    secondaryHover: "bg-[#404040] hover:bg-[#171717]",
  },

  // Background with opacity
  bgOpacity: {
    5: "bg-[#171717]/5",
    10: "bg-[#171717]/10",
    15: "bg-[#171717]/15",
    20: "bg-[#171717]/20",
    30: "bg-[#171717]/30",
    secondary10: "bg-[#404040]/10",
    secondary20: "bg-[#404040]/20",
    secondary30: "bg-[#404040]/30",
  },

  // Border colors
  border: {
    primary: "border-[#171717]",
    secondary: "border-[#404040]",
    primaryOpacity20: "border-[#171717]/20",
    primaryOpacity30: "border-[#171717]/30",
    primaryOpacity40: "border-[#171717]/40",
    secondaryOpacity20: "border-[#404040]/20",
    secondaryOpacity30: "border-[#404040]/30",
    secondaryOpacity40: "border-[#404040]/40",
  },

  // Gradient patterns
  gradient: {
    primary: "from-[#171717] to-[#404040]",
    primaryReverse: "from-[#404040] to-[#171717]",
    primaryFade: "from-[#171717]/20 to-[#171717]/5",
    secondaryFade: "from-[#404040]/20 to-[#404040]/5",
    hero: "from-[#171717]/20 via-[#404040]/20 to-[#171717]/10",
    radial: "bg-gradient-radial from-[#171717]/15 via-[#404040]/5 to-transparent",
  },

  // Common card patterns
  card: {
    primary: "bg-gradient-to-br from-[#171717]/20 to-[#171717]/5 border border-[#171717]/20 hover:border-[#171717]/40",
    secondary: "bg-gradient-to-br from-[#404040]/20 to-[#404040]/5 border border-[#404040]/20 hover:border-[#404040]/40",
    primaryLight: "bg-gradient-to-br from-[#171717]/15 to-[#171717]/5 border border-[#171717]/20 hover:border-[#171717]/40",
    primaryStrong: "bg-gradient-to-br from-[#171717]/30 to-[#171717]/10 border border-[#171717]/20 hover:border-[#171717]/40",
    secondaryStrong: "bg-gradient-to-br from-[#404040]/30 to-[#404040]/10 border border-[#404040]/20 hover:border-[#404040]/40",
  },

  // Button patterns
  button: {
    primary: "bg-[#171717] hover:bg-[#000000] text-white",
    secondary: "bg-[#404040] hover:bg-[#171717] text-white",
    outline: "border border-[#171717]/40 hover:border-[#171717] text-[#171717] hover:text-[#404040]",
    outlineSecondary: "border border-[#404040]/40 hover:border-[#404040] text-[#404040] hover:text-[#171717]",
    ghost: "hover:bg-[#171717]/10 text-[#171717]",
    gradient: "bg-gradient-to-r from-[#171717] to-[#404040] hover:from-[#000000] hover:to-[#171717]",
  },

  // Icon wrapper patterns
  iconWrapper: {
    primary: "bg-[#171717]/10 text-[#171717]",
    secondary: "bg-[#404040]/10 text-[#404040]",
    primaryRounded: "p-3 rounded-lg bg-[#171717]/20",
    secondaryRounded: "p-3 rounded-lg bg-[#404040]/20",
  },

  // Badge patterns
  badge: {
    primary: "bg-[#171717]/10 border border-[#171717]/30 text-[#171717]",
    secondary: "bg-[#404040]/10 border border-[#404040]/30 text-[#404040]",
    gradient: "bg-gradient-to-r from-[#171717] to-[#404040] text-white border-0",
  },

  // Focus ring patterns
  ring: {
    primary: "focus:ring-[#171717]",
    secondary: "focus:ring-[#404040]",
    primaryOffset: "focus:ring-2 focus:ring-[#171717] focus:ring-offset-2",
    secondaryOffset: "focus:ring-2 focus:ring-[#404040] focus:ring-offset-2",
  },
} as const;

export type BrandColor = "primary" | "secondary";
