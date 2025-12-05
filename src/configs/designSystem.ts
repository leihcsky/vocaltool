/**
 * WaveKit Design System Configuration
 * 
 * This file contains the design tokens and configuration for the WaveKit brand.
 * Use these values throughout the application for consistency.
 */

export const designSystem = {
  // Brand Colors
  colors: {
    brand: {
      primary: '#14b8a6',      // Teal 500
      primaryHover: '#0d9488',  // Teal 600
      primaryLight: '#99f6e4',  // Teal 200
      primaryDark: '#0f766e',   // Teal 700
    },
    accent: {
      primary: '#f97316',       // Orange 500
      primaryHover: '#ea580c',  // Orange 600
      primaryLight: '#fed7aa',  // Orange 200
      primaryDark: '#c2410c',   // Orange 700
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'Inter, system-ui, sans-serif',
      mono: 'Monaco, ui-monospace, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },

  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    soft: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
    large: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
    brand: '0 4px 14px 0 rgba(20, 184, 166, 0.25)',
    accent: '0 4px 14px 0 rgba(249, 115, 22, 0.25)',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Helper function to get color with opacity
export function withOpacity(color: string, opacity: number): string {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

// Export individual sections for convenience
export const { colors, typography, spacing, borderRadius, shadows, transitions, breakpoints, zIndex } = designSystem;

