/**
 * Guía de /kosher/kashrut/pescados. Cada entrada sale de las fuentes de FISH_SOURCES (revisadas el 12/10/2026).
 * Solo entran especies que alguna lista publicada nombra, por especie o por familia. Lo que no encontramos
 * (pacú, dorado de río, boga, sábalo, tararira) queda afuera a propósito: se avisa en la página.
 */
export const FISH_VERIFIED_AT = "12 de octubre de 2026";

export type FishStatus = "kosher" | "not_kosher" | "disputed";

export const FISH_STATUS: Record<FishStatus, string> = {
  kosher: "Kosher",
  not_kosher: "No kosher",
  disputed: "Discutido",
};

export const FISH_STATUS_ORDER: readonly FishStatus[] = ["kosher", "not_kosher", "disputed"];

export const FISH_SOURCES = {
  atz: {
    short: "OU (lista Atz)",
    title: "Kosher and Non-Kosher Fish: la lista del Dr. James W. Atz (Museo Americano de Historia Natural), publicada por la Orthodox Union",
    publisher: "Kashrut.com, con permiso de la OU (actualizada el 19/07/2017)",
    url: "https://www.kashrut.com/articles/fish/",
  },
  chabad: {
    short: "OU en Chabad.org",
    title: "Kosher Fish List y Non-Kosher Fish List, reimpresión de la lista de la OU con notas del editor",
    publisher: "Chabad.org",
    url: "https://www.chabad.org/library/article_cdo/aid/82675/jewish/Kosher-Fish-List.htm",
  },
  starK: {
    short: "Star-K",
    title: "STAR-K Anisakis Fish Policy: qué pescados acepta sin revisión de parásitos y cuáles no acepta",
    publisher: "Star-K (actualizada el 16/07/2025)",
    url: "https://www.star-k.org/articles/uncategorized/16375/anisakis-fish-policy/",
  },
  kmd: {
    short: "KMD México",
    title: "Pescados sin problemas de anisakis y pescados problemáticos",
    publisher: "Kosher Maguen David (KMD), México",
    url: "https://www.kosher.com.mx/files/pescados-kosher-tolaim.pdf",
  },
  ka: {
    short: "Kashrut Authority",
    title: "Common Kosher and Non Kosher Fish",
    publisher: "The Kashrut Authority, Australia",
    url: "https://www.ka.org.au/consumer-resources/common-kosher-and-non-kosher-fish",
  },
  bdk: {
    short: "BDK",
    title: "Peixes: mergulhando no mar da kashrut",
    publisher: "BDK do Brasil",
    url: "https://bdk.com.br/artigos/peixes-mergulhando-no-mar-da-kashrut/17",
  },
  kingklip: {
    short: "Dei'ah veDibur",
    title: "La discusión sobre el kingklip en Sudáfrica (B. Rabinowitz, junio de 2005)",
    publisher: "Dei'ah veDibur",
    url: "https://chareidi.org/archives5765/KRH65akingklip.htm",
  },
  swordfish: {
    short: "Chabad.org: pez espada",
    title: "Is Swordfish Kosher?",
    publisher: "Chabad.org",
    url: "https://www.chabad.org/library/article_cdo/aid/4660913/jewish/Is-Swordfish-Kosher.htm",
  },
  swordfishDebate: {
    short: "My Jewish Learning",
    title: "Ask the Expert: Is Swordfish Kosher? (rabino Eric Woodward)",
    publisher: "My Jewish Learning",
    url: "https://www.myjewishlearning.com/article/ask-the-expert-is-swordfish-kosher/",
  },
  sturgeon: {
    short: "Chabad.org: esturión",
    title: "Is Sturgeon Kosher?",
    publisher: "Chabad.org",
    url: "https://www.chabad.org/library/article_cdo/aid/4660915/jewish/Is-Sturgeon-Kosher.htm",
  },
  sturgeonHistory: {
    short: "Jewish Virtual Library",
    title: "Jeremiah ben Isaac y la discusión de 1798 sobre el esturión",
    publisher: "Jewish Virtual Library",
    url: "https://www.jewishvirtuallibrary.org/jeremiah-ben-isaac",
  },
  caa: {
    short: "Código Alimentario Argentino",
    title: "Código Alimentario Argentino, capítulo XXIII, art. 23.1.3: nomenclatura de los pescados de explotación comercial",
    publisher: "Argentina.gob.ar",
    url: "https://www.argentina.gob.ar/normativa/recurso/24788/dn4238-1968cap23/htm",
  },
  esWiki: {
    short: "Wikipedia",
    title: "Fichas de especies de Wikipedia en español (por ejemplo, Genypterus blacodes), para nombres regionales de Chile y México",
    publisher: "Wikipedia",
    url: "https://es.wikipedia.org/wiki/Genypterus_blacodes",
  },
} as const satisfies Record<string, { short: string; title: string; publisher: string; url: string }>;

