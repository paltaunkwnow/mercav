import { LEGAL, SUBPROCESSORS } from "@/lib/legal/site";

export type LegalSection = { title: string; body: string[] };

export type LegalDocument = {
  slug: string;
  title: string;
  subtitle: string;
  badge?: string;
  sections: LegalSection[];
};

const subprocessorsList = SUBPROCESSORS.map(
  (s) => `${s.name}: ${s.purpose} (${s.region}). Política: ${s.url}`,
).join(" ");

export const AVISO_LEGAL: LegalDocument = {
  slug: "aviso-legal",
  title: "Aviso legal",
  subtitle: "Identificación del titular del sitio y condiciones generales de acceso.",
  badge: `Última actualización: ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Titular del sitio web",
      body: [
        `Denominación: ${LEGAL.legalName}. Nombre comercial: ${LEGAL.brand}.`,
        `Domicilio: ${LEGAL.address}. Correo de contacto legal: ${LEGAL.emailLegal}.`,
        `Identificación fiscal / registro mercantil: ${LEGAL.taxId}.`,
      ],
    },
    {
      title: "2. Objeto",
      body: [
        "El presente aviso regula el acceso y la navegación en la plataforma Mercav (marketplace, herramientas, POS, Mercav Pwn y servicios asociados).",
        "El uso del sitio implica la lectura de este aviso, de los Términos y Condiciones, de la Política de Privacidad y de la Política de Cookies.",
      ],
    },
    {
      title: "3. Propiedad intelectual",
      body: [
        "Los contenidos, marcas, logotipos, código, diseño y bases de datos de Mercav están protegidos por la legislación aplicable. Queda prohibida su reproducción o explotación sin autorización escrita.",
        "Los contenidos publicados por usuarios permanecen bajo responsabilidad de quien los publica; Mercav puede retirarlos si incumplen la ley o las políticas de uso.",
      ],
    },
    {
      title: "4. Limitación de responsabilidad",
      body: [
        "Mercav no garantiza la disponibilidad ininterrumpida del servicio. No somos parte en contratos entre usuarios (compradores/vendedores, empleadores/candidatos) salvo cuando actuamos como custodio de pagos (escrow) conforme a los términos publicados.",
        "Mercav Pwn ofrece información de seguridad con fines de concienciación y defensa; no constituye asesoría legal ni garantía de ausencia de compromiso.",
      ],
    },
    {
      title: "5. Ley aplicable y jurisdicción",
      body: [
        `Salvo norma imperativa en el país del usuario consumidor, estos textos se interpretan conforme a las leyes de ${LEGAL.country}.`,
        "Para controversias, las partes se someten a los tribunales competentes del domicilio del titular, sin perjuicio de los derechos irrenunciables del consumidor en su país de residencia.",
      ],
    },
  ],
};

export const COOKIE_POLICY: LegalDocument = {
  slug: "cookies",
  title: "Política de cookies",
  subtitle: "Qué tecnologías usamos, para qué y cómo puedes decidir.",
  badge: `Versión ${LEGAL.cookiePolicyVersion} · ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Qué son las cookies",
      body: [
        "Las cookies son archivos pequeños que el navegador almacena en tu dispositivo. También usamos almacenamiento local (localStorage) para preferencias como el tema visual y tu elección de cookies.",
      ],
    },
    {
      title: "2. Cookies estrictamente necesarias",
      body: [
        "Siempre activas. Incluyen la cookie de sesión de autenticación (NextAuth), tokens de seguridad CSRF cuando aplique, y la cookie mercav_cookie_consent que guarda tu elección.",
        "No requieren consentimiento previo porque son imprescindibles para el servicio que solicitas (iniciar sesión, mantener sesión, recordar tu decisión de privacidad).",
      ],
    },
    {
      title: "3. Funcionales",
      body: [
        "Recuerdan preferencias de interfaz (por ejemplo tema claro/oscuro en localStorage mercav-theme). Solo se activan si las aceptas en el banner de cookies.",
      ],
    },
    {
      title: "4. Analíticas",
      body: [
        "Medición agregada de uso para mejorar el producto. En la configuración actual pueden no estar desplegadas; si las activamos, solo se cargarán con tu consentimiento.",
      ],
    },
    {
      title: "5. Terceros (Google reCAPTCHA y Google Sign-In)",
      body: [
        "Google reCAPTCHA v3 protege registro e inicio de sesión con credenciales. Puede instalar cookies y procesar datos técnicos (IP, interacción). Solo se carga si aceptas cookies de terceros.",
        "Iniciar sesión con Google redirige a Google OAuth; aplica la política de privacidad de Google. Requiere cookies de terceros habilitadas.",
        "Más información: https://policies.google.com/technologies/cookies",
      ],
    },
    {
      title: "6. Cómo gestionar tu elección",
      body: [
        "Al entrar por primera vez verás un banner donde debes elegir: aceptar todas, solo necesarias o personalizar categorías.",
        "Puedes cambiar tu decisión en cualquier momento desde el enlace «Gestionar cookies» en el pie de página.",
        "Borrar cookies del navegador restablecerá el banner en tu próxima visita.",
      ],
    },
    {
      title: "7. Contacto",
      body: [`Consultas sobre cookies: ${LEGAL.emailPrivacy}.`],
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  slug: "privacidad",
  title: "Política de privacidad",
  subtitle: "Cómo tratamos datos personales en Mercav.",
  badge: `Última actualización: ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Responsable del tratamiento",
      body: [
        `${LEGAL.legalName}, con domicilio en ${LEGAL.address}. ${LEGAL.dpoLabel}: ${LEGAL.emailPrivacy}.`,
      ],
    },
    {
      title: "2. Datos que recopilamos",
      body: [
        "Registro: nombre, nombre de usuario, correo electrónico, contraseña (hash), foto de perfil opcional.",
        "Uso de la plataforma: publicaciones, mensajes, pedidos, datos de POS (inventario, ventas) que el comercio introduce.",
        "Pagos: Mercav no almacena números completos de tarjeta; Stripe procesa pagos conforme a su política.",
        "Técnicos: dirección IP, agente de usuario, logs de seguridad, preferencias de cookies y tema.",
        "Mercav Pwn: consultas de exposición (correo, dominio, CVE), objetivos de monitoreo verificados, alertas generadas, señales de fuentes públicas allowlisted.",
        "Verificación de identidad (cuando aplique): documentos o prueba biométrica solicitados en procesos de recuperación de cuenta o disputas, con retención limitada descrita en soporte.",
      ],
    },
    {
      title: "3. Finalidades y bases legales",
      body: [
        "Prestación del contrato: cuenta, marketplace, POS, pagos, soporte.",
        "Interés legítimo: seguridad, prevención de fraude, mejora del servicio, logs técnicos.",
        "Consentimiento: cookies no esenciales, comunicaciones comerciales cuando las solicites, ciertos tratamientos opcionales.",
        "Obligación legal: requerimientos de autoridades competentes cuando proceda.",
      ],
    },
    {
      title: "4. Mercav Pwn",
      body: [
        "Las consultas de exposición usan fuentes como Have I Been Pwned bajo sus condiciones de uso. No vendemos listados de correos comprometidos.",
        "Solo debes consultar correos o dominios que te pertenezcan o sobre los que tengas autorización documentada.",
        "El monitoreo de dominios requiere verificación DNS. Conservamos historial de alertas mientras mantengas la cuenta o según retención legal.",
      ],
    },
    {
      title: "5. Encargados y transferencias internacionales",
      body: [subprocessorsList, "Cuando los datos salen de tu país, aplicamos salvaguardas contractuales razonables con proveedores."],
    },
    {
      title: "6. Plazos de conservación",
      body: [
        "Cuenta activa: datos de perfil y contenido mientras la cuenta exista.",
        "Tras baja: bloqueo y supresión en plazos técnicos razonables (salvo obligación legal o disputas abiertas).",
        "Logs de seguridad: típicamente hasta 12 meses.",
        "Verificación ID/biometría en soporte: eliminación en un plazo máximo de 3 meses tras cerrar el caso, salvo obligación legal.",
      ],
    },
    {
      title: "7. Tus derechos",
      body: [
        "Acceso, rectificación, supresión, oposición, limitación y portabilidad cuando la ley lo reconozca.",
        `Solicitudes: ${LEGAL.emailPrivacy} o formulario en /legal/derechos. Respondemos en plazos legales aplicables.`,
      ],
    },
    {
      title: "8. Menores",
      body: ["Mercav no está dirigida a menores de 18 años. Si detectamos registro de un menor, procederemos a eliminar la cuenta."],
    },
    {
      title: "9. Seguridad",
      body: [
        "Aplicamos medidas técnicas y organizativas acordes al riesgo (cifrado en tránsito TLS, hashing de contraseñas, controles de acceso).",
        "Ningún sistema es 100 % invulnerable; notificaremos incidentes relevantes cuando la ley lo exija.",
      ],
    },
    {
      title: "10. Cambios",
      body: ["Publicaremos versiones actualizadas en esta URL. Cambios materiales se comunicarán por la plataforma o correo."],
    },
  ],
};

export const TERMS: LegalDocument = {
  slug: "terminos",
  title: "Términos y condiciones",
  subtitle: "Contrato de uso de la plataforma Mercav.",
  badge: `Última actualización: ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Aceptación",
      body: [
        "Al crear cuenta o usar Mercav aceptas estos términos, la Política de Privacidad, la Política de Cookies y, si usas Mercav Pwn, sus términos específicos.",
      ],
    },
    {
      title: "2. Cuenta y seguridad",
      body: [
        "Eres responsable de la confidencialidad de tus credenciales y de la actividad en tu cuenta.",
        "Podemos suspender cuentas por fraude, abuso o incumplimiento. La autenticación en dos pasos (2FA) es recomendable.",
      ],
    },
    {
      title: "3. Marketplace y contenido",
      body: [
        "Los usuarios son responsables de lo que publican (anuncios, servicios, empleos). Mercav puede moderar y retirar contenido.",
        "Prohibido: ilegalidad, suplantación, spam, malware, discriminación, venta de datos robados o servicios que faciliten delitos.",
      ],
    },
    {
      title: "4. Pagos y escrow",
      body: [
        "En servicios freelance Mercav puede retener fondos hasta aceptación del trabajo o resolución de disputa.",
        "Comisiones publicadas en /precios o en checkout aplican por transacción exitosa.",
        "Mercav no sustituye asesoría fiscal; cada usuario cumple sus obligaciones tributarias.",
      ],
    },
    {
      title: "5. POS",
      body: [
        "Los datos comerciales introducidos en el POS son responsabilidad del comercio. Mercav actúa como proveedor de software.",
      ],
    },
    {
      title: "6. Propiedad intelectual",
      body: [
        "Concedes a Mercav licencia no exclusiva para alojar y mostrar contenido que publicas, necesaria para operar el servicio.",
      ],
    },
    {
      title: "7. Limitación de responsabilidad",
      body: [
        "En la medida permitida por la ley, Mercav no responde por daños indirectos, lucro cesante o contenido de terceros.",
        "El servicio se ofrece «tal cual» con esfuerzos razonables de disponibilidad.",
      ],
    },
    {
      title: "8. Modificaciones y terminación",
      body: [
        "Podemos actualizar estos términos; el uso continuado tras la notificación implica aceptación.",
        "Puedes cerrar tu cuenta; Mercav puede terminar el acceso por incumplimiento grave.",
      ],
    },
    {
      title: "9. Contacto legal",
      body: [`${LEGAL.emailLegal}`],
    },
  ],
};

