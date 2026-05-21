/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "hsl(var(--surface-base) / <alpha-value>)",
          raised: "hsl(var(--surface-raised) / <alpha-value>)",
          overlay: "hsl(var(--surface-overlay) / <alpha-value>)",
          sunken: "hsl(var(--surface-sunken) / <alpha-value>)",
          presentation: "hsl(var(--surface-presentation) / <alpha-value>)",
          print: "hsl(var(--surface-print) / <alpha-value>)",
        },
        text: {
          primary: "hsl(var(--text-primary) / <alpha-value>)",
          secondary: "hsl(var(--text-secondary) / <alpha-value>)",
          subtle: "hsl(var(--text-subtle) / <alpha-value>)",
          "on-accent": "hsl(var(--text-on-accent) / <alpha-value>)",
          presentation: "hsl(var(--text-presentation) / <alpha-value>)",
          print: "hsl(var(--text-print) / <alpha-value>)",
        },
        accent: {
          primary: "hsl(var(--accent-primary) / <alpha-value>)",
          "primary-hover": "hsl(var(--accent-primary-hover) / <alpha-value>)",
          success: "hsl(var(--accent-success) / <alpha-value>)",
          warning: "hsl(var(--accent-warning) / <alpha-value>)",
          danger: "hsl(var(--accent-danger) / <alpha-value>)",
          info: "hsl(var(--accent-info) / <alpha-value>)",
        },
        border: {
          default: "hsl(var(--border-default) / <alpha-value>)",
          subtle: "hsl(var(--border-subtle) / <alpha-value>)",
          strong: "hsl(var(--border-strong) / <alpha-value>)",
          print: "hsl(var(--border-print) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      fontSize: {
        display: ["var(--font-size-display)", { lineHeight: "1.1", fontWeight: "850" }],
        h1: ["var(--font-size-h1)", { lineHeight: "1.2", fontWeight: "800" }],
        h2: ["var(--font-size-h2)", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["var(--font-size-h3)", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["var(--font-size-h4)", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["var(--font-size-body)", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["var(--font-size-caption)", { lineHeight: "1.4", fontWeight: "500" }],
        "presentation-title": ["3.5rem", { lineHeight: "1.1", fontWeight: "850" }],
        "presentation-question": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
