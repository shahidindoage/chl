import type { CSSProperties } from "react";

/**
 * Team crests ported from the homepage design reference.
 *
 * The design hardcoded a `badgeType` union of its 7 mock franchises, which
 * cannot work here because teams come from the database and users can create
 * new ones. So instead we match a crest by slugging the team name's first
 * word, and fall back to a generated shield using the team's real `color1`
 * when no crest matches (or when a team has uploaded a logo).
 */

type CrestKey =
  | "raipur"
  | "bhilai"
  | "durg"
  | "korba"
  | "jagdalpur"
  | "rajnandgaon"
  | "bastar";

const CREST_SLUGS: Record<string, CrestKey> = {
  raipur: "raipur",
  bhilai: "bhilai",
  durg: "durg",
  korba: "korba",
  jagdalpur: "jagdalpur",
  rajnandgaon: "rajnandgaon",
  bastar: "bastar",
};

const SIZE_CLASSES = {
  sm: "h-6 w-6",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const;

export type CrestSize = keyof typeof SIZE_CLASSES;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

/** Matches the first word of the name, then the short name. */
export function resolveCrest(name: string, shortName: string): CrestKey | null {
  const fromName = slugify(name.split(/\s+/)[0] ?? "");
  if (CREST_SLUGS[fromName]) return CREST_SLUGS[fromName];
  const fromShort = slugify(shortName);
  if (CREST_SLUGS[fromShort]) return CREST_SLUGS[fromShort];
  return null;
}

export interface TeamCrestProps {
  name: string;
  shortName: string;
  color1?: string | null;
  logo?: string | null;
  size?: CrestSize;
  className?: string;
}

export function TeamCrest({ name, shortName, color1, logo, size = "md", className = "" }: TeamCrestProps) {
  const dimension = SIZE_CLASSES[size];
  const frame = `relative inline-flex shrink-0 items-center justify-center ${dimension} ${className}`;

  // A team-supplied logo always wins: it is the real, owner-managed asset.
  if (logo) {
    return (
      <span className={frame} title={name}>
        <img src={logo} alt={name} className="h-full w-full object-contain" loading="lazy" />
      </span>
    );
  }

  const crest = resolveCrest(name, shortName);
  if (crest) {
    return (
      <span className={frame} title={name}>
        <CrestArt crest={crest} />
      </span>
    );
  }

  return (
    <span className={frame} title={name}>
      <FallbackCrest name={name} shortName={shortName} color={color1 ?? "#0c233c"} />
    </span>
  );
}

function CrestArt({ crest }: { crest: CrestKey }) {
  switch (crest) {
    case "raipur":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="#15803d" stroke="#f59e0b" strokeWidth="4" />
          <circle cx="50" cy="50" r="38" fill="#14532d" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 28 72 L 68 28 C 72 24 78 28 75 33 L 34 76 Z" fill="#ffffff" />
          <path d="M 72 72 L 32 28 C 28 24 22 28 25 33 L 66 76 Z" fill="#ffffff" />
          <circle cx="50" cy="48" r="9" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
          <path d="M 26 56 C 24 64 32 74 50 78 C 68 74 76 64 74 56 C 70 66 58 72 50 72 C 42 72 30 66 26 56 Z" fill="#f59e0b" />
        </svg>
      );
    case "bhilai":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <path d="M 50 6 L 86 18 C 86 64 68 86 50 94 C 32 86 14 64 14 18 Z" fill="#1e40af" stroke="#60a5fa" strokeWidth="3" />
          <path d="M 50 14 L 80 24 C 80 60 64 80 50 88 C 36 80 20 60 20 24 Z" fill="#1e3a8a" />
          <polygon points="53,20 34,48 49,48 44,78 68,44 52,44" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="4" fill="#ffffff" />
        </svg>
      );
    case "durg":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <path d="M 50 8 L 88 20 C 88 64 68 86 50 94 C 32 86 12 64 12 20 Z" fill="#ea580c" stroke="#fed7aa" strokeWidth="3" />
          <path d="M 50 16 L 80 26 C 80 60 64 78 50 86 C 36 78 20 60 20 26 Z" fill="#9a3412" />
          <path d="M 28 66 L 68 26 C 72 22 78 26 75 30 L 34 70 Z" fill="#fed7aa" />
          <path d="M 72 66 L 32 26 C 28 22 22 26 25 30 L 66 70 Z" fill="#fed7aa" />
          <path d="M 42 36 L 50 24 L 58 36 L 50 42 Z" fill="#ffffff" />
          <rect x="42" y="46" width="16" height="14" rx="2" fill="#1f2937" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    case "korba":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#ea580c" strokeWidth="4" />
          <circle cx="50" cy="50" r="38" fill="#c2410c" />
          <polygon points="26,30 36,46 22,48" fill="#0f172a" />
          <polygon points="74,30 64,46 78,48" fill="#0f172a" />
          <path d="M 38 28 L 50 36 L 62 28 L 50 32 Z" fill="#0f172a" />
          <path d="M 32 44 L 44 48 L 30 54 Z" fill="#0f172a" />
          <path d="M 68 44 L 56 48 L 70 54 Z" fill="#0f172a" />
          <polygon points="36,52 44,52 42,56" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
          <polygon points="64,52 56,52 58,56" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
          <polygon points="46,62 54,62 50,68" fill="#0f172a" />
          <polygon points="44,68 47,76 50,70" fill="#ffffff" />
          <polygon points="56,68 53,76 50,70" fill="#ffffff" />
        </svg>
      );
    case "jagdalpur":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="#14532d" stroke="#22c55e" strokeWidth="4" />
          <circle cx="50" cy="50" r="38" fill="#166534" stroke="#86efac" strokeWidth="1" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="4 2" />
          <path d="M 50 20 L 55 36 L 50 32 L 45 36 Z" fill="#ffffff" />
          <line x1="50" y1="30" x2="50" y2="68" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M 28 66 L 40 56 L 36 54 L 32 58 Z" fill="#ffffff" />
          <line x1="34" y1="58" x2="62" y2="38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="50" r="6" fill="#facc15" />
        </svg>
      );
    case "rajnandgaon":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <path d="M 50 8 L 86 20 C 86 64 68 86 50 94 C 32 86 14 64 14 20 Z" fill="#581c87" stroke="#c084fc" strokeWidth="3" />
          <path d="M 50 16 L 78 26 C 78 58 64 78 50 86 C 36 78 22 58 22 26 Z" fill="#3b0764" />
          <path d="M 32 60 L 30 40 L 40 50 L 50 32 L 60 50 L 70 40 L 68 60 Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="30" cy="38" r="2.5" fill="#ef4444" />
          <circle cx="50" cy="30" r="3" fill="#ffffff" />
          <circle cx="70" cy="38" r="2.5" fill="#ef4444" />
          <rect x="32" y="62" width="36" height="5" rx="2" fill="#d97706" />
        </svg>
      );
    case "bastar":
      return (
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
          <path d="M 50 6 L 86 18 C 86 64 68 86 50 94 C 32 86 14 64 14 18 Z" fill="#991b1b" stroke="#f87171" strokeWidth="3" />
          <path d="M 50 14 L 78 24 C 78 58 64 78 50 86 C 36 78 22 58 22 24 Z" fill="#7f1d1d" />
          <path d="M 28 34 C 32 20 44 26 50 36 C 56 26 68 20 72 34 C 64 36 58 46 50 48 C 42 46 36 36 28 34 Z" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="50" y1="22" x2="50" y2="76" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <polygon points="50,18 44,28 56,28" fill="#facc15" />
          <circle cx="50" cy="58" r="6" fill="#f87171" stroke="#ffffff" strokeWidth="2" />
        </svg>
      );
  }
}

function FallbackCrest({ name, shortName, color }: { name: string; shortName: string; color: string }) {
  const initials = (shortName || name.replace(/[^A-Za-z]/g, "").slice(0, 3))
    .slice(0, 3)
    .toUpperCase();
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <path
        d="M 50 6 L 86 18 C 86 64 68 86 50 94 C 32 86 14 64 14 18 Z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="4"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="34"
        fontWeight="800"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        style={{ paintOrder: "stroke" } as CSSProperties}
      >
        {initials}
      </text>
    </svg>
  );
}
