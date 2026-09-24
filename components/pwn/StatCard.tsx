import { formatCount } from "@/components/pwn/format";

export function StatCard({ label, value, hint }: { label: string; value: number | null; hint?: string }) {
  const known = value !== null && value !== undefined;
  return (
    <article className="rounded-3xl border border-white/5 bg-bg-secondary/80 p-5 backdrop-blur-xl">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">{label}</h2>
      <p className="mt-3 font-display text-4xl font-black tracking-tight text-white" aria-label={known ? undefined : "sin dato"}>
        {known ? formatCount(value) : "—"}
      </p>
      {hint ? <p className="mt-2 text-xs text-gray-500">{hint}</p> : null}
    </article>
  );
}
