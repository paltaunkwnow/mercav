import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { ACCEPTABLE_USE } from "@/lib/legal/documents";

export default function UsoAceptablePage() {
  return <LegalDocumentView doc={ACCEPTABLE_USE} />;
}
