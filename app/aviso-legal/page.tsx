import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { AVISO_LEGAL } from "@/lib/legal/documents";

export default function AvisoLegalPage() {
  return <LegalDocumentView doc={AVISO_LEGAL} />;
}
