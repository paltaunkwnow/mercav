import type { Metadata } from "next";
import { SuggestPlaceForm } from "@/components/kosher/SuggestPlaceForm";

export const metadata: Metadata = { title: "Sugerir un lugar" };

export default function KosherSuggestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">Sugerir un lugar</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Entra como reporte comunitario y lo publica un moderador. Si tiene certificación, contanos la agencia y la revisamos.
        </p>
      </header>
      <SuggestPlaceForm />
    </div>
  );
}
