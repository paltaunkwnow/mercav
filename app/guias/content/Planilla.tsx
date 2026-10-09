import { PARAMS_2026, type PayrollParams } from "@/lib/business/bolivia/params";
import { computePayrollLine, type PayrollInput } from "@/lib/business/bolivia/payroll";
import { formatMoney } from "@/lib/geo/latam";
import { GuideList, GuideNote, GuideRows, GuideSection } from "../GuideShell";

const P: PayrollParams = PARAMS_2026;

const bs = (n: number) => formatMoney(n, "BO");
const bsRound = (n: number) => bs(n).replace(/,00$/, "");
const pct = (n: number) => `${new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(n * 100)} %`;
const num = (n: number) => new Intl.NumberFormat("es-BO").format(n);

/** El trabajador del ejemplo: todos los montos de la guía salen del motor de planillas con estos datos. */
const EXAMPLE: PayrollInput = {
  baseSalary: 6000,
  hireDate: "2022-06-01",
  productive: false,
  year: P.year,
  month: 10,
  daysWorked: 30,
  overtimeHours: 8,
  sundayHolidayDays: 0,
  otherBonuses: 0,
  advances: 0,
  otherDeductions: 0,
  rcivaCredit: 0,
};

/** Un sueldo alto, para mostrar el Aporte Nacional Solidario y el RC-IVA. */
const HIGH: PayrollInput = { ...EXAMPLE, baseSalary: 15000, overtimeHours: 0 };

function Source({ value }: { value: string }) {
  const [text, url] = value.split(" — ");
  return (
    <>
      {text}
      {url ? (
        <>
          {" "}
          ·{" "}
          <a href={url} target="_blank" rel="noopener noreferrer" className="c-link">
            fuente
          </a>
        </>
      ) : null}
    </>
  );
}

