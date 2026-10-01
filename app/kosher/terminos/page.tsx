import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { KOSHER_TERMS } from "@/lib/legal/documents";

export const metadata = { title: "Términos" };

export default function KosherTermsPage() {
  // The Kosher shell already clears the floating header, so the legal hero only needs a short top margin here.
  return (
    <div className="[&_article>header]:!pt-10 md:[&_article>header]:!pt-14">
      <LegalDocumentView doc={KOSHER_TERMS} />
    </div>
  );
}