export const PWN_TERMS: LegalDocument = {
  slug: "pwn/terminos",
  title: "Términos de Mercav Pwn",
  subtitle: "Uso permitido del módulo de ciberinteligencia y exposición.",
  badge: `Última actualización: ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Alcance",
      body: [
        "Mercav Pwn agrega información de fuentes públicas y licenciadas (p. ej. HIBP, NVD, RSS allowlisted) para ayudarte a evaluar riesgo de exposición.",
        "No garantiza exhaustividad ni ausencia de falsos positivos/negativos.",
      ],
    },
    {
      title: "2. Uso autorizado",
      body: [
        "Solo consulta correos, dominios o activos sobre los que tengas titularidad o autorización expresa del titular.",
        "La verificación DNS para dominios confirma control técnico, no autoriza consultas sobre datos personales de terceros alojados en ese dominio más allá de lo permitido por la ley.",
      ],
    },
    {
      title: "3. Prohibiciones",
      body: [
        "Queda prohibido: acoso, doxing, reventa de datos, scraping masivo contra Mercav, eludir límites de API, usar resultados para acceder sin autorización a sistemas o cuentas ajenas.",
        "Mercav puede suspender acceso a Pwn y reportar conductas ilícitas.",
      ],
    },
    {
      title: "4. Have I Been Pwned y terceros",
      body: [
        "El uso de datos HIBP está sujeto a https://haveibeenpwned.com/TermsOfUse. Debes respetar atribución y límites de la API.",
      ],
    },
    {
      title: "5. Sin asesoría legal",
      body: [
        "La información mostrada no constituye asesoría legal, forense ni garantía de cumplimiento normativo. Consulta profesionales calificados para decisiones críticas.",
      ],
    },
    {
      title: "6. Limitación de responsabilidad",
      body: [
        "Mercav no responde por daños derivados de decisiones tomadas exclusivamente con base en alertas o señales automatizadas.",
      ],
    },
  ],
};

export const ACCEPTABLE_USE: LegalDocument = {
  slug: "legal/uso-aceptable",
  title: "Política de uso aceptable",
  subtitle: "Conductas permitidas y prohibidas en todo el ecosistema Mercav.",
  badge: LEGAL.lastUpdated,
  sections: [
    {
      title: "1. Principios",
      body: ["Usa Mercav de forma lícita, respetuosa y coherente con las políticas de cada módulo."],
    },
    {
      title: "2. Prohibiciones generales",
      body: [
        "Fraude, phishing, malware, lavado de activos, venta de credenciales robadas, contenido sexual explícito no consentido, incitación al odio, violencia.",
        "Automatización abusiva (bots de scraping no autorizados, fuerza bruta, spam masivo).",
      ],
    },
    {
      title: "3. Marketplace",
      body: ["Anuncios veraces, precios claros, cumplimiento de entregas. No manipular reseñas ni identidades."],
    },
    {
      title: "4. Mercav Pwn",
      body: ["Cumple los Términos de Mercav Pwn. No uses el módulo para vigilancia ilegal de personas."],
    },
    {
      title: "5. Consecuencias",
      body: [
        "Advertencias, suspensión, terminación de cuenta, retención de fondos en disputa y comunicación a autoridades cuando corresponda.",
        `Reportes: ${LEGAL.emailFraud} o /contacto.`,
      ],
    },
  ],
};

export const REFUNDS: LegalDocument = {
  slug: "legal/reembolsos",
  title: "Pagos, reembolsos y disputas",
  subtitle: "Reglas de escrow, chargebacks y resolución de conflictos.",
  badge: LEGAL.lastUpdated,
  sections: [
    {
      title: "1. Procesamiento",
      body: ["Los pagos con tarjeta los procesa Stripe. Mercav recibe confirmación de pago, no datos completos de tarjeta."],
    },
    {
      title: "2. Escrow de servicios",
      body: [
        "Los fondos pueden retenerse hasta que el comprador acepte la entrega o venza un plazo acordado en el flujo de pedido.",
        "En disputa, ambas partes aportan evidencia; Mercav emite resolución vinculante dentro del marco de la plataforma.",
      ],
    },
    {
      title: "3. Reembolsos",
      body: [
        "Los reembolsos aprobados se devuelven por el mismo medio cuando sea posible, sujetos a plazos bancarios.",
        "Comisiones de pasarela ya incurridas pueden descontarse según el caso.",
      ],
    },
    {
      title: "4. Chargebacks",
      body: [
        "Un chargeback bancario puede congelar fondos y conllevar revisión de cuenta. Colabora aportando pruebas de entrega.",
      ],
    },
    {
      title: "5. Contacto",
      body: [`Disputas de pedidos: soporte en la plataforma o ${LEGAL.emailSupport}.`],
    },
  ],
};

export const DATA_RIGHTS: LegalDocument = {
  slug: "legal/derechos",
  title: "Ejercicio de derechos de privacidad",
  subtitle: "Cómo solicitar acceso, rectificación, supresión u oposición.",
  badge: LEGAL.lastUpdated,
  sections: [
    {
      title: "1. Quién puede solicitar",
      body: ["El titular de los datos o su representante legal debidamente acreditado."],
    },
    {
      title: "2. Cómo solicitar",
      body: [
        `Envía correo desde la dirección asociada a tu cuenta a ${LEGAL.emailPrivacy} con asunto «Derechos ARCO» o usa /contacto indicando el derecho que ejerces.`,
        "Incluye: nombre, usuario, correo, descripción de la solicitud y copia de documento de identidad si es necesario para verificar titularidad.",
      ],
    },
    {
      title: "3. Plazos",
      body: ["Respondemos en un plazo máximo de 30 días naturales salvo prórroga justificada según ley aplicable."],
    },
    {
      title: "4. Supresión de cuenta",
      body: [
        "Puedes solicitar cierre de cuenta. Algunos datos pueden conservarse bloqueados por obligaciones legales, contables o disputas pendientes.",
      ],
    },
    {
      title: "5. Reclamación ante autoridad",
      body: ["Si no estás conforme con nuestra respuesta, puedes acudir a la autoridad de protección de datos de tu país."],
    },
  ],
};

export const LEGAL_ROUTES: Record<string, LegalDocument> = {
  "aviso-legal": AVISO_LEGAL,
  cookies: COOKIE_POLICY,
  privacidad: PRIVACY_POLICY,
  terminos: TERMS,
  "pwn/terminos": PWN_TERMS,
  "legal/uso-aceptable": ACCEPTABLE_USE,
  "legal/reembolsos": REFUNDS,
  "legal/derechos": DATA_RIGHTS,
};
// creado por Patodev y Invertilo
