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
        "El presente aviso regula el acceso y la navegación en la plataforma Mercav (marketplace, herramientas, POS, Mercav Pwn, Mercav Kosher y servicios asociados), incluidos sus subdominios como pwn.mercav.lat y kosher.mercav.lat.",
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
        "Mercav Kosher es un directorio comunitario. Muestra la fuente de cada estado (agencia certificadora o reporte de un miembro), no emite hechsher ni psak y no sustituye la consulta a tu rabino o a la agencia.",
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
        "La cookie de sesión se emite para el dominio mercav.lat y sus subdominios (por ejemplo kosher.mercav.lat y pwn.mercav.lat), así una sola cuenta te mantiene conectado en todo Mercav. Es HttpOnly, Secure y SameSite=Lax.",
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
      title: "5 bis. Mapa de Mercav Kosher",
      body: [
        "El mapa descarga teselas y tipografías de OpenFreeMap y CARTO, con datos de OpenStreetMap. Esos proveedores reciben datos técnicos de la solicitud (IP, agente de usuario) y no instalan cookies de Mercav.",
        "«Cerca de mí» usa la geolocalización del navegador solo cuando la pides. La ubicación se procesa en tu dispositivo para centrar el mapa y ordenar la lista; no se guarda en Mercav.",
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
        "Mercav Kosher: lugares que sugieres, reportes de stock y confirmaciones, valoraciones, sugerencias de edición, mensajes del chat comunitario, reportes de mensajes y tu perfil comunitario opcional (ciudad, coordenadas para calcular Shabat, modo Shabat, denominación, corriente y rol).",
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
      title: "4 bis. Mercav Kosher y datos sensibles",
      body: [
        "La denominación, la corriente y tu participación en la comunidad pueden revelar convicciones religiosas, que muchas leyes consideran datos sensibles. Los tratamos solo con tu consentimiento explícito: los completas tú, son opcionales y puedes borrarlos desde /kosher/perfil.",
        "Tu perfil comunitario es privado. En el chat, las valoraciones y los reportes de stock se muestra solo tu nombre público de Mercav; puedes usar un nombre de usuario en lugar de tu nombre real.",
        "Leer y escribir en el chat requiere una cuenta Mercav. Los mensajes reportados por la comunidad se ocultan y los revisa un moderador; conservamos el mensaje y los reportes mientras dure la revisión y hasta 12 meses por seguridad.",
        "La ubicación de «Cerca de mí» se procesa en tu dispositivo y no se guarda. Solo guardamos coordenadas si las cargas en tu perfil para calcular los horarios de Shabat.",
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
        "Al crear cuenta o usar Mercav aceptas estos términos, la Política de Privacidad, la Política de Cookies y, si usas Mercav Pwn o Mercav Kosher, sus términos específicos.",
        "Una misma cuenta Mercav da acceso a mercav.lat y a sus subdominios, como kosher.mercav.lat y pwn.mercav.lat.",
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
      title: "5 bis. Mercav Kosher",
      body: [
        "Mercav Kosher es un espacio para la comunidad judía con mapa de lugares, stock por sucursal, valoraciones y chat por ciudad y por lugar. Se rige además por los Términos de Mercav Kosher en /kosher/terminos.",
        "Los estados de cada lugar indican su fuente. Mercav no certifica kashrut ni emite hechsher.",
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

export const KOSHER_TERMS: LegalDocument = {
  slug: "kosher/terminos",
  title: "Términos de Mercav Kosher",
  subtitle: "Cómo funciona el espacio de la comunidad judía en kosher.mercav.lat.",
  badge: `Última actualización: ${LEGAL.lastUpdated}`,
  sections: [
    {
      title: "1. Qué es Mercav Kosher",
      body: [
        "Mercav Kosher es un directorio y espacio comunitario: mapa de restaurantes, tiendas, sucursales, sinagogas, mikvaot y kehilot, con stock por sucursal, valoraciones y un chat por ciudad y por lugar.",
        "Se accede en kosher.mercav.lat y en mercav.lat/kosher con la misma cuenta Mercav. Estos términos complementan los Términos y condiciones generales, la Política de privacidad y la Política de uso aceptable.",
      ],
    },
    {
      title: "2. Sin hechsher ni psak",
      body: [
        "Mercav no certifica kashrut, no emite hechsher y no da psak halájico. Cada estado muestra su fuente para que decidas con información.",
        "«Certificado» significa que el lugar informa una agencia certificadora, cuyo nombre se muestra. «Reporte comunitario» es la observación de un miembro. «En disputa» indica reportes contradictorios y permanece visible hasta que un moderador lo resuelve. «Sin verificar» indica que nadie confirmó el estado todavía.",
        "Las certificaciones cambian. Ante cualquier duda, confirma con la agencia, el establecimiento o tu rabino antes de comer o comprar.",
      ],
    },
    {
      title: "3. Datos iniciales y fuentes",
      body: [
        "Los lugares que carga Mercav se verifican contra una fuente pública: el sitio oficial de la institución, la lista de la agencia certificadora o un organismo público. Cada ficha enlaza su fuente y muestra la fecha de verificación.",
        "Un lugar figura como «Certificado» solo si aparece en la lista publicada por su agencia. En sinagogas, museos y centros comunitarios la kashrut no aplica y la ficha indica «Fuente verificada». Horarios y teléfonos pueden cambiar: confírmalos con el lugar antes de ir.",
      ],
    },
    {
      title: "4. Tus aportes",
      body: [
        "Puedes sugerir lugares, proponer ediciones, reportar y confirmar stock y dejar una valoración por lugar. Reporta solo lo que viste en persona y con fecha.",
        "Los lugares y ediciones que propones los revisa un moderador antes de publicarse. Los reportes de stock sin confirmar en 14 días se marcan como posiblemente desactualizados.",
        "Nos concedes una licencia no exclusiva para mostrar tus aportes en Mercav. Puedes borrar tu valoración y tus mensajes cuando quieras.",
      ],
    },
    {
      title: "5. Chat de la comunidad",
      body: [
        "Cada ciudad y cada lugar tienen su propia conversación; no hay un chat global. Leer y escribir requiere una cuenta Mercav activa.",
        "Trata a los demás con respeto. No publiques antisemitismo, discurso de odio, acoso, spam comercial ni datos personales de otros miembros, como direcciones, horarios o datos de familia.",
        "Cualquier miembro puede reportar un mensaje. Con tres reportes el mensaje se oculta automáticamente y un moderador lo revisa. Los moderadores pueden ocultar o borrar mensajes y suspender cuentas que incumplan estas reglas.",
      ],
    },
    {
      title: "6. Agenda, minián y jésed",
      body: [
        "Los eventos de la agenda y los pedidos del tablón de jésed los revisa un moderador antes de publicarse. Los eventos que publica una institución que administra su ficha aparecen como oficiales sin esperar revisión.",
        "Los pedidos de minián se publican al instante. Propón sinagogas o lugares públicos como punto de encuentro, nunca un domicilio particular.",
        "En el tablón de jésed pide permiso antes de publicar por otra persona y no incluyas datos de salud, direcciones ni información que identifique a quien recibe ayuda. Los pedidos vencen solos a los 7, 14 o 30 días.",
      ],
    },
    {
      title: "7. Mesa de Shabat",
      body: [
        "Los anfitriones los aprueba un moderador de la kehilá antes de aparecer, y vuelven a revisión si cambian su descripción, su ciudad o su kashrut. La dirección nunca se publica: cuando el anfitrión acepta un pedido, Mercav abre una conversación privada entre ambos para coordinar.",
        "Anfitriones e invitados son responsables de su encuentro. Mercav no verifica domicilios ni el nivel de kashrut de una casa; la descripción es declarada por el anfitrión. Si algo te preocupa, repórtalo a soporte.",
      ],
    },
    {
      title: "8. Fichas oficiales y certificados",
      body: [
        "Una institución o un negocio puede pedir administrar su ficha, o aceptar una invitación que emite un moderador. Antes de aprobar un pedido, un moderador confirma la identidad con un dato verificable, como un teléfono público o un correo con el dominio del lugar.",
        "Quien administra una ficha puede editar teléfono, sitio web, información y horarios de tefilá. El estado de kashrut solo cambia con un certificado vigente que un moderador verifica con la agencia. La ficha muestra la fecha de vencimiento y un aviso cuando el certificado venció, y avisamos a quien la administra antes de esa fecha.",
      ],
    },
    {
      title: "9. Alertas",
      body: [
        "Puedes elegir recibir avisos por ciudad sobre stock, agenda, minianim y jésed. Llegan a la campana de notificaciones de Mercav y los desactivas desde tu perfil cuando quieras.",
      ],
    },
    {
      title: "10. Moderación",
      body: [
        "Moderan el equipo de Mercav y miembros con rol de moderador local o de agencia. Sus decisiones buscan un mapa preciso y una conversación segura; puedes pedir revisión escribiendo a soporte.",
      ],
    },
    {
      title: "11. Calendario y modo Shabat",
      body: [
        "El calendario calcula zmanim, encendido de velas (18 minutos antes de la puesta del sol) y Havdalá (42 minutos después) para la diáspora, con la zona horaria de cada comunidad.",
        "Si activas el modo Shabat en tu perfil, Mercav Kosher queda en solo lectura para tu cuenta desde el encendido de velas hasta Havdalá, también en iom tov, según la ciudad de tu perfil.",
        "Cada kehilá tiene su minhag. Ante la duda, sigue el horario de tu sinagoga o de tu rabino.",
      ],
    },
    {
      title: "12. Privacidad",
      body: [
        "La denominación, la corriente y tu participación pueden revelar convicciones religiosas. Son datos opcionales, privados y tratados con tu consentimiento explícito, como detalla la Política de privacidad.",
        "«Cerca de mí» y «Usar mi ubicación» usan la ubicación del navegador solo cuando la pides y no se guarda en Mercav.",
        "En la agenda, el minián, el jésed y la mesa de Shabat mostramos tu nombre y la inicial de tu apellido. Tu correo y tu teléfono solo los ve un moderador cuando pides administrar una ficha.",
      ],
    },
    {
      title: "13. Seguridad de la comunidad",
      body: [
        "Las direcciones de sinagogas y kehilot son información que ya publican esas instituciones. Si representas a una institución y prefieres ocultar su dirección exacta, escríbenos y la retiramos o la mostramos de forma aproximada.",
        `Reporta cualquier amenaza o contenido preocupante a ${LEGAL.emailFraud}. Colaboramos con las autoridades cuando corresponde.`,
      ],
    },
    {
      title: "14. Limitación de responsabilidad",
      body: [
        "Los aportes de la comunidad pueden contener errores. Mercav no responde por decisiones tomadas solo con base en un estado, un reporte de stock o un mensaje del chat.",
        `Consultas sobre estos términos: ${LEGAL.emailLegal}.`,
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
      title: "4 bis. Mercav Kosher",
      body: [
        "Cumple los Términos de Mercav Kosher. Los reportes de estado y stock deben ser de primera mano y honestos.",
        "En el chat comunitario no se permite antisemitismo, discurso de odio, acoso, revelar datos personales de otros miembros (dirección, horarios de rezo de una persona, familia) ni spam comercial.",
      ],
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
  "kosher/terminos": KOSHER_TERMS,
  "legal/uso-aceptable": ACCEPTABLE_USE,
  "legal/reembolsos": REFUNDS,
  "legal/derechos": DATA_RIGHTS,
};
