import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { FeatureGrid, MoreProducts, PricingBand, ProductFAQ, ProductHero } from "@/components/site/product/ProductBlocks";
import { CartelSection } from "@/components/site/cartel/primitives";
import { PARAMS_2025, PARAMS_2026, type PayrollParams } from "@/lib/business/bolivia/params";
import { payslipDemo } from "@/lib/business/bolivia/payslip-demo";
import { FREE_LIMITS } from "@/lib/checkPlanLimit";
import { formatMoney } from "@/lib/geo/latam";

const P: PayrollParams = PARAMS_2026;

export const metadata: Metadata = {
  title: `Planillas de sueldo en Bolivia ${P.year}: aportes, RC-IVA y antigüedad`,
  description: `Calculá la planilla de sueldos de Bolivia con las reglas de ${P.year}: salario mínimo, aportes a la Gestora, Aporte Nacional Solidario, RC-IVA, aportes patronales y bono de antigüedad. Exportás a Excel y cada trabajador ve su boleta.`,
};

const pct = (n: number) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(n * 100)} %`;
const bs = (n: number) => formatMoney(n, "BO").replace(/,00$/, "");

/** "texto — https://…" → texto y link, como vienen las fuentes de los parámetros. */
function Source({ value }: { value: string }) {
  const [text, url] = value.split(" — ");
  return (
    <>
      {text}
      {url ? (
        <>
          {" "}
          ·{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" className="c-link break-all">
            fuente
          </a>
        </>
      ) : null}
    </>
  );
}

function RuleGroup({ title, rows, note }: { title: string; rows: [string, string][]; note?: string }) {
  return (
    <section className="border-t-2 border-[var(--c-line)] py-7">
      <h3 className="c-h3">{title}</h3>
      <dl className="mt-4 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 text-[1rem]">
            <dt className="text-[var(--c-soft)]">{label}</dt>
            <dd className="c-num shrink-0 font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-3 text-[0.9rem] leading-snug text-[var(--c-muted)]">{note}</p> : null}
    </section>
  );
}

function PayslipDemoCard() {
  const payslip = payslipDemo();
  return (
    <figure className="w-full max-w-[24rem]">
      <div className="c-sticker c-inverse p-5 text-left sm:p-6" style={{ "--tilt": "2deg" } as CSSProperties}>
        <div className="flex items-center justify-between">
          <p className="c-label text-[1rem]">Boleta · octubre {P.year}</p>
          <span className="c-label rounded-full bg-[var(--c-green)] px-2 py-0.5 text-[0.85rem] text-[#0b0a09]">Calculada</span>
        </div>
        <dl className="mt-3 divide-y divide-[var(--c-line)] text-[0.92rem]">
          {payslip.rows.map((r) => (
            <div key={r.label} className={r.strong ? "flex justify-between gap-4 py-2 font-semibold" : "flex justify-between gap-4 py-2"}>
              <dt className={r.strong ? undefined : "text-[var(--c-soft)]"}>{r.short ?? r.label}</dt>
              <dd className="c-num whitespace-nowrap">{r.minus ? `− ${r.value}` : r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-1 flex items-end justify-between border-t-2 border-[var(--c-text)] pt-3">
          <span className="c-label text-[1rem]">Líquido pagable</span>
          <span className="c-display c-num text-[2.2rem] normal-case leading-none">{payslip.net}</span>
        </p>
      </div>
      <figcaption className="mt-4 text-center text-[0.85rem] leading-snug text-[var(--c-muted)]">{payslip.note}</figcaption>
    </figure>
  );
}

export default function PlanillasPage() {
  const g = P.gestora;
  const e = P.employer;
  const workerTotal = g.vejez + g.riesgoComun + g.comision + g.solidario;
  const employerTotal = e.cns + e.riesgoProfesional + e.patronalSolidario + e.vivienda;
  const sources = Object.entries(P.sources);

  return (
    <div className="cartel flex w-full flex-col overflow-x-clip">
      <ProductHero
        id="planillas-title"
        title={
          <>
            Planillas de sueldo <span className="c-text-yellow">en Bolivia, {P.year}.</span>
          </>
        }
        lead="Aportes a la Gestora, RC-IVA, bono de antigüedad y Aporte Nacional Solidario, calculados solos con las reglas del año. Exportás a Excel y PDF, y cada trabajador ve su boleta."
        demo={<PayslipDemoCard />}
      />

      <CartelSection labelledBy="planillas-reglas" className="!pt-8 md:!pt-12">
        <div className="c-container">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
            <h2 id="planillas-reglas" className="c-h2">
              Las reglas de {P.year}.
            </h2>
            <p className="c-lead lg:pb-2">Los valores con los que Mercav calcula cada planilla de Bolivia este año. La planilla guarda una copia: si cambian, las viejas no se tocan.</p>
          </div>
          <div className="mt-12 grid gap-x-14 border-b-2 border-[var(--c-line)] md:mt-16 md:grid-cols-2">
            <RuleGroup
              title="Salario mínimo nacional"
              rows={[
                [String(P.year), bs(P.smn)],
                [String(PARAMS_2025.year), bs(PARAMS_2025.smn)],
              ]}
            />
            <RuleGroup
              title="Aportes del trabajador"
              rows={[
                ["Vejez", pct(g.vejez)],
                ["Riesgo común", pct(g.riesgoComun)],
                ["Comisión de la Gestora", pct(g.comision)],
                ["Aporte solidario", pct(g.solidario)],
                ["Total a la Gestora", pct(workerTotal)],
              ]}
            />
            <RuleGroup
              title="Aporte Nacional Solidario"
              rows={P.ans.map((t) => [`Sobre lo que pasa de ${bs(t.over)}`, pct(t.rate)])}
              note="Solo para sueldos altos: se aplica sobre lo que supera cada tramo."
            />
            <RuleGroup
              title="RC-IVA"
              rows={[
                ["Alícuota", pct(P.rciva.rate)],
                ["Mínimo no imponible", `${P.rciva.minimumSmn} salarios mínimos (${bs(P.rciva.minimumSmn * P.smn)})`],
              ]}
              note="Las facturas que presenta el trabajador bajan lo que se retiene."
            />
            <RuleGroup
              title="Aportes del empleador"
              rows={[
                ["Caja Nacional de Salud", pct(e.cns)],
                ["Riesgo profesional", pct(e.riesgoProfesional)],
                ["Aporte Patronal Solidario", pct(e.patronalSolidario)],
                ["Vivienda", pct(e.vivienda)],
                ["Total", pct(employerTotal)],
              ]}
            />
            <RuleGroup
              title="Bono de antigüedad"
              rows={P.seniority.table.map((s) => [`Desde ${s.fromYears} años`, pct(s.rate)])}
              note={`Sobre ${P.seniority.baseSmnProductive} salarios mínimos en empresas productivas y ${P.seniority.baseSmnServices} en las de servicios.`}
            />
            <RuleGroup
              title="Horas extra, domingos y feriados"
              rows={[
                ["Recargo por hora extra", `${pct(P.overtimeSurcharge)} más`],
                ["Valor hora", `Sueldo ÷ ${P.monthHours} horas`],
                ["Domingo o feriado trabajado", "Se paga triple"],
              ]}
            />
            <RuleGroup
              title="Previsiones del mes"
              rows={[
                ["Aguinaldo", "Un doceavo del sueldo"],
                ["Indemnización", "Un doceavo del sueldo"],
              ]}
            />
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <section>
              <h3 className="c-label text-[1.2rem]">Fuentes</h3>
              <ul className="mt-4 grid gap-2.5 text-[0.95rem] leading-snug text-[var(--c-soft)]">
                {sources.map(([key, value]) => (
                  <li key={key}>
                    <Source value={value} />
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="c-label text-[1.2rem]">Para confirmar con tu contador</h3>
              <p className="mt-3 text-[0.95rem] leading-snug text-[var(--c-soft)]">Estos puntos tienen lecturas distintas según la fuente. La planilla los marca para que los revises.</p>
              <ul className="mt-4 grid gap-2.5 text-[0.95rem] leading-snug">
                {P.verify.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </CartelSection>

      <FeatureGrid
        id="planillas-funciones"
        title="Cerrá el mes sin planillas sueltas."
        items={[
          { title: "Calculada sola", body: "Cargás los días trabajados, las horas extra y los bonos, y la planilla hace los aportes, el RC-IVA y el líquido." },
          { title: "Excel y PDF", body: "Exportás la planilla a Excel y cada boleta a PDF." },
          { title: "Cada trabajador ve su boleta", body: "Tu equipo entra con su cuenta y ve sus boletas y su legajo desde el celular." },
          { title: "Datos cifrados", body: "El carnet y la cuenta bancaria de cada trabajador se guardan cifrados, y cada acción importante queda registrada." },
        ]}
      />
      <PricingBand free={`En el plan Gratis la planilla incluye hasta ${FREE_LIMITS.employeesPerWorkspace} trabajadores activos.`} />
      <ProductFAQ
        items={[
          { q: `¿Con qué reglas calcula la planilla de ${P.year}?`, a: `Con el salario mínimo de ${bs(P.smn)}, los aportes a la Gestora (${pct(workerTotal)}), el Aporte Nacional Solidario por tramos, el RC-IVA del ${pct(P.rciva.rate)} y el bono de antigüedad por años. Las fuentes están arriba.` },
          { q: "¿Sirve para otros países?", a: "Por ahora la planilla sigue las reglas de Bolivia. Los demás países llegan de a uno." },
          { q: "¿Puedo exportar a Excel?", a: "Sí. La planilla se exporta a Excel y cada boleta a PDF." },
          { q: "¿Mis trabajadores ven su boleta?", a: "Sí. Cada trabajador entra con su cuenta de Mercav y ve sus boletas y su legajo." },
        ]}
      />
      <MoreProducts current="/planillas" />
    </div>
  );
}
// creado por pato dev y askforvini
