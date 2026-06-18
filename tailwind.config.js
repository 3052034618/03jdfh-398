/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        horror: {
          bg: "#0F0F12",
          surface: "#1A1A1F",
          surface2: "#23232A",
          border: "#2E2E36",
          text: "#E4E4E7",
          muted: "#71717A",
          accent: "#8B1A1A",
          accent2: "#A52A2A",
          glow: "#B03030",
          locked: "#6B1010",
          explorable: "#1E4D2B",
          secondrun: "#5C3D6B",
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'flicker': 'flicker 3s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 26, 26, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(139, 26, 26, 0)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '52%': { opacity: '0.6' },
          '54%': { opacity: '0.95' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(139, 26, 26, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 26, 26, 0.08) 1px, transparent 1px)",
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
