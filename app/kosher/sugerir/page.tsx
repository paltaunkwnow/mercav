import type { Metadata } from "next";
import { SuggestPlaceForm } from "@/components/kosher/SuggestPlaceForm";
import { BackLink, PageIntro } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Sugerir un lugar" };

export default function KosherSuggestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/kosher/mapa">Mapa</BackLink>
      <PageIntro eyebrow="Sumá al atlas" title="Sugerir un lugar">
        <p>Entra como reporte comunitario y lo publica un moderador. Si tiene certificación, contanos la agencia y la revisamos con ella.</p>
      </PageIntro>
      <SuggestPlaceForm />
    </div>
  );
}
