/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF8F1',
          dim: '#F1EEE3',
          line: '#E4DFCF'
        },
        ink: {
          DEFAULT: '#1E2430',
          soft: '#4A5164',
          faint: '#8B90A0'
        },
        indigo: {
          DEFAULT: '#3A4A78',
          dark: '#2C3A61',
          tint: '#EAEEF7'
        },
        sage: {
          DEFAULT: '#7C9473',
          tint: '#EDF2EB'
        },
        amber: {
          DEFAULT: '#C68A3E',
          tint: '#FBF1E2'
        },
        brick: {
          DEFAULT: '#A6483E',
          tint: '#F8ECEA'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,36,48,0.06), 0 6px 16px -4px rgba(30,36,48,0.10)',
        lifted: '0 4px 10px rgba(30,36,48,0.10), 0 14px 28px -8px rgba(30,36,48,0.18)',
        modal: '0 20px 60px -12px rgba(30,36,48,0.35)'
      },
      borderRadius: {
        card: '10px'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' }
        }
      }
    }
  },
  plugins: []
}