export type FishSourceKey = keyof typeof FISH_SOURCES;

export type FishName = { name: string; where?: string };

export type Fish = {
  id: string;
  name: string;
  /** Otros nombres, con el país o la región cuando una fuente lo indica. */
  also?: FishName[];
  scientific: string[];
  status: FishStatus;
  note: string;
  sources: FishSourceKey[];
};

export const FISH: Fish[] = [
  // Merluzas, bacalaos y parientes
  {
    id: "merluza",
    name: "Merluza",
    also: [
      { name: "merluza común", where: "Chile" },
      { name: "merluza austral", where: "Chile y Argentina" },
      { name: "pescadilla", where: "España, la merluza chica" },
    ],
    scientific: ["Merluccius hubbsi", "Merluccius gayi", "Merluccius australis", "Merluccius merluccius"],
    status: "kosher",
    note: "Las merluzas del género Merluccius figuran en la lista de la OU. Por el anisakis, un parásito que pueden traer, Star-K no la acepta ni con hejsher y KMD México la marca como problemática: preguntá a tu agencia cómo la trata.",
    sources: ["atz", "starK", "kmd", "caa"],
  },
  {
    id: "merluza-negra",
    name: "Merluza negra",
    also: [
      { name: "bacalao de profundidad" },
      { name: "róbalo de fondo" },
      { name: "mero chileno" },
      { name: "Chilean sea bass o Patagonian toothfish", where: "en inglés" },
    ],
    scientific: ["Dissostichus eleginoides"],
    status: "kosher",
    note: "Figura con nombre propio en la lista de la OU, y Star-K la acepta sin revisión de parásitos. No es merluza ni bacalao: los nombres confunden.",
    sources: ["atz", "starK", "caa", "esWiki"],
  },
  {
    id: "brotola",
    name: "Brótola",
    scientific: ["Urophycis brasiliensis"],
    status: "kosher",
    note: "La lista de la OU incluye a las brótolas del género Urophycis (en inglés, hakes) dentro de la familia del bacalao.",
    sources: ["atz", "caa"],
  },
  {
    id: "bacalao",
    name: "Bacalao",
    scientific: ["Gadus morhua", "Gadus macrocephalus"],
    status: "kosher",
    note: "Kosher. Star-K no lo acepta por anisakis. El bacalao salado sin piel no se puede identificar: compralo con piel o con hejsher. El «bacalao de profundidad» es la merluza negra, otro pez.",
    sources: ["atz", "starK"],
  },
  {
    id: "abadejo-de-alaska",
    name: "Abadejo de Alaska",
    also: [{ name: "colín de Alaska" }, { name: "walleye pollock", where: "en inglés" }],
    scientific: ["Gadus chalcogrammus", "Theragra chalcogramma"],
    status: "kosher",
    note: "Kosher. Es la base de muchos bastones de pescado y del surimi (kanikama): como todo procesado, necesitan hejsher. Star-K no acepta el de Alaska por anisakis.",
    sources: ["atz", "starK", "bdk"],
  },
  {
    id: "abadejo",
    name: "Abadejo",
    also: [
      { name: "abadejo", where: "Argentina y Uruguay" },
      { name: "congrio dorado", where: "Chile" },
      { name: "rosada" },
      { name: "kingklip", where: "Sudáfrica" },
      { name: "pink ling", where: "Australia" },
    ],
    scientific: ["Genypterus blacodes"],
    status: "disputed",
    note: "Sus escamas son diminutas y casi no se ven, y por eso se discute hace décadas. La Kashrut Authority de Australia lo acepta. En Sudáfrica, donde lo llaman kingklip, el Beit Din de Johannesburgo lo permitía en 2005, mientras rabinos jaredíes de esa ciudad, Rav Elyashiv y la Edá HaJaredit lo prohibían. Consultá a tu rabino. En España, «abadejo» es otro pez (Pollachius pollachius), de la familia del bacalao.",
    sources: ["ka", "kingklip", "caa", "esWiki"],
  },
  {
    id: "merluza-de-cola",
    name: "Merluza de cola",
    also: [{ name: "hoki" }],
    scientific: ["Macruronus magellanicus", "Macruronus novaezelandiae"],
    status: "disputed",
    note: "Las listas hablan del hoki de Nueva Zelanda: la de la OU lo pone entre los no kosher y la Kashrut Authority de Australia, entre los kosher. No encontramos un dictamen sobre la merluza de cola del Atlántico sur, que es otra especie del mismo género. Consultá a tu rabino.",
    sources: ["atz", "ka", "caa"],
  },

  // Corvinas y pescadillas
  {
    id: "corvina",
    name: "Corvina",
    also: [
      { name: "corvina blanca y corvina negra", where: "Argentina" },
      { name: "corvina de río", where: "Argentina" },
      { name: "corvina", where: "Chile y Perú, otra especie" },
    ],
    scientific: ["Micropogonias furnieri", "Pogonias cromis", "Plagioscion spp.", "Cilus gilberti", "Cynoscion spp."],
    status: "kosher",
    note: "Toda la familia de las corvinas (Sciaenidae) figura en la lista de la OU. Star-K no la acepta y KMD México la marca como problemática, en los dos casos por anisakis.",
    sources: ["atz", "starK", "kmd", "caa", "esWiki"],
  },
  {
    id: "pescadilla",
    name: "Pescadilla",
    also: [{ name: "pescadilla real" }],
    scientific: ["Cynoscion guatucupa", "Macrodon ancylodon"],
    status: "kosher",
    note: "Es de la familia de la corvina, que figura en la lista de la OU. En España, «pescadilla» es la merluza chica, también kosher.",
    sources: ["atz", "caa"],
  },

  // Peces de roca, pargos y meros
  {
    id: "besugo",
    name: "Besugo",
    also: [
      { name: "pargo", where: "España, para Pagrus pagrus" },
      { name: "sargo", where: "Argentina, Diplodus argenteus" },
    ],
    scientific: ["Pagrus pagrus", "Pagellus bogaraveo", "Diplodus argenteus"],
    status: "kosher",
    note: "La familia de los besugos y las doradas (Sparidae) figura en la lista de la OU. El mismo Pagrus pagrus que en Argentina se vende como besugo, en España es el pargo. Star-K no acepta algunos peces de esta familia por anisakis.",
    sources: ["atz", "starK", "caa"],
  },
  {
    id: "dorada",
    name: "Dorada",
    scientific: ["Sparus aurata"],
    status: "kosher",
    note: "De la familia de los besugos, que figura en la lista de la OU. Star-K acepta la de criadero sin revisión de parásitos. No confundir con el dorado.",
    sources: ["atz", "starK"],
  },
  {
    id: "pargo",
    name: "Pargo y huachinango",
    also: [
      { name: "huachinango", where: "México" },
      { name: "chillo", where: "Puerto Rico y República Dominicana" },
      { name: "red snapper", where: "en inglés" },
    ],
    scientific: ["Lutjanus campechanus", "Lutjanus peru", "Lutjanus spp."],
    status: "kosher",
    note: "Los pargos del género Lutjanus figuran en la lista de la OU. Con el nombre «red snapper» se venden también otras especies, no todas kosher: comprá con piel. KMD México acepta el huachinango del Golfo y marca el del Pacífico como problemático por anisakis.",
    sources: ["atz", "chabad", "kmd", "esWiki"],
  },
  {
    id: "mero",
    name: "Mero",
    also: [{ name: "cabrilla", where: "México" }, { name: "grouper", where: "en inglés" }],
    scientific: ["Epinephelus spp.", "Mycteroperca spp.", "Acanthistius spp."],
    status: "kosher",
    note: "La familia de los meros y las cabrillas (Serranidae) figura en la lista de la OU. KMD México pide revisar el mero y la cabrilla por parásitos.",
    sources: ["atz", "kmd", "caa"],
  },

  // Peces planos
  {
    id: "lenguado",
    name: "Lenguado",
    also: [{ name: "lenguado", where: "España, Solea solea" }],
    scientific: ["Paralichthys spp.", "Solea solea"],
    status: "kosher",
    note: "Los lenguados del género Paralichthys y el lenguado europeo figuran en la lista de la OU. En filete sin piel no se puede identificar: compralo entero, con piel o con hejsher. Star-K no acepta el sole y KMD México marca el lenguado de California como problemático, por anisakis.",
    sources: ["atz", "starK", "kmd", "caa"],
  },
  {
    id: "fletan",
    name: "Fletán o halibut",
    also: [{ name: "alabato", where: "México" }, { name: "fletán negro" }],
    scientific: ["Hippoglossus hippoglossus", "Hippoglossus stenolepis", "Reinhardtius hippoglossoides"],
    status: "kosher",
    note: "Figura en la lista de la OU. Star-K no lo acepta por anisakis y KMD México marca el del Pacífico como problemático. En inglés, al fletán negro también le dicen «Greenland turbot», pero no es el rodaballo.",
    sources: ["atz", "starK", "kmd"],
  },
  {
    id: "rodaballo",
    name: "Rodaballo",
    also: [{ name: "turbot", where: "en inglés" }],
    scientific: ["Scophthalmus maximus"],
    status: "not_kosher",
    note: "La lista de la OU lo excluye de los peces planos kosher, y la Kashrut Authority de Australia también lo pone entre los no kosher. Ojo: en inglés, «turbot» nombra además a otros peces planos que sí son kosher, y KMD México nombra un «rodaballo» en su lista de pescados con anisakis; si lo ves con su sello, preguntá a KMD qué especie es.",
    sources: ["atz", "ka", "kmd"],
  },

  // Pejerreyes, salmones y truchas
  {
    id: "pejerrey",
    name: "Pejerrey",
    also: [{ name: "pejerrey de mar" }, { name: "cornalito", where: "Argentina" }],
    scientific: ["Odontesthes bonariensis", "Odontesthes spp.", "Austroatherina incisa"],
    status: "kosher",
    note: "Es de la familia de los aterínidos (en inglés, silversides), que figura en la lista de la OU.",
    sources: ["atz", "caa"],
  },
  {
    id: "salmon",
    name: "Salmón",
    also: [{ name: "salmón del Atlántico" }, { name: "salmón coho" }],
    scientific: ["Salmo salar", "Oncorhynchus spp."],
    status: "kosher",
    note: "Kosher. La OU acepta el salmón fresco sin piel por el color de su carne, pero, como explica la BDK, al público general le recomienda comprarlo con piel. Star-K y KMD aceptan sin revisión el de criadero; el salvaje, no. El ahumado necesita hejsher. En Argentina, el «salmón de mar» y el «salmón del Paraná» son otros peces, que no figuran en estas listas.",
    sources: ["atz", "bdk", "starK", "kmd", "caa"],
  },
  {
    id: "trucha",
    name: "Trucha",
    also: [{ name: "trucha arcoíris" }, { name: "trucha marrón" }, { name: "trucha de arroyo" }, { name: "trucha salmonada" }],
    scientific: ["Oncorhynchus mykiss", "Salmo trutta", "Salvelinus fontanalis"],
    status: "kosher",
    note: "Kosher. Star-K y KMD México la aceptan sin revisión de parásitos.",
    sources: ["atz", "starK", "kmd", "caa"],
  },

  // Atunes, caballas y parientes
  {
    id: "atun",
    name: "Atún",
    also: [
      { name: "albacora", where: "Argentina, Thunnus alalunga" },
      { name: "bonito del norte", where: "España, Thunnus alalunga" },
      { name: "rabil o aleta amarilla" },
      { name: "patudo" },
      { name: "atún rojo" },
      { name: "barrilete o skipjack" },
    ],
    scientific: ["Thunnus spp.", "Katsuwonus pelamis"],
    status: "kosher",
    note: "Los atunes de los géneros Thunnus y Katsuwonus figuran en la lista de la OU. Con el nombre «atún» a veces se venden otros peces, y no todos son kosher. El atún en lata necesita hejsher, como todo pescado procesado.",
    sources: ["atz", "chabad", "bdk", "starK", "kmd", "caa"],
  },
  {
    id: "bonito",
    name: "Bonito",
    scientific: ["Sarda sarda", "Sarda chiliensis"],
    status: "kosher",
    note: "De la familia del atún y la caballa, en la lista de la OU. En España, el «bonito del norte» es un atún (Thunnus alalunga), también kosher.",
    sources: ["atz", "caa"],
  },
  {
    id: "caballa",
    name: "Caballa",
    also: [{ name: "magrú", where: "Argentina" }],
    scientific: ["Scomber colias", "Scomber japonicus", "Scomber scombrus"],
    status: "kosher",
    note: "Kosher. Star-K no la acepta por anisakis. La «caballa blanca» argentina (Thyrsitops lepidopoides) es de otra familia y no figura como kosher en estas listas.",
    sources: ["atz", "starK", "caa"],
  },
  {
    id: "sierra",
    name: "Sierra",
    also: [{ name: "Spanish mackerel", where: "en inglés" }],
    scientific: ["Scomberomorus spp."],
    status: "kosher",
    note: "La lista de la OU incluye a las sierras del género Scomberomorus. En Chile, «sierra» es otro pez (Thyrsites atun), y en Argentina también se llama así a la caballa blanca: ninguno de los dos figura como kosher en estas listas.",
    sources: ["atz", "caa", "esWiki"],
  },
  {
    id: "jurel",
    name: "Jurel",
    also: [{ name: "chicharro", where: "España" }],
    scientific: ["Trachurus spp.", "Trachurus murphyi"],
    status: "kosher",
    note: "La lista de la OU incluye a los jureles dentro de la familia Carangidae, con una excepción: el zapatero (Oligoplites saurus), que no es kosher.",
    sources: ["atz", "caa"],
  },
  {
    id: "pez-limon",
    name: "Pez limón",
    also: [
      { name: "dorado o palometa", where: "Chile" },
      { name: "vidriola", where: "Chile, isla Robinson Crusoe" },
      { name: "jurel de Castilla", where: "México" },
      { name: "esmedregal", where: "México" },
    ],
    scientific: ["Seriola lalandi", "Seriola rivoliana"],
    status: "kosher",
    note: "Las seriolas figuran en la lista de la OU. KMD México marca el esmedregal como problemático por anisakis.",
    sources: ["atz", "kmd", "caa", "esWiki"],
  },
  {
    id: "pampano",
    name: "Pámpano y palometa",
    also: [{ name: "palometa", where: "México" }, { name: "palometa de mar", where: "Argentina, Parona signata" }],
    scientific: ["Trachinotus spp.", "Parona signata"],
    status: "kosher",
    note: "La familia de los pámpanos y los jureles (Carangidae) figura en la lista de la OU, salvo el zapatero. KMD México marca las palometas como problemáticas por anisakis.",
    sources: ["atz", "kmd", "caa"],
  },
  {
    id: "dorado",
    name: "Dorado o mahi-mahi",
    also: [{ name: "lampuga" }, { name: "perico" }],
    scientific: ["Coryphaena hippurus"],
    status: "kosher",
    note: "Kosher. Star-K y KMD México lo aceptan sin revisión de parásitos. En la cuenca del Plata, «dorado» es otro pez de río (Salminus brasiliensis) que no figura en estas listas, y en Chile también se le dice dorado al pez limón.",
    sources: ["atz", "starK", "kmd", "caa", "esWiki"],
  },

  // Sardinas, anchoas y arenques
  {
    id: "sardina",
    name: "Sardina",
    also: [{ name: "sardina fueguina", where: "Argentina" }, { name: "sardinela" }],
    scientific: ["Sardina pilchardus", "Sardinops sagax", "Sardinella spp.", "Sprattus fuegensis"],
    status: "kosher",
    note: "La familia de las sardinas y los arenques figura en la lista de la OU. En lata necesita hejsher: Star-K y KMD aceptan las enteras solo de Marruecos y Filipinas, y las sin piel ni espinas de cualquier origen con supervisión. En Argentina, una lata de «sardinas argentinas» puede ser anchoíta.",
    sources: ["atz", "starK", "kmd", "caa"],
  },
  {
    id: "anchoa",
    name: "Anchoa, anchoíta y boquerón",
    also: [
      { name: "anchoíta", where: "Argentina y Uruguay" },
      { name: "anchoveta", where: "Perú y Chile" },
      { name: "boquerón", where: "España" },
    ],
    scientific: ["Engraulis anchoita", "Engraulis ringens", "Engraulis encrasicolus"],
    status: "kosher",
    note: "La familia de las anchoas (Engraulidae) figura en la lista de la OU. Saladas, en aceite o en pasta necesitan hejsher. No confundir con la anchoa de banco, que es otro pez.",
    sources: ["atz", "bdk", "caa", "esWiki"],
  },
  {
    id: "anchoa-de-banco",
    name: "Anchoa de banco",
    also: [{ name: "anjova" }, { name: "bluefish", where: "en inglés" }],
    scientific: ["Pomatomus saltatrix"],
    status: "kosher",
    note: "Figura en la lista de la OU. Star-K no la acepta y KMD México marca la anjova como problemática, por anisakis.",
    sources: ["atz", "starK", "kmd", "caa"],
  },
  {
    id: "arenque",
    name: "Arenque",
    also: [{ name: "herring", where: "en inglés" }],
    scientific: ["Clupea harengus", "Clupea pallasii"],
    status: "kosher",
    note: "Pierde las escamas al salir del agua y es kosher igual. En escabeche, ahumado o en crema necesita hejsher. Star-K y KMD México lo aceptan sin revisión de parásitos.",
    sources: ["atz", "bdk", "starK", "kmd"],
  },

  // Otros de mar
  {
    id: "lisa",
    name: "Lisa",
    also: [{ name: "mújol", where: "España" }, { name: "mullet", where: "en inglés" }],
    scientific: ["Mugil spp."],
    status: "kosher",
    note: "Kosher. Star-K la acepta sin revisión de parásitos.",
    sources: ["atz", "starK", "caa"],
  },
  {
    id: "salmonete",
    name: "Salmonete y trilla",
    also: [{ name: "trilla", where: "Argentina" }],
    scientific: ["Mullus surmuletus", "Mullus barbatus", "Mullus argentinae"],
    status: "kosher",
    note: "La familia de los salmonetes (Mullidae) figura en la lista de la OU. No es un salmón.",
    sources: ["atz", "caa"],
  },
  {
    id: "lubina",
    name: "Lubina o branzino",
    scientific: ["Dicentrarchus labrax"],
    status: "kosher",
    note: "Star-K la nombra como branzino entre los pescados que acepta sin revisión de parásitos, solo la de criadero.",
    sources: ["starK"],
  },
  {
    id: "robalo",
    name: "Robalo",
    also: [{ name: "snook", where: "en inglés" }],
    scientific: ["Centropomus spp."],
    status: "kosher",
    note: "La lista de la OU incluye a los robalos del género Centropomus, y KMD México los acepta sin revisión de parásitos. En la Patagonia y en Chile, el «róbalo» es otro pez (Eleginops maclovinus) que no figura en estas listas.",
    sources: ["atz", "kmd", "caa", "esWiki"],
  },
  {
    id: "reineta",
    name: "Reineta",
    also: [{ name: "pez hacha" }],
    scientific: ["Brama australis"],
    status: "kosher",
    note: "La lista de la OU la nombra junto al pomfret del Atlántico, de la misma familia (Bramidae).",
    sources: ["atz", "esWiki"],
  },
  {
    id: "pez-de-san-pedro",
    name: "Pez de San Pedro",
    also: [{ name: "John Dory", where: "en inglés" }],
    scientific: ["Zeus faber"],
    status: "kosher",
    note: "Figura en la lista de la OU. La Kashrut Authority de Australia lo acepta solo entero.",
    sources: ["atz", "ka"],
  },

  // De agua dulce y de criadero
  {
    id: "tilapia",
    name: "Tilapia",
    also: [{ name: "mojarra", where: "México" }],
    scientific: ["Oreochromis niloticus", "Oreochromis spp."],
    status: "kosher",
    note: "La familia de la tilapia (Cichlidae) figura en la lista de la OU, igual que las mojarras (Gerreidae). Star-K y KMD México la aceptan sin revisión de parásitos. Con el nombre «tilapia» se venden especies distintas: comprala con piel.",
    sources: ["atz", "chabad", "starK", "kmd"],
  },
  {
    id: "carpa",
    name: "Carpa",
    scientific: ["Cyprinus carpio"],
    status: "kosher",
    note: "Kosher, y junto con el lucio, la base clásica del guefilte fish. Star-K la acepta sin revisión de parásitos.",
    sources: ["atz", "starK"],
  },
  {
    id: "lucio",
    name: "Lucio",
    scientific: ["Esox lucius"],
    status: "kosher",
    note: "Kosher. Star-K lo acepta sin revisión de parásitos.",
    sources: ["atz", "starK"],
  },

  // No kosher
  {
    id: "bagre",
    name: "Bagre",
    also: [
      { name: "bagre amarillo y bagre de mar", where: "Argentina" },
      { name: "patí, armado, manduví", where: "Argentina, de río" },
      { name: "catfish", where: "en inglés" },
    ],
    scientific: ["Pimelodus spp.", "Genidens barbus", "Luciopimelodus pati", "Ictalurus punctatus"],
    status: "not_kosher",
    note: "Los bagres (orden Siluriformes) no tienen escamas: ninguno es kosher.",
    sources: ["atz", "ka", "caa"],
  },
  {
    id: "surubi",
    name: "Surubí",
    also: [{ name: "pintado o surubim", where: "Brasil" }],
    scientific: ["Pseudoplatystoma spp."],
    status: "not_kosher",
    note: "Es un bagre (orden Siluriformes), sin escamas.",
    sources: ["atz", "caa"],
  },
  {
    id: "panga",
    name: "Panga, basa o pangasius",
    also: [{ name: "tra" }],
    scientific: ["Pangasius hypophthalmus", "Pangasius bocourti"],
    status: "not_kosher",
    note: "Es un bagre de criadero que se vende en filetes congelados. La lista de la OU y la Kashrut Authority de Australia lo ponen entre los no kosher.",
    sources: ["atz", "ka"],
  },
  {
    id: "cazon",
    name: "Cazón, gatuzo y tiburón",
    also: [{ name: "gatuzo", where: "Argentina" }, { name: "tollo", where: "Chile" }],
    scientific: ["Galeorhinus galeus", "Mustelus spp."],
    status: "not_kosher",
    note: "Los tiburones tienen escamas que no salen sin romper la piel, así que no son kosher. En filete no se reconocen: comprá con piel o con hejsher.",
    sources: ["atz", "bdk", "caa", "esWiki"],
  },
  {
    id: "raya",
    name: "Raya y chucho",
    scientific: ["Rajidae", "Myliobatidae", "Potamotrygon spp."],
    status: "not_kosher",
    note: "Rayas y chuchos son parientes de los tiburones y no son kosher.",
    sources: ["atz", "ka", "caa"],
  },
  {
    id: "anguila",
    name: "Anguila",
    scientific: ["Anguilla anguilla", "Anguilla rostrata"],
    status: "not_kosher",
    note: "Tiene escamas, pero no se pueden quitar sin lastimar la piel.",
    sources: ["atz", "bdk", "ka"],
  },
  {
    id: "congrio",
    name: "Congrio",
    also: [{ name: "congrio", where: "Argentina y España" }],
    scientific: ["Conger conger"],
    status: "not_kosher",
    note: "Es una anguila de mar. En Chile, en cambio, el congrio (dorado, colorado o negro) es otro pez, del mismo género que el abadejo argentino: mirá «Abadejo».",
    sources: ["atz", "caa", "esWiki"],
  },
  {
    id: "rape",
    name: "Rape",
    also: [{ name: "monkfish", where: "en inglés" }],
    scientific: ["Lophius spp."],
    status: "not_kosher",
    note: "No tiene escamas. Figura entre los no kosher de la OU y de la Kashrut Authority de Australia.",
    sources: ["atz", "ka"],
  },
  {
    id: "pez-sable",
    name: "Pez sable",
    also: [{ name: "sable", where: "Argentina" }],
    scientific: ["Trichiurus lepturus", "Lepidopus caudatus"],
    status: "not_kosher",
    note: "La familia de los peces sable (Trichiuridae) figura entre los no kosher de la OU.",
    sources: ["atz", "caa"],
  },

  // Discutidos
  {
    id: "pez-espada",
    name: "Pez espada",
    also: [{ name: "emperador" }, { name: "swordfish", where: "en inglés" }],
    scientific: ["Xiphias gladius"],
    status: "disputed",
    note: "De joven tiene escamas y de adulto las pierde. La OU, la BDK, Chabad y la Kashrut Authority de Australia lo consideran no kosher. Hubo comunidades que lo comían y otras que no, y la discusión sigue: seguí la práctica de tu comunidad y consultá a tu rabino.",
    sources: ["atz", "bdk", "swordfish", "ka", "swordfishDebate", "caa"],
  },
  {
    id: "esturion",
    name: "Esturión",
    also: [{ name: "caviar", where: "sus huevas" }],
    scientific: ["Acipenser spp.", "Huso huso"],
    status: "disputed",
    note: "Sus escamas no salen sin romper la piel, y por eso las agencias ortodoxas no lo aceptan, ni a su caviar. La discusión es vieja: en 1798 dos rabinos de Hungría sostuvieron posiciones opuestas. Las huevas rojas de pescado kosher, como las de salmón, se aceptan; hay quien pide hejsher igual.",
    sources: ["atz", "bdk", "sturgeon", "ka", "sturgeonHistory"],
  },
];

/** Para el buscador: minúsculas y sin tildes. */
export function foldText(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
// creado por pato dev y askforvini
