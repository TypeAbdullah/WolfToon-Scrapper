/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#0a0a0a",
        "surface-hover": "#141414",
        border: "#262626",
        vercel: {
          bg: "#000000",
          card: "#0a0a0a",
          border: "rgba(255, 255, 255, 0.08)",
          "border-hover": "rgba(255, 255, 255, 0.25)",
          text: "#ffffff",
          muted: "#888888",
          subtle: "#444444",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'vercel-glow': '0 0 40px -10px rgba(255, 255, 255, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
