/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media', // suit le réglage Apparence de l'iPhone, aucun bouton à prévoir
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chaque couleur lit une variable CSS définie dans index.css, qui
        // bascule automatiquement en mode sombre via prefers-color-scheme.
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        protein: 'rgb(var(--color-protein) / <alpha-value>)',
        carbs: 'rgb(var(--color-carbs) / <alpha-value>)',
        fat: 'rgb(var(--color-fat) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
