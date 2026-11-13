// Firma del estudio: va al final de cada proyecto (regla de KaiZen, 13-nov-2026).
// Wordmark ΚΛΙΖΣΝ en trazo, toma el color del texto donde se ponga.
export default function KaizenCredito({ style, className }) {
  return (
    <a
      href="https://kaizenstudiomx.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Developed by KaiZen"
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em', color: 'inherit', textDecoration: 'none', letterSpacing: '0.04em', fontSize: '0.85rem', opacity: 0.8, ...style }}
    >
      Developed by
      <svg viewBox="-8 -10 498 120" height="10" width={(10 * 498) / 120} aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="15" strokeLinejoin="miter">
          <path d="M7 0V100 M66 0 12 54 M30 37 70 100" />
          <path d="M92 100 132 6 172 100" />
          <path d="M201 0V100" />
          <path d="M230 7H300L230 93H300" />
          <path d="M388 7H322L360 50 322 93H388" />
          <path d="M417 100V7L473 93V0" />
        </g>
      </svg>
    </a>
  );
}
