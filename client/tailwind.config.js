/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Incognito Health — Clean Light System ──────────────────
        canvas:  '#F8F7F6',        // warm off-white page background
        surface: '#FFFFFF',        // card / panel background
        border:  '#E8E6E3',        // subtle dividers

        ink: {
          DEFAULT: '#18181B',      // primary text
          secondary: '#71717A',    // body / descriptions
          muted: '#A1A1AA',        // placeholders, metadata
        },

        violet: {
          DEFAULT: '#6D28D9',      // primary accent
          light:   '#EDE9FE',      // soft tint backgrounds
          dark:    '#4C1D95',      // pressed states
        },

        success: { DEFAULT: '#059669', light: '#D1FAE5' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger:  { DEFAULT: '#DC2626', light: '#FEE2E2' },

        // Legacy aliases — keep so existing code doesn't break completely
        brand:   { DEFAULT: '#6D28D9', light: '#EDE9FE' },
        primary: '#F8F7F6',
        action:  '#6D28D9',
        emergency: '#DC2626',
      },

      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },

      boxShadow: {
        // Clean, layered shadows — no glow, no neon
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-md':   '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05)',
        'card-lg':   '0 4px 16px rgba(0,0,0,0.10), 0 16px 40px rgba(0,0,0,0.06)',
        'modal':     '0 20px 60px rgba(0,0,0,0.18)',
        'btn':       '0 1px 2px rgba(0,0,0,0.12)',
        'btn-hover': '0 2px 8px rgba(0,0,0,0.16)',
        // Keep legacy name so old code that references it doesn't blow up
        'editorial': '0 1px 3px rgba(0,0,0,0.06)',
        'neon-blue': '0 1px 3px rgba(0,0,0,0.06)',
        'glass':     '0 4px 16px rgba(0,0,0,0.08)',
      },

      borderRadius: {
        'pill':  '9999px',
        '2xl':   '16px',
        '3xl':   '24px',
        '4xl':   '32px',
      },

      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },

      animation: {
        'fade-in':    'fadeIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':   'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 1.8s linear infinite',
        // Keep old names for components not yet updated
        'pulse-glow': 'fadeIn 2s ease-in-out infinite alternate',
        'scanline':   'fadeIn 0.01s linear',
        'ticker':     'shimmer 40s linear infinite',
        'float':      'float 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
