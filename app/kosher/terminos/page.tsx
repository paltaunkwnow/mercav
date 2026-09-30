import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { KOSHER_TERMS } from "@/lib/legal/documents";

export const metadata = { title: "Términos" };

export default function KosherTermsPage() {
  return <LegalDocumentView doc={KOSHER_TERMS} />;
}
