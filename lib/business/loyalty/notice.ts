/**
 * Aviso de datos reales: aparece al crear la tarjeta (en el negocio y en el alta del cliente) y al guardarla en una
 * cuenta Mercav. El titular se valida en persona con su documento.
 */
export const REAL_DATA_NOTICE_BUSINESS =
  "Cargá los datos reales del cliente: nombre y apellido como figuran en su documento. Para validar que es el titular de la tarjeta y de su cuenta Mercav, se le va a pedir su identificación en el negocio.";

export const REAL_DATA_NOTICE_CUSTOMER =
  "Usá tus datos reales: nombre y apellido como figuran en tu documento. Para validar que sos el titular de la tarjeta y de tu cuenta, el negocio te va a pedir tu identificación en tu próxima visita.";

export const HOLDER_DOC_TYPES = ["CI", "DNI", "Cédula", "Pasaporte", "Otro"] as const;
// creado por pato dev y askforvini
