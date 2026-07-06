import type { ArtKind } from "@/lib/data";

/**
 * Inline SVG line-art for appliances. Inherits color via currentColor so it
 * can be tinted per-context (hero, category tiles, product cards).
 */
export function ApplianceArt({
  kind,
  className,
}: {
  kind: ArtKind;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {art[kind]}
    </svg>
  );
}

const art: Record<ArtKind, React.ReactNode> = {
  ac: (
    <>
      <rect x="12" y="28" width="96" height="34" rx="8" />
      <line x1="20" y1="50" x2="100" y2="50" />
      <circle cx="96" cy="39" r="3" fill="currentColor" stroke="none" />
      <path d="M32 74c0 6 8 6 8 12s-8 6-8 12" opacity="0.6" />
      <path d="M56 74c0 6 8 6 8 12s-8 6-8 12" opacity="0.6" />
      <path d="M80 74c0 6 8 6 8 12s-8 6-8 12" opacity="0.6" />
    </>
  ),
  fridge: (
    <>
      <rect x="32" y="10" width="56" height="100" rx="8" />
      <line x1="32" y1="48" x2="88" y2="48" />
      <line x1="42" y1="24" x2="42" y2="38" />
      <line x1="42" y1="60" x2="42" y2="82" />
    </>
  ),
  cooler: (
    <>
      <rect x="26" y="16" width="68" height="88" rx="10" />
      <rect x="38" y="30" width="44" height="44" rx="22" />
      <circle cx="60" cy="52" r="6" fill="currentColor" stroke="none" />
      <line x1="60" y1="30" x2="60" y2="46" opacity="0.7" />
      <line x1="60" y1="58" x2="60" y2="74" opacity="0.7" />
      <line x1="38" y1="52" x2="54" y2="52" opacity="0.7" />
      <line x1="66" y1="52" x2="82" y2="52" opacity="0.7" />
      <line x1="38" y1="88" x2="82" y2="88" />
    </>
  ),
  tv: (
    <>
      <rect x="12" y="22" width="96" height="60" rx="6" />
      <path d="M46 96h28" />
      <path d="M60 82v14" />
      <path d="M34 52l12-12 10 16 12-20 14 16" opacity="0.7" />
    </>
  ),
  washing: (
    <>
      <rect x="24" y="14" width="72" height="92" rx="10" />
      <circle cx="60" cy="66" r="24" />
      <circle cx="60" cy="66" r="14" opacity="0.6" />
      <line x1="24" y1="34" x2="96" y2="34" />
      <circle cx="38" cy="24" r="3" fill="currentColor" stroke="none" />
      <circle cx="50" cy="24" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  freezer: (
    <>
      <rect x="10" y="38" width="100" height="56" rx="8" />
      <line x1="10" y1="56" x2="110" y2="56" />
      <line x1="46" y1="46" x2="74" y2="46" />
      <path d="M60 12v18M52 18l8-6 8 6M52 26l8 6 8-6" opacity="0.6" />
    </>
  ),
  fan: (
    <>
      <circle cx="60" cy="48" r="30" />
      <circle cx="60" cy="48" r="6" fill="currentColor" stroke="none" />
      <path d="M60 42c-8-10-4-20 6-20M66 52c12-2 16 8 10 16M52 50c-12 4-18-6-10-16" opacity="0.7" />
      <path d="M60 78v22M44 104h32" />
    </>
  ),
  microwave: (
    <>
      <rect x="12" y="30" width="96" height="60" rx="8" />
      <rect x="24" y="42" width="52" height="36" rx="4" />
      <line x1="88" y1="44" x2="98" y2="44" />
      <line x1="88" y1="56" x2="98" y2="56" />
      <circle cx="93" cy="74" r="5" />
    </>
  ),
  dispenser: (
    <>
      <rect x="34" y="30" width="52" height="80" rx="8" />
      <path d="M44 10h32l-4 20H48z" />
      <rect x="48" y="46" width="24" height="16" rx="3" opacity="0.7" />
      <circle cx="48" cy="78" r="4" />
      <circle cx="72" cy="78" r="4" />
    </>
  ),
  airfryer: (
    <>
      <path d="M36 20h48c4 0 8 4 8 8v64c0 10-8 18-18 18H46c-10 0-18-8-18-18V28c0-4 4-8 8-8z" />
      <path d="M36 52h48" />
      <rect x="46" y="62" width="28" height="10" rx="5" opacity="0.7" />
      <circle cx="60" cy="36" r="8" opacity="0.7" />
    </>
  ),
  hob: (
    <>
      <rect x="12" y="34" width="96" height="52" rx="8" />
      <circle cx="40" cy="60" r="14" />
      <circle cx="40" cy="60" r="6" opacity="0.6" />
      <circle cx="82" cy="60" r="14" />
      <circle cx="82" cy="60" r="6" opacity="0.6" />
    </>
  ),
  hood: (
    <>
      <path d="M40 16h40v22H40z" />
      <path d="M20 66l20-28h40l20 28z" />
      <rect x="20" y="66" width="80" height="14" rx="4" />
      <path d="M40 92c0 5 6 5 6 10M60 92c0 5 6 5 6 10M80 92c0 5 6 5 6 10" opacity="0.6" />
    </>
  ),
  oven: (
    <>
      <rect x="16" y="18" width="88" height="84" rx="8" />
      <line x1="16" y1="40" x2="104" y2="40" />
      <circle cx="30" cy="29" r="4" />
      <circle cx="46" cy="29" r="4" />
      <rect x="30" y="52" width="60" height="36" rx="4" />
      <line x1="30" y1="64" x2="90" y2="64" opacity="0.6" />
    </>
  ),
};
