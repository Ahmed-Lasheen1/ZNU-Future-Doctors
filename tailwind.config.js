/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/components/ui/**/*.{ts,tsx}',
    './src/components/pulse/**/*.{js,jsx,ts,tsx}',
    './src/pages/Auth.tsx',
    './src/pages/ResetPassword.tsx',
    './src/lib/**/*.{ts,tsx}',
  ],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))' },
        'chart-1': 'hsl(var(--chart-1))',
        'chart-3': 'hsl(var(--chart-3))',
        'chart-4': 'hsl(var(--chart-4))',
        'chart-5': 'hsl(var(--chart-5))',
      },
    },
  },
  plugins: [],
}
