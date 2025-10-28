/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      colors: {
        // Exact match with frontend design system
        background: '#f5e6e8',
        foreground: '#2d2d2d',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#2d2d2d',
          hover: '#fafafa',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#2d2d2d',
        },
        primary: {
          50: '#fff3f0',
          100: '#ffd4c8',
          200: '#ffb3a1',
          300: '#ff8a6b',
          400: '#ff6b35',
          500: '#e55a2b',
          600: '#d1491f',
          700: '#b83d1a',
          800: '#9f3215',
          900: '#862a12',
          950: '#6d220f',
          DEFAULT: '#ff6b35',
          foreground: '#ffffff',
          light: '#fff3f0',
          hover: '#e55a2b',
        },
        secondary: {
          50: '#fff3f0',
          100: '#ffd4c8',
          200: '#ffb3a1',
          300: '#ff8a6b',
          400: '#ff6b35',
          500: '#e55a2b',
          600: '#d1491f',
          700: '#b83d1a',
          800: '#9f3215',
          900: '#862a12',
          950: '#6d220f',
          DEFAULT: '#ffd4c8',
          foreground: '#2d2d2d',
        },
        muted: {
          DEFAULT: '#f0f0f0',
          foreground: '#6b6b6b',
        },
        accent: {
          50: '#fff3f0',
          100: '#ffd4c8',
          200: '#ffb3a1',
          300: '#ff8a6b',
          400: '#ff6b35',
          500: '#e55a2b',
          600: '#d1491f',
          700: '#b83d1a',
          800: '#9f3215',
          900: '#862a12',
          950: '#6d220f',
          DEFAULT: '#ff6b35',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#81c784',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#ffb74d',
          foreground: '#2d2d2d',
        },
        info: {
          DEFAULT: '#64b5f6',
          foreground: '#ffffff',
        },
        border: '#e8e8e8',
        input: '#f5f5f5',
        ring: '#ff6b35',
        // Chart colors - playful palette
        chart: {
          1: '#ff6b35', // Orange
          2: '#81c784', // Green
          3: '#64b5f6', // Blue
          4: '#ba68c8', // Purple
          5: '#ffb74d', // Yellow
        },
      },
      borderRadius: {
        lg: '1.25rem',
        md: 'calc(1.25rem - 2px)',
        sm: 'calc(1.25rem - 4px)',
        xl: 'calc(1.25rem + 4px)',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' }
        }
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [],
}