export function PlanillaGuide() {
  const r = computePayrollLine(EXAMPLE, P);
  const high = computePayrollLine(HIGH, P);
  const g = P.gestora;
  const e = P.employer;
  const gestoraRate = g.vejez + g.riesgoComun + g.comision + g.solidario;
  const employerRate = e.cns + e.riesgoProfesional + e.patronalSolidario + e.vivienda;
  const rcivaMinimum = P.rciva.minimumSmn * P.smn;
  // Con el 13 % del mínimo como crédito, el impuesto aparece recién cuando el sueldo neto pasa el doble del mínimo.
  const rcivaFrom = rcivaMinimum * 2;
  const seniorityBase = P.smn * P.seniority.baseSmnServices;
  const firstStep = P.seniority.table[0];

  return (
    <>
      <GuideSection title="Qué lleva la planilla">
        <p>
          Cada mes, por cada trabajador, la planilla de sueldos parte del total ganado, le resta los descuentos de ley y llega al líquido pagable, que es lo que cobra. Aparte, el empleador paga sus propios aportes y va guardando lo del aguinaldo y la indemnización.
        </p>
        <p>
          Esta guía usa las reglas de {P.year}: el salario mínimo nacional es de {bsRound(P.smn)} y el mes comercial tiene {P.monthDays} días. Todos los montos salen del mismo motor que calcula las planillas en Mercav.
        </p>
        <GuideNote title="El ejemplo">
          <p>
            Un trabajador de una empresa de servicios con un haber básico de {bsRound(EXAMPLE.baseSalary)}, {r.serviceYears} años de antigüedad, el mes completo trabajado y {EXAMPLE.overtimeHours} horas extra en octubre de {P.year}.
          </p>
        </GuideNote>
      </GuideSection>

      <GuideSection title="1. El total ganado">
        <p>
          El haber básico se paga por día: el jornal es el haber dividido entre {P.monthDays}, así que un mes completo es el haber entero. El valor de la hora es el haber dividido entre {P.monthHours} ({P.monthDays} días de 8 horas), y cada hora extra se paga con un recargo del {pct(P.overtimeSurcharge)}: el doble.
        </p>
        <p>
          El bono de antigüedad no se calcula sobre el sueldo sino sobre el salario mínimo: {P.seniority.baseSmnServices} salario mínimo en empresas de servicios y {P.seniority.baseSmnProductive} en las productivas. Arranca a los {firstStep.fromYears} años con el {pct(firstStep.rate)} y sube por tramos.
        </p>
        <GuideRows
          rows={[
            { label: `Haber básico (${EXAMPLE.daysWorked} días × ${bs(r.rates.daily)})`, value: bs(r.earned.basic) },
            { label: `Bono de antigüedad (${pct(r.seniorityRate)} de ${bsRound(seniorityBase)})`, value: bs(r.earned.seniority) },
            { label: `Horas extra (${EXAMPLE.overtimeHours} h × ${bs(r.rates.hourly)} × 2)`, value: bs(r.earned.overtime) },
            { label: "Total ganado", value: bs(r.earned.total), strong: true },
          ]}
        />
        <GuideRows
          title="Escala del bono de antigüedad, por años cumplidos"
          rows={P.seniority.table.map((step, i) => {
            const next = P.seniority.table[i + 1];
            return { label: next ? `De ${step.fromYears} a ${next.fromYears - 1} años` : `${step.fromYears} años o más`, value: pct(step.rate) };
          })}
        />
      </GuideSection>

      <GuideSection title="2. Los descuentos">
        <p>
          A todo trabajador se le descuenta el {pct(gestoraRate)} del total ganado para la Gestora: {pct(g.vejez)} para la jubilación, {pct(g.riesgoComun)} de riesgo común, {pct(g.comision)} de comisión y {pct(g.solidario)} de aporte solidario.
        </p>
        <GuideRows
          rows={[
            { label: `Vejez (${pct(g.vejez)})`, value: bs(r.deductions.gestora.vejez) },
            { label: `Riesgo común (${pct(g.riesgoComun)})`, value: bs(r.deductions.gestora.riesgoComun) },
            { label: `Comisión (${pct(g.comision)})`, value: bs(r.deductions.gestora.comision) },
            { label: `Aporte solidario (${pct(g.solidario)})`, value: bs(r.deductions.gestora.solidario) },
            { label: `Aportes a la Gestora (${pct(gestoraRate)})`, value: bs(r.deductions.gestora.total), strong: true },
          ]}
        />
        <p>
          El Aporte Nacional Solidario solo corre para los sueldos altos, y cada tramo cobra sobre lo que pasa de su límite:{" "}
          {P.ans.map((tier, i) => `${pct(tier.rate)} sobre lo que excede ${bsRound(tier.over)}${i < P.ans.length - 2 ? ", " : i === P.ans.length - 2 ? " y " : ""}`)}. Con {bsRound(r.earned.total)} de total ganado, el ejemplo no paga nada.
        </p>
        <p>
          El RC-IVA es el impuesto del {pct(P.rciva.rate)} sobre el sueldo neto (el total ganado menos los aportes). Se descuenta primero un mínimo de {P.rciva.minimumSmn} salarios mínimos ({bsRound(rcivaMinimum)}) y, además, el {pct(P.rciva.rate)} de ese mínimo se resta del impuesto. En la práctica, con las reglas de {P.year}, solo se retiene cuando el sueldo neto pasa de {bsRound(rcivaFrom)}. Las facturas que el trabajador presenta en el Formulario 110 bajan la retención en el {pct(P.rciva.rate)} de su monto.
        </p>
        <GuideRows
          title={`Con un haber de ${bsRound(HIGH.baseSalary)}`}
          caption={`Misma antigüedad: el total ganado es de ${bs(high.earned.total)} y el sueldo neto de ${bs(high.deductions.rciva.net)}.`}
          rows={[
            { label: `Aportes a la Gestora (${pct(gestoraRate)})`, value: bs(high.deductions.gestora.total) },
            { label: "Aporte Nacional Solidario", value: bs(high.deductions.ans) },
            { label: "RC-IVA retenido, sin facturas", value: bs(high.deductions.rciva.retained) },
            { label: "Total de descuentos", value: bs(high.deductions.total), strong: true },
          ]}
        />
      </GuideSection>

      <GuideSection title="3. El líquido pagable">
        <p>Es el total ganado menos los descuentos, los anticipos y cualquier otro descuento del mes. Es lo que se le deposita al trabajador y lo que figura en su boleta.</p>
        <GuideRows
          rows={[
            { label: "Total ganado", value: bs(r.earned.total) },
            { label: "Aportes a la Gestora", value: `− ${bs(r.deductions.gestora.total)}` },
            { label: "Aporte Nacional Solidario", value: `− ${bs(r.deductions.ans)}` },
            { label: "RC-IVA", value: `− ${bs(r.deductions.rciva.retained)}` },
            { label: "Líquido pagable", value: bs(r.netPay), strong: true },
          ]}
        />
      </GuideSection>

      <GuideSection title="4. Lo que paga el empleador">
        <p>
          Sobre el mismo total ganado, el empleador aporta el {pct(employerRate)}: {pct(e.cns)} a la Caja Nacional de Salud, {pct(e.riesgoProfesional)} de riesgo profesional, {pct(e.patronalSolidario)} de aporte patronal solidario y {pct(e.vivienda)} para vivienda. Además conviene apartar cada mes una doceava parte para el aguinaldo y otra para la indemnización.
        </p>
        <GuideRows
          rows={[
            { label: "Total ganado", value: bs(r.earned.total) },
            { label: `Aportes patronales (${pct(employerRate)})`, value: bs(r.employer.total) },
            { label: "Aguinaldo (1/12)", value: bs(r.provisions.aguinaldo) },
            { label: "Indemnización (1/12)", value: bs(r.provisions.indemnizacion) },
            { label: "Costo total del mes", value: bs(r.employerCost), strong: true },
          ]}
          caption={`Un haber de ${bsRound(EXAMPLE.baseSalary)} le cuesta a la empresa ${bs(r.employerCost)} en el mes, ${num(Math.round((r.employerCost / r.earned.total - 1) * 100))} % más que el total ganado.`}
        />
      </GuideSection>

      <GuideSection title="Lo que conviene confirmar con tu contador">
        <p>Estos puntos tienen lecturas distintas o vienen de fuentes secundarias. Mercav los marca en cada planilla para que los revise quien la firma.</p>
        <GuideList items={P.verify} />
      </GuideSection>

      <GuideSection title="Fuentes">
        <GuideList
          items={Object.entries(P.sources).map(([key, value]) => (
            <Source key={key} value={value} />
          ))}
        />
      </GuideSection>
    </>
  );
}
// creado por pato dev y askforvini
