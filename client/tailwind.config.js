/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#02040a", // Deep Void
        secondary: "#0f1219", // Slightly lighter void for cards
        surface: "#1a2030", // Fallback
        "surface-alt": "#141a28", // Elevated surface
        "surface-glass": "rgba(255, 255, 255, 0.03)",
        "surface-glass-strong": "rgba(255, 255, 255, 0.08)",
        action: "#3b82f6", // Deep Trust Blue
        "action-end": "#8b5cf6", // Vibrant Futuristic Purple
        "action-dim": "rgba(59, 130, 246, 0.1)",
        "action-glow": "rgba(139, 92, 246, 0.4)",
        "neon": "#00f2fe", // Neon Cyan
        emergency: "#ff4d4d",
        "emergency-dim": "#cc0000",
        accent: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          pink: "#ec4899",
          amber: "#f59e0b",
          emerald: "#10b981",
          cyan: "#06b6d4",
          violet: "#7c3aed",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.05)",
          DEFAULT: "rgba(255, 255, 255, 0.1)",
          strong: "rgba(255, 255, 255, 0.2)",
          highlight: "rgba(255, 255, 255, 0.4)",
        },
        text: {
          primary: "#ffffff",
          secondary: "#94a3b8", // Slate 400
          muted: "#64748b", // Slate 500
          dim: "#475569", // Slate 600
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'primary-gradient': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #00f2fe 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #00f2fe 100%)',
        'surface-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(0, 242, 254, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 242, 254, 0.4)',
        'glow-text': '0 0 10px rgba(255, 255, 255, 0.5)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'float': '0 20px 60px -10px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
          '50%': { transform: 'scale(1.1)', opacity: '0.5' },
        },
        'aurora': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'ring-spin': {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--ring-target, 0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 3s infinite linear',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
        'aurora': 'aurora 20s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'ring-spin': 'ring-spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'count-up': 'count-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'dot-bounce': 'dot-bounce 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
