import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";

function buildFallbackContract(input: any) {
  const country = input.country || "Bolivia";
  let legalContext = "";
  
  if (country === "Bolivia") {
    legalContext = `Código Civil de la República de Bolivia (específicamente los Artículos 732 y siguientes que regulan el Contrato de Obra y de Servicios, así como el Artículo 450 y Artículo 519 sobre la obligatoriedad y fuerza de ley de los contratos), las disposiciones sobre propiedad intelectual de la Ley N° 1322 de Derecho de Autor, y para la resolución de cualquier controversia, las partes se someten de común acuerdo a la Ley N° 708 de Conciliación y Arbitraje de Bolivia.`;
  } else if (country === "Argentina") {
    legalContext = `Código Civil y Comercial de la Nación Argentina (Ley N° 26.994, específicamente el Artículo 1251 y concordantes relativos al Contrato de Obra y de Servicios, el Artículo 957 de noción de contrato y Artículo 959 de efecto vinculante), las normas sobre propiedad intelectual contenidas en la Ley N° 11.723, de aplicación en todo el territorio de la República Argentina.`;
  } else if (country === "Chile") {
    legalContext = `Código Civil de la República de Chile (particularmente los Artículos 2006 y siguientes referidos al Arrendamiento de Servicios Inmateriales, el Artículo 1438 y Artículo 1545 sobre la fuerza de ley de todo contrato legalmente celebrado), y las disposiciones vigentes en materia de propiedad intelectual de la Ley N° 17.336 sobre Propiedad Intelectual.`;
  } else if (country === "Colombia") {
    legalContext = `Código Civil de la República de Colombia (especialmente los Artículos 2053 y siguientes referentes al contrato de confección de obra y prestación de servicios, el Artículo 1495 de noción de contrato y Artículo 1602 por el cual todo contrato es una ley para los contratantes), y la Ley N° 23 de 1982 sobre Derechos de Autor para la transferencia de propiedad intelectual.`;
  } else if (country === "México") {
    legalContext = `Código Civil Federal de los Estados Unidos Mexicanos (específicamente los Artículos 2606 al 2615 de la Prestación de Servicios Profesionales, el Artículo 1792 y Artículo 1796 sobre la obligatoriedad de los contratos), y las regulaciones y alcances federales de la Ley Federal del Derecho de Autor de los Estados Unidos Mexicanos.`;
  } else if (country === "España") {
    legalContext = `Código Civil de España (Real Decreto de 24 de julio de 1889, especialmente el Artículo 1544 y concordantes sobre el Arrendamiento de Servicios, el Artículo 1091 y Artículo 1254 sobre fuerza vinculante), y la normativa sobre derechos de autor contemplada en el Real Decreto Legislativo 1/1996 de Propiedad Intelectual.`;
  } else {
    legalContext = `Leyes y jurisprudencia supletorias en materia civil y de comercio internacional de carácter general (Lex Mercatoria), de aplicación común para acuerdos comerciales y contratos transfronterizos entre profesionales independientes.`;
  }

  return `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

Conste por el presente documento el Contrato de Prestación de Servicios Profesionales Independientes que celebran por una parte y de manera voluntaria:

EL CLIENTE: ${input.clientName} (en adelante, "El Cliente")
EL FREELANCER: ${input.freelancerName} (en adelante, "El Freelancer")

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

SÉPTIMA: LEGISLACIÓN APLICABLE Y JURISDICCIÓN
El presente contrato se regirá supletoria y legalmente por:
${legalContext}

En caso de cualquier discrepancia, controversia o incumplimiento derivado del presente acuerdo, las partes acuerdan someterse en primera instancia a los mecanismos alternativos de resolución de conflictos, tales como la mediación o conciliación, en la ciudad de residencia del contratado. De persistir el conflicto, se someterán a la jurisdicción de los tribunales civiles ordinarios competentes del país de aplicación legal.

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
    const prompt = `Redactá un contrato de prestación de servicios profesional, formal y sumamente detallado en español para el país de ${body.country}. Usá cláusulas legales formales y referencias específicas a las leyes vigentes de dicho país (por ejemplo, si es Bolivia, cita el Código Civil Boliviano Art. 732 y la Ley 708 de Conciliación y Arbitraje; si es Argentina, cita el Código Civil y Comercial de la Nación Argentina Art. 1251, etc.). Datos del contrato: ${JSON.stringify(body)}. Estructura en títulos claros, declaraciones de las partes, objeto, precio, confidencialidad, propiedad intelectual y solución de controversias.`;

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
