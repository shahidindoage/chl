/**
 * The pulsing-dot + uppercase-tracked section label repeated across every
 * section of the homepage design reference.
 */
export function SectionEyebrow({ label, id }: { label: string; id?: string }) {
  return (
    <div className="inline-flex items-center gap-2.5" id={id}>
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch-orange-dark opacity-75 duration-1000" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch-orange-dark shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-orange-dark sm:text-sm">
        {label}
      </span>
    </div>
  );
}
