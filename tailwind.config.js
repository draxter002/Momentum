/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        shameful: '#6B7280',
        blocked: '#E5E7EB',
      },
    },
  },
  plugins: [],
}
