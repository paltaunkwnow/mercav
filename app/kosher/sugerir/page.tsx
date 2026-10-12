import type { Metadata } from "next";
import { SuggestPlaceForm } from "@/components/kosher/SuggestPlaceForm";
import { BackLink, PageIntro } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Sugerir un lugar" };

export default function KosherSuggestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/kosher/mapa">Mapa</BackLink>
      <PageIntro title="Sugerir un lugar">
        <p>
          Contanos lo que sabés del lugar y lo revisa un moderador antes de publicarlo. Si tiene certificación, decinos la agencia y la verificamos con
          ella.
        </p>
      </PageIntro>
      <SuggestPlaceForm />
    </div>
  );
}
// creado por pato dev y askforvini
