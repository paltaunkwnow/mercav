import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";

/** Official name used in the governing-law clause. No statute numbers: they must be checked by a professional. */
const COUNTRY_NAMES: Record<string, string> = {
  Argentina: "la República Argentina",
  Bolivia: "el Estado Plurinacional de Bolivia",
  Brasil: "la República Federativa del Brasil",
  Chile: "la República de Chile",
  Colombia: "la República de Colombia",
  México: "los Estados Unidos Mexicanos",
  Paraguay: "la República del Paraguay",
  Perú: "la República del Perú",
  Uruguay: "la República Oriental del Uruguay",
};

function normalizeCountry(value: unknown) {
  const country = String(value || "");
  return country in COUNTRY_NAMES ? country : "Otro";
}

function jurisdictionClause(country: string) {
  const name = COUNTRY_NAMES[country];
  if (!name) {
    return `El presente contrato se regirá por las leyes del país que las partes indiquen de común acuerdo: [país]. Para cualquier controversia derivada de este acuerdo, las partes intentarán primero una solución amistosa o una mediación y, de no lograrla, se someterán a los tribunales competentes de la ciudad que las partes indiquen: [ciudad].`;
  }
  return `El presente contrato se regirá por las leyes de ${name}. Para cualquier controversia derivada de este acuerdo, las partes intentarán primero una solución amistosa o una mediación y, de no lograrla, se someterán a los tribunales competentes de la ciudad que las partes indiquen: [ciudad], en ${name}.`;
}

function buildFallbackContract(input: any) {
  const country = normalizeCountry(input.country);
  const legalContext = jurisdictionClause(country);

  return `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Conste por el presente documento el Contrato de Prestación de Servicios Profesionales Independientes que celebran por una parte y de manera voluntaria:

EL CLIENTE: ${input.clientName || "[nombre del cliente]"} (en adelante, "El Cliente")
EL FREELANCER: ${input.freelancerName || "[nombre del freelancer]"} (en adelante, "El Freelancer")

Ambas partes declaran contar con la capacidad legal y la personería necesarias para obligarse de conformidad con las siguientes cláusulas y declaraciones de ley:

DECLARACIONES:
I. Declara El Cliente que requiere los servicios especializados de El Freelancer para el desarrollo de actividades específicas dentro de su área de pericia, contando con los recursos suficientes para sufragar los honorarios correspondientes.
II. Declara El Freelancer ser un profesional independiente con amplia capacidad técnica, experiencia y equipamiento propio para realizar los servicios encomendados bajo su propia dirección y sin ningún tipo de relación de subordinación laboral.

CLÁUSULAS:

PRIMERA: OBJETO DEL SERVICIO
El objeto del presente contrato es la prestación de servicios profesionales por parte de El Freelancer a favor de El Cliente, consistentes específicamente en:
"${input.serviceDescription || "Desarrollo y entrega de servicios profesionales calificados"}"

SEGUNDA: PLAZO DE EJECUCIÓN Y ENTREGAS
El Freelancer se compromete a iniciar la ejecución de los servicios el día ${input.startDate || "de inicio de vigencia"} y a realizar la entrega final de los entregables acordados a más tardar el día ${input.deliveryDate || "pactado de conclusión"}, salvo caso fortuito, fuerza mayor o ampliaciones acordadas de mutuo acuerdo por escrito.

TERCERA: HONORARIOS Y FORMA DE PAGO
Como contraprestación por los servicios prestados, El Cliente se compromete a pagar a El Freelancer la suma total de:
${input.price || "0.00"} ${input.currency || "USD"}

El método de pago acordado por las partes es el siguiente:
"${input.paymentMethod || "50% de anticipo y 50% a la entrega y aceptación del proyecto"}"

CUARTA: REVISIONES Y MODIFICACIONES
El Freelancer incluirá un número máximo de hasta ${input.revisions || "2"} revisiones del trabajo entregado dentro de la tarifa original. Toda revisión adicional que exceda este número o represente un cambio sustancial del alcance original del proyecto será facturada a tarifa horaria regular previa aprobación de El Cliente.

QUINTA: CONFIDENCIALIDAD Y SECRETO PROFESIONAL
${input.confidentiality 
  ? `Las partes se obligan a mantener absoluta reserva y estricta confidencialidad sobre cualquier información técnica, financiera, comercial o datos sensibles de la otra parte recibidos en el marco de la ejecución de este contrato. Esta obligación subsistirá aún después de la finalización o terminación de la relación contractual.`
  : `Las partes acuerdan que el material generado no contiene cláusulas especiales de secreto profesional, pudiendo El Freelancer utilizar partes no sensibles del mismo para fines de portafolio previa notificación.`}

SEXTA: PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR
${input.ip 
  ? `Una vez liquidada la totalidad de los honorarios fijados en la Cláusula Tercera, El Freelancer cede de manera exclusiva e irrevocable todos los derechos patrimoniales de propiedad intelectual y explotación de los entregables a favor de El Cliente. El Freelancer conservará inalienablemente los derechos morales de autoría que por ley le correspondan.`
  : `El Freelancer conservará todos los derechos de propiedad intelectual y de explotación comercial sobre el material de base y los entregables desarrollados, otorgando a El Cliente una licencia de uso personal, no transferible e intransferible únicamente para los fines ordinarios de su negocio.`}

SÉPTIMA: LEY APLICABLE Y JURISDICCIÓN
${legalContext}

En señal de conformidad y para su fiel y estricto cumplimiento, las partes suscriben el presente contrato de forma digital a la fecha de su generación.`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const access = await checkToolAccess(user.id, "contract-generator");
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const body = await req.json();
    body.country = normalizeCountry(body.country);
    const prompt = [
      `Redactá en español un modelo de contrato de prestación de servicios profesionales entre un freelancer y un cliente, claro y formal.`,
      `Estructura: partes, declaraciones, objeto, plazo y entregas, honorarios y forma de pago, revisiones, confidencialidad, propiedad intelectual y ley aplicable y jurisdicción. Títulos de cláusula en mayúsculas ("PRIMERA: OBJETO DEL SERVICIO").`,
      `No cites números de leyes, artículos ni códigos. Para la cláusula de ley aplicable y jurisdicción usá textualmente: "${jurisdictionClause(body.country)}"`,
      `Usá solo los datos dados; si falta alguno, dejá un marcador entre corchetes. Datos: ${JSON.stringify(body)}.`,
    ].join("\n");

    let contractText = buildFallbackContract(body);
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
            max_tokens: 1800,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await response.json();
        contractText = data?.content?.[0]?.text || contractText;
      } catch (error) {
        console.warn("Claude contract generation failed, using fallback", error);
      }
    }

    await prisma.toolUsage.create({ data: { userId: user.id, toolName: "contract-generator", inputData: body, outputData: { contractText } } }).catch(() => {});

    return NextResponse.json({ success: true, data: { contractText } });
  } catch (error) {
    console.error("Contract generator error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
