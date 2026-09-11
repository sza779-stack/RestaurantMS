/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",
        warning: "hsl(var(--warning))",
        destructive: "hsl(var(--destructive))",
        card: "hsl(var(--card))",
        kitchen: {
          pending: '#f59e0b',
          cooking: '#3b82f6',
          ready: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
