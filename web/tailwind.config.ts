import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        border: 'var(--border)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: 'var(--text-primary)',
            a: {
              color: 'var(--primary)',
              '&:hover': {
                color: 'var(--primary-dark)',
              },
            },
            h1: {
              color: 'var(--text-primary)',
            },
            h2: {
              color: 'var(--text-primary)',
            },
            h3: {
              color: 'var(--text-primary)',
            },
            h4: {
              color: 'var(--text-primary)',
            },
            strong: {
              color: 'var(--text-primary)',
            },
            blockquote: {
              color: 'var(--text-secondary)',
              borderLeftColor: 'var(--border)',
            },
            code: {
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-hover)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;

export default config
