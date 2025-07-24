/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gray-900': '#111111',
        'gray-800': '#1a1a1a',
        'gray-700': '#2d2d2d',
        'primary': '#3b82f6',
        'accent': '#f59e42',
        'success': '#22c55e',
        'error': '#ef4444',
        'warning': '#facc15',
        'info': '#38bdf8',
        'editor-bg': '#18181b',
        'editor-border': '#27272a',
      }
      ,
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        'mono': ['Fira Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0,0,0,0.08)',
        'editor': '0 4px 24px 0 rgba(59,130,246,0.12)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      aspectRatio: {
        'editor': '4/3',
      },
      minHeight: {
        'editor': '320px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
  ],
}
