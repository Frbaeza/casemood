// Íconos SVG en línea (sin librerías). Siempre se usan junto a un texto visible.
type Props = { className?: string };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconArrowLeft({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconChevronLeft({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconSearch({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconPhone({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M11 18h2" />
    </svg>
  );
}

export function IconChat({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z" />
      <path d="M9 10.5c.5 2 2 3.5 4.5 4.5" />
    </svg>
  );
}

/** Burbuja con auricular, al estilo del logo de WhatsApp. */
export function IconWhatsApp({ className }: Props) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M3.5 20.5l1.3-4.4A8.6 8.6 0 1 1 8 19.2z" />
      <path
        d="M9.1 7.9c-.4 0-.9.4-.9 1.2 0 2.8 3.9 6.8 6.7 6.8.8 0 1.2-.5 1.2-.9v-.8l-1.9-.9-.9.9c-1.2-.4-2.3-1.5-2.8-2.8l.9-.9-.9-1.9z"
        fill="currentColor"
        strokeWidth={1}
      />
    </svg>
  );
}

/** Cámara redondeada, al estilo del logo de Instagram. */
export function IconInstagram({ className }: Props) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconFilter({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function IconCheck({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Logo de Google a color (botones "Entrar con Google"). */
export function IconGoogle({ className }: Props) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function IconUser({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
