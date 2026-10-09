/**
 * Pasos defensivos según el tipo de dato expuesto. Acepta las clases de HIBP en inglés
 * ("Passwords", "Phone numbers"…) o sus etiquetas en español.
 */
export type NextStepGroup = { id: string; title: string; items: string[] };

type Rule = NextStepGroup & { match: RegExp };

const RULES: Rule[] = [
  {
    id: "passwords",
    title: "Contraseñas",
    match: /password|contraseña|auth token|tokens de autenticación|security question|preguntas de seguridad|^pins?$/i,
    items: [
      "Cambiá la contraseña de ese servicio y de cualquier otro donde usaras la misma.",
      "Activá un segundo factor, mejor con una app de autenticación que por SMS.",
      "Usá un gestor de contraseñas para que cada cuenta tenga una clave distinta.",
    ],
  },
  {
    id: "phone",
    title: "Teléfono",
    match: /phone|teléfono|telefono|celular/i,
    items: [
      "Pedile a tu operadora un PIN o un bloqueo de portabilidad para frenar un cambio de SIM no autorizado.",
      "Desconfiá de llamadas o SMS que pidan códigos de verificación: ningún servicio te los pide así.",
      "Si un servicio usa el SMS como segundo factor, pasá a una app de autenticación cuando se pueda.",
    ],
  },
  {
    id: "cards",
    title: "Tarjetas y cuentas bancarias",
    match: /credit card|tarjeta|bank account|bancaria|payment histor|historial de pagos|financial transactions|transacciones financieras|cvv/i,
    items: [
      "Llamá a tu banco por el número del dorso de la tarjeta y pedí el bloqueo o la reposición.",
      "Revisá los movimientos de los últimos meses y desconocé los cargos que no hiciste.",
      "Activá los avisos de consumo en la app del banco.",
    ],
  },
  {
    id: "ids",
    title: "Documentos de identidad",
    match: /government issued|documentos de identidad|passport|pasaporte|driver's licen|licencias de conducir|social security|seguridad social|taxation|datos fiscales/i,
    items: [
      "Estate atento a créditos o cuentas abiertas a tu nombre que no reconozcas.",
      "Si notás un uso indebido, hacé la denuncia ante el organismo que emitió el documento.",
    ],
  },
  {
    id: "personal",
    title: "Datos personales",
    match: /physical address|direcciones físicas|dates of birth|fechas de nacimiento|^names$|^nombres$/i,
    items: [
      "Esperá mensajes que usen estos datos para parecer legítimos: verificá por otro canal antes de responder.",
      "Cambiá las respuestas de seguridad que se puedan deducir de estos datos.",
    ],
  },
  {
    id: "email",
    title: "Correo",
    match: /^email addresses$|^correos electrónicos$/i,
    items: [
      "Desconfiá de correos que mencionen esta filtración y pidan entrar por un enlace.",
      "Entrá a cada servicio escribiendo la dirección vos mismo.",
    ],
  },
];

/** Grupos que aplican, en el orden de RULES (lo más urgente primero), sin repetir. */
export function nextStepsForDataTypes(dataTypes: string[]): NextStepGroup[] {
  const groups: NextStepGroup[] = [];
  for (const rule of RULES) {
    if (dataTypes.some((type) => rule.match.test(type))) {
      groups.push({ id: rule.id, title: rule.title, items: rule.items });
    }
  }
  return groups;
}
// creado por pato dev y askforvini
