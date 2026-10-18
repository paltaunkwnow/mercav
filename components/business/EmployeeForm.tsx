"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import type { EmployeeView } from "@/lib/business/employees";
import { CONTRACT_LABELS } from "@/lib/business/format";
import { idLabels } from "@/lib/business/countries";
import { latamCountry } from "@/lib/geo/latam";
import { sendJson } from "@/lib/business/client";
import { Field } from "./ui";

const BO_EXT = ["SC", "LP", "CB", "CH", "PT", "OR", "TJ", "BE", "PD"];

function normalizeDateStr(val: unknown): string {
  if (typeof val !== "string") return "";
  const s = val.trim();
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
}

export function EmployeeForm({ slug, country, employee }: { slug: string; country: string; employee?: EmployeeView }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const labels = idLabels(country);
  const currency = latamCountry(country).currency;
  const s = employee?.sensitive;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, string> = Object.fromEntries(
      ["firstName", "lastName", "ci", "ciExt", "birthDate", "sex", "nationality", "email", "phone", "position", "hireDate", "contractType", "baseSalary", "bankName", "bankAccount", "nua", "cnsNumber", "notes"].map((k) => [k, String(f.get(k) ?? "")]),
    );
    if (body.hireDate) body.hireDate = normalizeDateStr(body.hireDate);
    if (body.birthDate) body.birthDate = normalizeDateStr(body.birthDate);
    setBusy(true);
    setError(null);
    const res = employee
      ? await sendJson(`/api/business/${slug}/employees/${employee.id}`, "PUT", body)
      : await sendJson<{ id: string }>(`/api/business/${slug}/employees`, "POST", body);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const id = employee?.id ?? (res.data as { id: string }).id;
    router.push(`/business/${slug}/trabajadores/${id}`);
    router.refresh();
  }

  const section = "font-display text-base font-semibold text-[var(--text-primary)] sm:col-span-2";

  return (
    <form onSubmit={onSubmit} className="mv-panel grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
      <h2 className={section}>Datos personales</h2>
      <Field label="Nombres" htmlFor="e-first">
        <input id="e-first" name="firstName" required maxLength={80} defaultValue={employee?.firstName} className="mv-input h-11" autoComplete="off" />
      </Field>
      <Field label="Apellidos" htmlFor="e-last">
        <input id="e-last" name="lastName" required maxLength={80} defaultValue={employee?.lastName} className="mv-input h-11" autoComplete="off" />
      </Field>
      <Field
        label={labels.document}
        htmlFor="e-ci"
        hint={s?.ciUnreadable ? "Hay un documento guardado que no se pudo leer. Si lo dejás vacío, se conserva." : "Se guarda cifrado."}
      >
        <input id="e-ci" name="ci" maxLength={20} defaultValue={s?.ci ?? ""} className="mv-input h-11" autoComplete="off" />
      </Field>
      {labels.documentExt ? (
        <Field label={labels.documentExt} htmlFor="e-ciext">
          <select id="e-ciext" name="ciExt" defaultValue={s?.ciExt ?? ""} className="mv-input h-11">
            <option value="">—</option>
            {BO_EXT.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="ciExt" value="" />
      )}
      <Field label="Fecha de nacimiento" htmlFor="e-birth">
        <input id="e-birth" name="birthDate" type="date" defaultValue={s?.birthDate ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Sexo" htmlFor="e-sex" hint="Lo pide la planilla del Ministerio de Trabajo.">
        <select id="e-sex" name="sex" defaultValue={s?.sex ?? ""} className="mv-input h-11">
          <option value="">—</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
        </select>
      </Field>
      <Field label="Nacionalidad" htmlFor="e-nat">
        <input id="e-nat" name="nationality" maxLength={40} defaultValue={s?.nationality ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Teléfono" htmlFor="e-phone">
        <input id="e-phone" name="phone" type="tel" maxLength={30} defaultValue={s?.phone ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Correo" htmlFor="e-email" className="sm:col-span-2">
        <input id="e-email" name="email" type="email" maxLength={120} defaultValue={s?.email ?? ""} className="mv-input h-11" />
      </Field>

      <h2 className={`${section} mt-2`}>Trabajo</h2>
      <Field label="Cargo" htmlFor="e-pos">
        <input id="e-pos" name="position" maxLength={80} defaultValue={employee?.position ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Fecha de ingreso" htmlFor="e-hire">
        <input id="e-hire" name="hireDate" type="date" required defaultValue={employee?.hireDate ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Tipo de contrato" htmlFor="e-contract">
        <select id="e-contract" name="contractType" defaultValue={employee?.contractType ?? "INDEFINIDO"} className="mv-input h-11">
          {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Haber básico mensual (${currency})`} htmlFor="e-salary">
        <input id="e-salary" name="baseSalary" type="number" min={0} step="0.01" required defaultValue={s?.baseSalary ?? ""} className="mv-input h-11 tabular-nums" inputMode="decimal" />
      </Field>

      <h2 className={`${section} mt-2`}>Seguridad social y pago</h2>
      <Field label={labels.pension} htmlFor="e-nua">
        <input id="e-nua" name="nua" maxLength={20} defaultValue={s?.nua ?? ""} className="mv-input h-11" />
      </Field>
      <Field label={labels.health} htmlFor="e-cns">
        <input id="e-cns" name="cnsNumber" maxLength={30} defaultValue={s?.cnsNumber ?? ""} className="mv-input h-11" />
      </Field>
      <Field label="Banco" htmlFor="e-bank">
        <input id="e-bank" name="bankName" maxLength={60} defaultValue={s?.bankName ?? ""} className="mv-input h-11" />
      </Field>
      <Field
        label="Nº de cuenta"
        htmlFor="e-account"
        hint={s?.bankUnreadable ? "Hay una cuenta guardada que no se pudo leer. Si la dejás vacía, se conserva." : "Se guarda cifrado."}
      >
        <input id="e-account" name="bankAccount" maxLength={40} defaultValue={s?.bankAccount ?? ""} className="mv-input h-11" autoComplete="off" />
      </Field>
      <Field label="Notas internas" htmlFor="e-notes" className="sm:col-span-2">
        <textarea id="e-notes" name="notes" maxLength={1000} rows={3} defaultValue={s?.notes ?? ""} className="mv-input py-2.5" />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" disabled={busy} className={buttonClass("primary", "md")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {employee ? "Guardar cambios" : "Agregar trabajador"}
        </button>
        <button type="button" onClick={() => router.back()} className={buttonClass("ghost", "md")}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
// creado por pato dev y askforvini
