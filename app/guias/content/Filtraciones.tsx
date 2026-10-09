import { nextStepsForDataTypes } from "@/lib/pwn/next-steps";
import { PWN_FEED_SOURCES } from "@/lib/integrations/pwn/feed-catalog";
import { GuideList, GuideNote, GuideSection } from "../GuideShell";

/** Todos los tipos de dato con pasos sugeridos: la guía muestra los mismos pasos que Pwn da en cada resultado. */
const ALL_STEPS = nextStepsForDataTypes(["Passwords", "Phone numbers", "Credit cards", "Government issued IDs", "Physical addresses", "Email addresses"]);

export function FiltracionesGuide() {
  return (
    <>
      <GuideSection title="Qué es una filtración">
        <p>
          Una filtración es cuando los datos de un servicio quedan expuestos y circulan: correos, contraseñas, teléfonos, direcciones. Casi nunca la sufre tu negocio directamente. Lo más común es que un empleado use su correo de trabajo en otro servicio, ese servicio se filtre, y la misma contraseña abra también la cuenta de la empresa.
        </p>
        <p>
          Por eso conviene revisar cada tanto los correos de tu equipo y el dominio de tu empresa contra los catálogos públicos de filtraciones conocidas, como Have I Been Pwned.
        </p>
      </GuideSection>

      <GuideSection title="1. Revisá los correos de tu equipo">
        <p>
          En Mercav Pwn escribís un correo y lo consulta contra Have I Been Pwned. De entrada te dice si aparece y en cuántas filtraciones.
        </p>
        <p>
          Para ver en cuáles y qué datos se expusieron, Mercav te pide comprobar que el correo es tuyo: si es el de tu cuenta queda verificado al toque; si no, te llega un enlace de confirmación a ese buzón. Así nadie puede ver el detalle del correo de otra persona.
        </p>
      </GuideSection>

      <GuideSection title="2. Revisá el dominio de tu empresa">
        <p>
          Si escribís el dominio, por ejemplo tuempresa.com, ves las filtraciones del catálogo público que lo involucran. Para ver qué cuentas @tuempresa.com aparecieron y recibir alertas, tenés que verificar el dominio con un registro TXT en su DNS.
        </p>
        <GuideNote title="Una vez verificado">
          <p>Los dominios se revisan solos cada hora. Cuando aparece algo nuevo, Pwn te deja una alerta con la severidad, el objetivo y la fuente.</p>
        </GuideNote>
      </GuideSection>

      <GuideSection title="3. Comprobá una contraseña sin mandarla">
        <p>
          Pwn también te dice si una contraseña aparece en filtraciones conocidas, sin que salga de tu celular o tu computadora. El navegador calcula su hash, manda solo los primeros 5 caracteres y compara el resto ahí mismo. La contraseña no se envía ni se guarda.
        </p>
      </GuideSection>

      <GuideSection title="Qué hacer si aparecés">
        <p>Depende de qué datos se filtraron. Estos son los pasos que Pwn sugiere en cada resultado, de lo más urgente a lo menos:</p>
        {ALL_STEPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-3">
            <h3 className="font-semibold text-[var(--c-text)]">{group.title}</h3>
            <GuideList items={group.items} />
          </div>
        ))}
      </GuideSection>

      <GuideSection title="Seguí las vulnerabilidades que se están explotando">
        <p>
          Además de las filtraciones, Pwn busca cualquier CVE en la base de vulnerabilidades del NIST (NVD) y marca si figura en el catálogo KEV de CISA, que lista las que ya se están explotando. Si usás un sistema con una vulnerabilidad en ese catálogo, ese parche va primero.
        </p>
      </GuideSection>

      <GuideSection title="De dónde sale la información">
        <p>
          Pwn sigue {PWN_FEED_SOURCES.length} fuentes públicas y con nombre: catálogos de filtraciones, medios de seguridad y registros de ransomware. Cada hallazgo cita su fuente y muestra si está verificado. Lo que solo se afirma en un foro se presenta como no verificado, y de los foros se guardan metadatos, nunca los datos filtrados.
        </p>
      </GuideSection>
    </>
  );
}
// creado por pato dev y askforvini
