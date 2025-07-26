/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chat-specific colors
        'chat-user': '#007AFF',
        'chat-assistant': '#34C759',
        'chat-bg': '#F2F2F7',
        'chat-bubble-user': '#007AFF',
        'chat-bubble-assistant': '#E9E9EB',
        'chat-text-user': '#FFFFFF',
        'chat-text-assistant': '#000000',
      },
      animation: {
        'chat-fade-in': 'chatFadeIn 0.3s ease-out',
        'chat-slide-up': 'chatSlideUp 0.3s ease-out',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        chatFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        chatSlideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        typing: {
          '0%, 60%, 100%': { opacity: '0' },
          '30%': { opacity: '1' },
        }
      },
      spacing: {
        'chat-padding': '1rem',
        'bubble-padding': '0.75rem',
      },
      borderRadius: {
        'chat-bubble': '1.125rem',
      },
      maxWidth: {
        'chat-bubble': '70%',
      },
      fontSize: {
        'chat': '0.9375rem',
      },
      boxShadow: {
        'chat': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'chat-input': '0 -1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}