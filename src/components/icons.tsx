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
