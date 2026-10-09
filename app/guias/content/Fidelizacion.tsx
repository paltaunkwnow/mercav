import { BUSINESS_TYPES } from "@/lib/business/loyalty/templates";
import { FREE_LIMITS } from "@/lib/checkPlanLimit";
import { GuideList, GuideNote, GuideSection } from "../GuideShell";

const byKey = (key: string) => BUSINESS_TYPES.find((t) => t.key === key);
const stamps = BUSINESS_TYPES.filter((t) => t.type === "STAMPS");
const points = BUSINESS_TYPES.filter((t) => t.type === "POINTS");
const goalOf = (t: (typeof BUSINESS_TYPES)[number]) => (t.type === "STAMPS" ? `${t.goal} sellos` : `${t.goal} puntos`);
const list = (labels: string[]) => (labels.length < 2 ? labels.join("") : `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`);
const lower = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);

export function FidelizacionGuide() {
  const cafe = byKey("CAFE");
  const barber = byKey("BARBERIA");
  const carwash = byKey("LAVADERO");
  const restaurant = byKey("RESTAURANTE");
  const pointsSample = restaurant ?? points[0];

  return (
    <>
      <GuideSection title="Para qué sirve">
        <p>
          Una tarjeta de fidelización le da al cliente una razón concreta para volver: cada compra lo acerca a un premio. A vos te dice quién vuelve, cada cuánto y qué se lleva. Funciona igual para un café, una barbería o una farmacia; lo que cambia es cómo se suma y cuánto se pide.
        </p>
      </GuideSection>

      <GuideSection title="Sellos o puntos">
        <p>
          Con sellos, cada compra o visita suma uno, sin importar el monto. Sirve cuando las compras se parecen entre sí: un café, un corte, un lavado. Es lo más simple de explicar en el mostrador.
        </p>
        <p>
          Con puntos, el cliente suma según lo que gasta. Sirve cuando el ticket varía mucho, como en un restaurante o una farmacia, y así premiás más a quien más compra.
          {pointsSample?.unitAmount
            ? ` En el modelo de ${lower(pointsSample.label)}, se suma 1 punto cada ${pointsSample.unitAmount} de lo que se gasta y el premio llega a los ${pointsSample.goal} puntos, o sea, después de gastar ${pointsSample.goal * pointsSample.unitAmount}.`
            : null}
        </p>
        <GuideNote title="Una regla para elegir">
          <p>
            Si casi todos tus clientes gastan lo mismo en cada visita, usá sellos. Si un cliente puede gastar diez veces más que otro, usá puntos. De los {BUSINESS_TYPES.length} rubros que trae Mercav, {stamps.length} arrancan con sellos y {points.length} con puntos: {list(points.map((t) => lower(t.label)))}.
          </p>
        </GuideNote>
      </GuideSection>

      <GuideSection title="Cuánto pedir para el premio">
        <p>
          Cuanto más seguido vuelve el cliente, más alta puede ser la meta, porque la alcanza igual en un tiempo razonable.
          {cafe && barber && carwash
            ? ` Un café se toma seguido y admite ${cafe.goal} sellos; un corte de pelo es cada algunas semanas y pide ${barber.goal}; un lavado de auto, ${carwash.goal}.`
            : null}{" "}
          Una meta que nadie alcanza no fideliza a nadie: mejor empezar baja y subirla después que al revés.
        </p>
        <p>Así arranca cada rubro en Mercav. Son puntos de partida: la meta, el premio y el diseño se cambian cuando quieras.</p>
        <ul className="border-t-2 border-[var(--c-line)]">
          {BUSINESS_TYPES.map((t) => (
            <li key={t.key} className="flex items-baseline justify-between gap-4 border-b-2 border-[var(--c-line)] py-2.5 text-[1rem]">
              <span className="min-w-0">
                <span className="font-semibold text-[var(--c-text)]">{t.label}</span>
                <span className="block text-[0.95rem] text-[var(--c-muted)]">{t.rewardName}</span>
              </span>
              <span className="c-num shrink-0 text-right">
                {goalOf(t)}
                {t.type === "POINTS" && t.unitAmount ? <span className="block text-[0.9rem] text-[var(--c-muted)]">1 cada {t.unitAmount} gastados</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection title="Qué premio dar">
        <p>
          Lo que mejor funciona es algo de tu propio negocio que el cliente ya quiere: el café, el corte, el postre. Te cuesta menos de lo que vale para él y lo trae de vuelta una vez más. Un descuento también sirve, sobre todo en rubros con puntos.
        </p>
        <p>Además del premio principal, podés sumar:</p>
        <GuideList
          items={[
            "Un regalo de bienvenida cuando el cliente se suma.",
            "Un regalo de cumpleaños, que se le acredita solo.",
            "Un premio para quien trae a un amigo, cuando ese amigo suma por primera vez.",
            "Niveles según todo lo que el cliente sumó desde que tiene la tarjeta.",
            "Campañas: avisos y promociones para tus clientes, por ejemplo para los cumpleañeros del mes.",
          ]}
        />
      </GuideSection>

      <GuideSection title="Cómo se usa en el mostrador">
        <GuideList
          ordered
          items={[
            "Imprimís el cartel con el QR y lo dejás en el mostrador.",
            "El cliente lo escanea y su tarjeta queda en el navegador del celular. No baja nada ni necesita cuenta.",
            "En cada compra, vos o tu equipo le dan el sello o los puntos desde Sellar. También hay un modo mostrador para que lo haga el cliente.",
            "Cuando junta lo que pide el premio, lo canjea en el mostrador y se descuenta de su tarjeta.",
          ]}
        />
        <p>
          En el plan Gratis tenés {FREE_LIMITS.loyaltyProgramsPerWorkspace} programa de fidelización por empresa, con clientes sin límite.
        </p>
      </GuideSection>
    </>
  );
}
// creado por pato dev y askforvini
