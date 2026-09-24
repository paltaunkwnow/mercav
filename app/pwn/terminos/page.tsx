import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { PWN_TERMS } from "@/lib/legal/documents";

export default function PwnTermsPage() {
  return <LegalDocumentView doc={PWN_TERMS} />;
}
