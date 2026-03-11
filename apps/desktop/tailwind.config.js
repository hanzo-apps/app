/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/**/node_modules/**",
  ],
  darkMode: 'class',
  theme: {
    minWidth: {
      10: '10px',
    },
    fontSize: {
      xxxs: '8px',
      xxs: '11px',
      xs: '12px',
      sm: '13px',
      base: '16px',
      lg: '18px',
      xl: '19px',
      '2xl': '20px',
      '3xl': '22px',
      '4xl': '26px',
      '5xl': '42px',
      '6xl': '52px',
      '7xl': '62px',
      '8xl': '128px',
    },
    extend: {
      borderRadius: {
        xs: '1px',
        corner: '7px',
        xl: '14px',
      },
      spacing: {
        25: '108px',
        26: '112px',
      },
      colors: {
        // Hanzo's colors
        darkWindowBorder: '#CCCCCC22',
        lightWindowBorder: '#FFFFFF',
        lightHighlight: 'rgba(0, 0, 0, .1)',
        darkHighlight: 'rgba(255, 255, 255, .07)',
        darkBorder: 'rgba(255, 255, 255, .1)',
        lightBorder: 'rgba(0, 0, 0, .1)',
        subBgDark: '#00000020',
        subBgLight: '#FFFFFF77',
        inputLight: '#00000010',
        inputDark: '#00000050',
        'accent-strong': 'rgb(var(--color-accent) / .80)',
        accent: 'rgb(var(--color-accent) / .50)',
        'accent-dark': 'rgb(var(--color-accent) / .14)',
        
        // Hanzo colors for compatibility
        primary: '#1a1a1a',
        secondary: '#2a2a2a',
        'accent-hover': '#0052cc',
        'text-primary': '#ffffff',
        'text-secondary': '#999999',
        'border': '#333333',
        
        // Jan theme colors
        app: 'var(--app-bg)',
        'left-panel-fg': 'var(--app-left-panel-fg)',
        'main-view': 'var(--app-main-view)',
        'main-view-fg': 'var(--app-main-view-fg)',
        primary: 'var(--app-primary)',
        'primary-fg': 'var(--app-primary-fg)',
        destructive: 'var(--app-destructive)',
        'destructive-fg': 'var(--app-destructive-fg)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
    },
  },
  plugins: [
    // Set a default value on the `:root` element for Hanzo's accent color
    ({addBase}) => addBase({':root': {'--color-accent': '0 102 255'}}),
  ],
}