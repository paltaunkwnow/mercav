/**
 * Diccionario de /kosher/kashrut. Definiciones cortas y propias, para orientar: no son psak.
 * Transliteración como en el resto de Mercav Kosher (hejsher, mashgiaj, jalav Israel, Pésaj).
 */
export type KashrutTerm = {
  id: string;
  term: string;
  /** Otras grafías que la gente busca. */
  aka?: string[];
  he: string;
  definition: string;
};

export const KASHRUT_TERMS: KashrutTerm[] = [
  {
    id: "hejsher",
    term: "Hejsher",
    aka: ["hechsher", "hashgajá"],
    he: "הכשר",
    definition:
      "El aval de una agencia o de un rabino de que un producto o un local cumple con la kashrut. Lo da quien supervisa, nunca el local, y tiene alcance y vencimiento: fijate qué cubre y hasta cuándo. La supervisión que lo respalda se llama hashgajá.",
  },
  {
    id: "mashgiaj",
    term: "Mashgiaj",
    aka: ["mashguíaj", "mashgiach", "mashgijim"],
    he: "משגיח",
    definition:
      "La persona que supervisa la kashrut en nombre de la agencia: controla ingredientes, proveedores y cocina. Según el lugar, está siempre presente (mashgiaj temidí) o pasa a revisar. En plural, mashgijim.",
  },
  {
    id: "glatt",
    term: "Glatt",
    he: "גלאט",
    definition:
      "En ídish, «liso». En carne vacuna, que los pulmones del animal no tenían adherencias. Muchos lo usan además como sinónimo de «más estricto», incluso en productos que no son carne.",
  },
  {
    id: "beit-yosef",
    term: "Beit Yosef",
    he: "בית יוסף",
    definition:
      "El criterio de Rabí Yosef Karo, autor del Shulján Aruj, que siguen muchas comunidades sefaradíes. En carne pide pulmones sin ninguna adherencia, un estándar más exigente que el glatt habitual.",
  },
  {
    id: "mehadrin",
    term: "Mehadrin",
    he: "מהדרין",
    definition:
      "Un nivel de supervisión por encima del básico. Qué agrega exactamente lo define cada agencia, así que conviene preguntar qué significa en ese producto o en ese local.",
  },
  {
    id: "jalav-israel",
    term: "Jalav Israel",
    aka: ["cholov Yisroel"],
    he: "חלב ישראל",
    definition:
      "Leche controlada por un judío desde el ordeñe, para asegurar que viene de un animal kosher. Hay quien la usa siempre y quien acepta otra leche con hejsher. Seguí la costumbre de tu casa y de tu comunidad.",
  },
  {
    id: "pat-israel",
    term: "Pat Israel",
    aka: ["pas Yisroel"],
    he: "פת ישראל",
    definition:
      "Pan horneado con participación de un judío, como mínimo al encender el horno. Algunas personas solo comen pan pat Israel; otras aceptan el de una panadería con hejsher aunque no lo sea.",
  },
  {
    id: "bishul-israel",
    term: "Bishul Israel",
    aka: ["bishul Yisroel"],
    he: "בישול ישראל",
    definition:
      "Ciertas comidas que no se comen crudas y que se servirían en una mesa importante tienen que cocinarse con participación de un judío. Qué alcanza (encender el fuego o poner la olla) cambia entre la costumbre ashkenazí y la sefaradí.",
  },
  {
    id: "kasherizacion",
    term: "Kasherización: hagalá y libun",
    aka: ["kasherizar", "kashering", "hagalá", "libun"],
    he: "הגעלה · ליבון",
    definition:
      "Volver kosher un utensilio que se usó con comida no kosher, o prepararlo para Pésaj. La hagalá sumerge el utensilio en agua hirviendo y sirve para lo que se usó con líquidos. El libun lo calienta a fuego directo hasta ponerlo al rojo y sirve para lo que estuvo en el fuego, como una parrilla. No todo material se puede kasherizar: preguntá a tu rabino antes de empezar.",
  },
  {
    id: "tevilat-kelim",
    term: "Tevilat kelim",
    he: "טבילת כלים",
    definition:
      "Sumergir en una mikvé los utensilios de metal o de vidrio para comida que se compran a un fabricante no judío, antes de usarlos por primera vez. Muchas comunidades tienen una mikvé especial para utensilios.",
  },
  {
    id: "bedikat-tolaim",
    term: "Bedikat tolaim",
    aka: ["tolaim", "revisar insectos"],
    he: "בדיקת תולעים",
    definition:
      "Revisar verduras de hoja, hierbas, algunas frutas, legumbres y harinas para encontrar insectos, que no son kosher. Las agencias publican guías con qué revisar y cómo; algunas también avisan qué pescados pueden traer parásitos.",
  },
  {
    id: "jamets",
    term: "Jamets",
    aka: ["jametz", "chametz"],
    he: "חמץ",
    definition:
      "Lo que se hace con trigo, cebada, centeno, avena o espelta y fermentó al tocar el agua: pan, fideos, galletitas, cerveza. En Pésaj no se come ni se tiene en casa.",
  },
  {
    id: "kosher-le-pesaj",
    term: "Kosher le-Pésaj",
    aka: ["kosher para Pésaj", "kasher le-Pesaj"],
    he: "כשר לפסח",
    definition:
      "Apto para Pésaj: sin jamets y hecho con equipos preparados para la fecha. Que un producto sea kosher el resto del año no alcanza; tiene que decirlo. Muchas familias ashkenazíes, además, no comen kitniot (arroz, maíz y legumbres).",
  },
  {
    id: "shomer-shabat",
    term: "Shomer Shabat",
    he: "שומר שבת",
    definition:
      "Un local que cierra en Shabat y en los jaguim. Hay agencias que solo certifican lugares que cierran y otras que no lo piden: si te importa, mirá la ficha o preguntá en el lugar.",
  },
  {
    id: "parve",
    term: "Parve",
    he: "פרווה",
    definition:
      "Ni carne ni lácteo: frutas, verduras, granos, huevos y pescado. Se puede comer con una comida de carne o con una láctea, aunque el pescado no se come junto con carne. Si un producto parve se hizo en equipos lácteos, algunas agencias lo marcan en el sello; la OU, por ejemplo, con «DE».",
  },
];
// creado por pato dev y askforvini
