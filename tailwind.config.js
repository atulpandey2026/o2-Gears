/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #E8F4FD 0%, #B3E0F7 30%, #87CEEB 60%, #D6EEFF 100%)',
        'hero-gradient-dark': 'linear-gradient(135deg, #0D1B4B 0%, #1A2E6C 40%, #0D4B8A 100%)',
        'accent-gradient': 'linear-gradient(135deg, #2196F3 0%, #4FC3F7 100%)',
        'primary-gradient': 'linear-gradient(135deg, #0D1B4B 0%, #1A2E6C 100%)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 0.68, 0, 1) forwards',
        'slide-left': 'slideInLeft 0.7s cubic-bezier(0.22, 0.68, 0, 1) forwards',
        'slide-right': 'slideInRight 0.7s cubic-bezier(0.22, 0.68, 0, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
        'wave': 'waveAnim 1.2s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
      },
      boxShadow: {
        'product': '0 20px 60px rgba(13, 27, 75, 0.15)',
        'card-hover': '0 6px 24px rgba(13, 27, 75, 0.12)',
        'glow-blue': '0 8px 30px rgba(33, 150, 243, 0.4)',
        'glow-navy': '0 8px 30px rgba(13, 27, 75, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};