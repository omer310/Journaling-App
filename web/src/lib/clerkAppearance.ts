export const clerkAppearance = {
  variables: {
    colorPrimary: '#008C5E',
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(255, 255, 255, 0.08)',
    colorInputText: '#F8FAFC',
    colorText: '#F8FAFC',
    colorTextSecondary: '#94A3B8',
    colorDanger: '#EF4444',
    colorSuccess: '#22C55E',
    borderRadius: '0.75rem',
    fontFamily: 'var(--app-font, Inter), Inter, system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full',
    card: [
      'w-full max-w-md rounded-2xl border border-white/20 bg-black/75 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl',
      'dark:border-white/10 dark:bg-black/45',
    ].join(' '),
    headerTitle: 'text-3xl font-bold text-primary',
    headerSubtitle: 'text-secondary',
    socialButtonsBlockButton:
      'border-border/50 bg-white/10 text-text-primary hover:bg-white/15',
    socialButtonsBlockButtonText: 'font-medium',
    dividerLine: 'bg-border/60',
    dividerText: 'text-text-muted',
    formFieldLabel: 'text-text-primary',
    formFieldInput:
      'rounded-xl border-border bg-surface/60 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20',
    formButtonPrimary:
      'rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark hover:shadow-primary/30',
    footerActionText: 'text-secondary',
    footerActionLink: 'text-primary hover:text-primary-light',
    identityPreviewText: 'text-text-primary',
    identityPreviewEditButton: 'text-primary hover:text-primary-light',
    formResendCodeLink: 'text-primary hover:text-primary-light',
    otpCodeFieldInput:
      'rounded-lg border-border bg-surface/60 text-text-primary focus:border-primary',
    alert: 'rounded-xl border-border bg-surface text-text-primary',
  },
} as const;
