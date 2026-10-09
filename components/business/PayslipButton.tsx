"use client";

import { useState } from "react";
import { FileText, Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { downloadPayslip } from "./payslip";

export function PayslipButton(props: Parameters<typeof downloadPayslip>[0] & { label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadPayslip(props);
        } finally {
          setBusy(false);
        }
      }}
      className={buttonClass("secondary", "sm")}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
      {props.label ?? "Boleta PDF"}
    </button>
  );
}

// creado por pato dev y askforvini
