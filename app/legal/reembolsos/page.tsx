import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { REFUNDS } from "@/lib/legal/documents";

export default function ReembolsosPage() {
  return <LegalDocumentView doc={REFUNDS} />;
}
