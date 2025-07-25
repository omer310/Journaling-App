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
      fontFamily: {
        handwriting: ['Indie Flower', 'Noto Naskh Arabic', 'system-ui'],
        arabic: ['Noto Naskh Arabic', 'system-ui'],
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.text-primary'),
            '[dir="rtl"]': {
              fontFamily: theme('fontFamily.arabic'),
            },
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.primary-dark'),
              },
            },
            h1: {
              color: theme('colors.text-primary'),
            },
            h2: {
              color: theme('colors.text-primary'),
            },
            h3: {
              color: theme('colors.text-primary'),
            },
            h4: {
              color: theme('colors.text-primary'),
            },
            strong: {
              color: theme('colors.text-primary'),
            },
            blockquote: {
              color: theme('colors.text-secondary'),
              borderLeftColor: theme('colors.border'),
            },
            code: {
              color: theme('colors.text-primary'),
              backgroundColor: theme('colors.surface-hover'),
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.surface'),
              color: theme('colors.text-primary'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;

export default config
