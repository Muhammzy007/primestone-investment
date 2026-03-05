/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Blue Theme - Professional and Trustworthy
        'primestone': {
          50: '#eff6ff',   // Lightest blue - backgrounds
          100: '#dbeafe',  // Very light blue - hover states
          200: '#bfdbfe',  // Light blue - borders
          300: '#93c5fd',  // Medium light blue - accents
          400: '#60a5fa',  // Medium blue - secondary buttons
          500: '#3b82f6',  // Primary blue - main buttons, links
          600: '#2563eb',  // Dark blue - hover states
          700: '#1d4ed8',  // Darker blue - active states
          800: '#1e40af',  // Very dark blue - text on light backgrounds
          900: '#1e3a8a',  // Deepest blue - headings
        },
        // Neutral colors for text and backgrounds
        'neutral': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // White variations
        'white': '#ffffff',
        'off-white': '#f8fafc',
        // Success/Error/Warning colors
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'blue-glow': '0 0 15px rgba(59, 130, 246, 0.5)',
      },
      backgroundImage: {
        'gradient-blue-white': 'linear-gradient(135deg, #3b82f6 0%, #ffffff 100%)',
        'gradient-white-blue': 'linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      },
    },
  },
  plugins: [],
}
