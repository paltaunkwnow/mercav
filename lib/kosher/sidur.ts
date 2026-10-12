/**
 * Sidur de bolsillo: berajot y oraciones cortas de todos los días.
 * Hebreo con nikud (cotejado con Sefaria; el Nombre va como יְיָ, como en muchos sidurim), transliteración
 * pensada para leer en español y traducción propia. Las costumbres cambian según la comunidad: cada texto
 * aclara las variantes más comunes y manda a consultar con el rabino. Sin dependencias: sirve en el cliente.
 */

export const SIDUR_CATEGORIES = [
  { id: "manana", label: "Al despertar y cada día" },
  { id: "mesa", label: "En la mesa" },
  { id: "shabat", label: "Shabat" },
  { id: "festividades", label: "Festividades" },
  { id: "vida", label: "Momentos de la vida" },
  { id: "naturaleza", label: "Naturaleza" },
  { id: "viaje", label: "Viaje" },
] as const;

export type SidurCategoryId = (typeof SIDUR_CATEGORIES)[number]["id"];

export type SidurPart = { label?: string; he: string; tr: string; es: string };

export type SidurEntry = {
  slug: string;
  category: SidurCategoryId;
  /** Título visible: el nombre con el que se la busca. */
  name: string;
  /** Subtítulo en una línea. */
  about: string;
  parts: SidurPart[];
  /** Cuándo se dice. */
  when: string;
  /** Variantes por nusaj o costumbre. */
  notes?: string[];
  /** Si mostramos solo una parte del texto, qué falta y dónde está. */
  partial?: string;
  source?: { label: string; url: string };
  /** Festividades relacionadas (slugs de lib/kosher/festivals.ts). */
  festivals?: string[];
  /** Mostrar el enlace a los horarios de la ciudad. */
  calendarLink?: boolean;
  keywords?: string[];
};

/** Fecha de la última revisión de los textos (para los datos estructurados). */
export const SIDUR_UPDATED = "2026-10-12";

const BARUJ_HE = "בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם";
const BARUJ_TR = "Baruj Atá Adonai, Eloheinu Mélej haolam";
const BARUJ_ES = "Bendito seas, Hashem, nuestro Di-s, Rey del universo";

const MITZVA_HE = "אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ";
const MITZVA_TR = "asher kideshanu bemitzvotav vetzivanu";
const MITZVA_ES = "que nos santificó con Sus mitzvot y nos ordenó";

/** Berajá con la fórmula de apertura. */
function b(he: string, tr: string, es: string, label?: string): SidurPart {
  return { label, he: `${BARUJ_HE}, ${he}`, tr: `${BARUJ_TR}, ${tr}`, es: `${BARUJ_ES}, ${es}` };
}

/** Berajá sobre una mitzvá: «que nos santificó con Sus mitzvot y nos ordenó…». */
function m(he: string, tr: string, es: string, label?: string): SidurPart {
  return b(`${MITZVA_HE} ${he}`, `${MITZVA_TR} ${tr}`, `${MITZVA_ES} ${es}`, label);
}

const SHEHEJEIANU = (label?: string) =>
  b("שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.", "shehejeianu vekiimanu vehiguianu lazmán hazé.", "que nos dio vida, nos sostuvo y nos permitió llegar a este momento.", label);
const HAGAFEN = (label?: string) => b("בּוֹרֵא פְּרִי הַגָּפֶן.", "boré pri hagáfen.", "Creador del fruto de la vid.", label);
const HAETZ = (label?: string) => b("בּוֹרֵא פְּרִי הָעֵץ.", "boré pri haetz.", "Creador del fruto del árbol.", label);

const SEFARIA = "https://www.sefaria.org/";
const sefaria = (ref: string, label: string) => ({ label, url: `${SEFARIA}${ref.replace(/ /g, "_")}` });
const ASHKENAZ = "Sidur ashkenazí en Sefaria";
const SEFARD = "Sidur nusaj sefard en Sefaria";

export const SIDUR: SidurEntry[] = [
  // Al despertar y cada día
  {
    slug: "mode-ani",
    category: "manana",
    name: "Modé aní",
    about: "Agradecer al despertar",
    parts: [
      {
        he: "מוֹדֶה אֲנִי לְפָנֶיךָ, מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.",
        tr: "Modé aní lefaneja, Mélej jai vekaiam, shehejezarta bi nishmatí bejemlá, rabá emunateja.",
        es: "Te agradezco, Rey vivo y eterno, porque con compasión me devolviste el alma. Grande es Tu fidelidad.",
      },
    ],
    when: "Apenas te despertás, todavía en la cama. No menciona el Nombre de Hashem, así que se dice antes de lavarte las manos.",
    notes: ["Las mujeres dicen מוֹדָה אֲנִי (Modá aní)."],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Modeh Ani", ASHKENAZ),
    keywords: ["despertar", "mañana", "gracias", "modeh ani"],
  },
  {
    slug: "netilat-iadaim",
    category: "manana",
    name: "Netilat iadáim",
    about: "El lavado de manos",
    parts: [m("עַל נְטִילַת יָדָיִם.", "al netilat iadáim.", "lavarnos las manos.")],
    when:
      "A la mañana, después de lavarte las manos con un recipiente, vertiendo agua sobre cada mano en forma alternada. También antes de comer pan: se dice al terminar de lavarse, antes de secarse o mientras, y no se habla hasta decir Hamotzí.",
    notes: ["Cuántas veces se vierte el agua y en qué orden depende de la costumbre de tu familia o de tu comunidad."],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Netilat Yadayim", ASHKENAZ),
    keywords: ["lavado de manos", "manos", "agua", "pan", "netilat yadayim"],
  },
  {
    slug: "asher-iatzar",
    category: "manana",
    name: "Asher iatzar",
    about: "Gratitud por el cuerpo",
    parts: [
      b(
        "אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה, וּבָרָא בוֹ נְקָבִים נְקָבִים, חֲלוּלִים חֲלוּלִים. גָּלוּי וְיָדוּעַ לִפְנֵי כִסֵּא כְבוֹדֶךָ, שֶׁאִם יִפָּתֵחַ אֶחָד מֵהֶם, אוֹ יִסָּתֵם אֶחָד מֵהֶם, אִי אֶפְשַׁר לְהִתְקַיֵּם וְלַעֲמֹד לְפָנֶיךָ אֲפִילוּ שָׁעָה אֶחָת. בָּרוּךְ אַתָּה יְיָ, רוֹפֵא כָל בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת.",
        "asher iatzar et haadam bejojmá, uvará vo nekavim nekavim, jalulim jalulim. Galui veiadúa lifnei jisé jevodeja, sheím ipatéaj ejad mehem, o isatem ejad mehem, i efshar lehitkaiem velaamod lefaneja afilú shaá ejat. Baruj Atá Adonai, rofé jol basar umaflí laasot.",
        "que formó al ser humano con sabiduría y creó en él aberturas y conductos. Ante Tu trono de gloria es sabido y evidente que, si uno de ellos se abriera o uno de ellos se cerrara, no sería posible seguir con vida y estar en Tu presencia ni siquiera una hora. Bendito seas, Hashem, que cura a todo ser y obra maravillas.",
      ),
    ],
    when: "Cada vez que salís del baño, después de lavarte las manos. Muchos la dicen también a la mañana, junto con las primeras bendiciones del día.",
    notes: ["Algunas versiones no incluyen las palabras אֲפִילוּ שָׁעָה אֶחָת (afilú shaá ejat)."],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Asher Yatzar", ASHKENAZ),
    keywords: ["baño", "cuerpo", "salud"],
  },
  {
    slug: "elohai-neshama",
    category: "manana",
    name: "Elohai neshamá",
    about: "Gratitud por el alma",
    parts: [
      {
        he: "אֱלֹהַי, נְשָׁמָה שֶׁנָּתַתָּ בִּי טְהוֹרָה הִיא. אַתָּה בְרָאתָהּ, אַתָּה יְצַרְתָּהּ, אַתָּה נְפַחְתָּהּ בִּי, וְאַתָּה מְשַׁמְּרָהּ בְּקִרְבִּי, וְאַתָּה עָתִיד לִטְּלָהּ מִמֶּנִּי, וּלְהַחֲזִירָהּ בִּי לֶעָתִיד לָבֹא. כָּל זְמַן שֶׁהַנְּשָׁמָה בְקִרְבִּי, מוֹדֶה אֲנִי לְפָנֶיךָ, יְיָ אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, רִבּוֹן כָּל הַמַּעֲשִׂים, אֲדוֹן כָּל הַנְּשָׁמוֹת. בָּרוּךְ אַתָּה יְיָ, הַמַּחֲזִיר נְשָׁמוֹת לִפְגָרִים מֵתִים.",
        tr: "Elohai, neshamá shenatata bi tehorá hi. Atá verata, Atá ietzarta, Atá nefajta bi, veAtá meshamrá bekirbí, veAtá atid litlá mimeni, ulehajazirá bi leatid lavó. Kol zman shehaneshamá vekirbí, modé aní lefaneja, Adonai Elohai vElohei avotai, ribón kol hamaasim, adón kol haneshamot. Baruj Atá Adonai, hamajazir neshamot lifgarim metim.",
        es: "Di-s mío, el alma que pusiste en mí es pura. Vos la creaste, Vos la formaste, Vos la soplaste en mí; Vos la cuidás dentro de mí, y un día me la vas a quitar para devolvérmela en el tiempo por venir. Mientras el alma esté dentro de mí, te agradezco, Hashem, Di-s mío y Di-s de mis padres, Soberano de todas las obras, Dueño de todas las almas. Bendito seas, Hashem, que devuelve las almas a los cuerpos sin vida.",
      },
    ],
    when: "A la mañana, entre las primeras bendiciones del día (birkot hashajar). Muchos la dicen a continuación de Asher iatzar.",
    notes: ["Las mujeres dicen מוֹדָה אֲנִי (modá aní)."],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Elokai Neshama", ASHKENAZ),
    keywords: ["alma", "neshama", "mañana", "birkot hashajar"],
  },
  {
    slug: "birkot-hatora",
    category: "manana",
    name: "Birkot hatorá",
    about: "Las bendiciones de la Torá",
    parts: [
      m("לַעֲסֹק בְּדִבְרֵי תוֹרָה.", "laasok bedivrei Torá.", "ocuparnos de las palabras de la Torá.", "Primera bendición"),
      {
        label: "Segunda bendición",
        he: "וְהַעֲרֶב נָא יְיָ אֱלֹהֵינוּ אֶת דִּבְרֵי תוֹרָתְךָ בְּפִינוּ וּבְפִי עַמְּךָ בֵּית יִשְׂרָאֵל, וְנִהְיֶה אֲנַחְנוּ וְצֶאֱצָאֵינוּ וְצֶאֱצָאֵי עַמְּךָ בֵּית יִשְׂרָאֵל, כֻּלָּנוּ יוֹדְעֵי שְׁמֶךָ וְלוֹמְדֵי תוֹרָתֶךָ לִשְׁמָהּ. בָּרוּךְ אַתָּה יְיָ, הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל.",
        tr: "Vehaarev na Adonai Eloheinu et divrei Torateja befinu uvefí amjá beit Israel, venihié anajnu vetzeetzaeinu vetzeetzaei amjá beit Israel, kulanu iodeei shmeja velomdei Torateja lishmá. Baruj Atá Adonai, hamelamed Torá leamó Israel.",
        es: "Hashem, nuestro Di-s, hacé que las palabras de Tu Torá sean dulces en nuestra boca y en la boca de Tu pueblo, la casa de Israel. Que nosotros, nuestros descendientes y los descendientes de Tu pueblo, la casa de Israel, conozcamos todos Tu Nombre y estudiemos Tu Torá por amor a ella. Bendito seas, Hashem, que enseña Torá a Su pueblo Israel.",
      },
      b(
        "אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה יְיָ, נוֹתֵן הַתּוֹרָה.",
        "asher bajar banu mikol haamim venatan lanu et Torató. Baruj Atá Adonai, notén haTorá.",
        "que nos eligió entre todos los pueblos y nos dio Su Torá. Bendito seas, Hashem, que da la Torá.",
        "Tercera bendición",
      ),
    ],
    when: "A la mañana, antes de estudiar o de rezar, una vez por día. Cubren todo el estudio de Torá de ese día.",
    notes: ["En el nusaj sefaradí la primera termina עַל דִּבְרֵי תוֹרָה (al divrei Torá)."],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Torah Blessings", ASHKENAZ),
    keywords: ["torá", "estudio", "mañana"],
  },
  {
    slug: "shema-israel",
    category: "manana",
    name: "Shemá Israel",
    about: "La declaración de fe",
    parts: [
      {
        he: "שְׁמַע יִשְׂרָאֵל, יְיָ אֱלֹהֵינוּ, יְיָ אֶחָד.",
        tr: "Shemá Israel, Adonai Eloheinu, Adonai ejad.",
        es: "Escuchá, Israel: Hashem es nuestro Di-s, Hashem es uno.",
      },
      {
        label: "En voz baja",
        he: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.",
        tr: "Baruj shem kevod maljutó leolam vaed.",
        es: "Bendito sea el Nombre de Su glorioso reinado por siempre jamás.",
      },
    ],
    when:
      "En la oración de la mañana y en la de la noche, antes de dormir y en muchos momentos de la vida. Al decir el primer versículo se acostumbra taparse los ojos con la mano derecha. La segunda línea se dice en voz baja, salvo en Iom Kipur.",
    partial: "Mostramos el primer versículo (Devarim 6:4) y la respuesta. La Shemá completa sigue con tres pasajes de la Torá, que están en tu sidur.",
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Blessings of the Shema, Shema", "La Shemá completa en Sefaria"),
    keywords: ["shema", "noche", "dormir", "fe", "oración"],
  },
  {
    slug: "talit-y-tzitzit",
    category: "manana",
    name: "Talit y tzitzit",
    about: "Al ponerse el talit",
    parts: [
      m("לְהִתְעַטֵּף בַּצִּיצִית.", "lehitatef batzitzit.", "envolvernos con el tzitzit.", "Al ponerse el talit"),
      m("עַל מִצְוַת צִיצִית.", "al mitzvat tzitzit.", "la mitzvá del tzitzit.", "Al ponerse el talit katán"),
    ],
    when:
      "De día. El talit se pone para la oración de la mañana; el talit katán, la prenda con flecos que se usa debajo de la ropa, al vestirse. Quien se pone los dos suele decir solo la bendición del talit, pensando también en el otro; las costumbres varían.",
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Tallit", ASHKENAZ),
    keywords: ["talit", "tallit", "tzitzit", "flecos"],
  },
  {
    slug: "tefilin",
    category: "manana",
    name: "Tefilín",
    about: "Al colocarse los tefilín",
    parts: [
      m("לְהָנִיחַ תְּפִלִּין.", "lehaníaj tefilín.", "colocarnos los tefilín.", "Tefilín del brazo"),
      m("עַל מִצְוַת תְּפִלִּין.", "al mitzvat tefilín.", "la mitzvá de los tefilín.", "Tefilín de la cabeza (costumbre ashkenazí)"),
    ],
    when: "Los días de semana, en la oración de la mañana. No se ponen en Shabat ni en iom tov.",
    notes: [
      "Los ashkenazim dicen la segunda bendición al colocar el de la cabeza y agregan בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד; los sefaradíes dicen solo la primera.",
      "Sobre ponerlos en jol hamoed hay costumbres distintas: consultá con tu rabino.",
    ],
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Tefillin", ASHKENAZ),
    keywords: ["tefilin", "tefillin", "filacterias", "mañana"],
  },

  // En la mesa
  {
    slug: "hamotzi",
    category: "mesa",
    name: "Hamotzí",
    about: "La bendición del pan",
    parts: [b("הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.", "hamotzí léjem min haáretz.", "que hace salir el pan de la tierra.")],
    when:
      "Antes de comer pan hecho con trigo, cebada, centeno, avena o espelta, después de la netilat iadáim. En general cubre lo que se come como parte de esa comida; el vino y algunos postres llevan su propia bendición. En Shabat y en las fiestas se dice sobre dos panes enteros.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["pan", "jalá", "challah", "comida", "hamotzi"],
  },
  {
    slug: "mezonot",
    category: "mesa",
    name: "Mezonot",
    about: "Masas, pastas y cereales",
    parts: [b("בּוֹרֵא מִינֵי מְזוֹנוֹת.", "boré minei mezonot.", "Creador de distintas clases de alimento.")],
    when: "Antes de comer masas, galletitas, tortas, fideos y otros alimentos hechos con los cinco cereales que no son pan. También se dice sobre el arroz.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["torta", "galletitas", "pasta", "fideos", "arroz", "cereales", "masas"],
  },
  {
    slug: "hagafen",
    category: "mesa",
    name: "Hagáfen",
    about: "El vino y el jugo de uva",
    parts: [HAGAFEN()],
    when: "Antes de tomar vino o jugo de uva. Es también la bendición del vino en el Kidush y en la Havdalá.",
    notes: ["Los sefaradíes pronuncian הַגֶּפֶן (haguéfen)."],
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["vino", "uva", "jugo de uva", "hagafen"],
  },
  {
    slug: "haetz",
    category: "mesa",
    name: "Haetz",
    about: "Las frutas de árbol",
    parts: [HAETZ()],
    when: "Antes de comer frutas que crecen en árboles: manzanas, peras, naranjas, uvas, duraznos, nueces o dátiles.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["fruta", "manzana", "naranja", "nueces", "árbol"],
  },
  {
    slug: "haadama",
    category: "mesa",
    name: "Haadamá",
    about: "Verduras y frutos de la tierra",
    parts: [b("בּוֹרֵא פְּרִי הָאֲדָמָה.", "boré pri haadamá.", "Creador del fruto de la tierra.")],
    when:
      "Antes de comer verduras, legumbres y frutas que no crecen en árboles, como bananas, frutillas, sandía o papas. Para algunos alimentos hay opiniones distintas: ante la duda, consultá.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["verdura", "papa", "banana", "frutilla", "legumbres", "ensalada"],
  },
  {
    slug: "shehakol",
    category: "mesa",
    name: "Shehakol",
    about: "Todo lo demás",
    parts: [b("שֶׁהַכֹּל נִהְיָה בִּדְבָרוֹ.", "shehakol nihiá bidvaró.", "por cuya palabra todo existe.")],
    when:
      "Antes de comer o tomar lo que no crece de la tierra, o lo que perdió su forma original: carne, pescado, huevos, lácteos, golosinas, agua y casi todas las bebidas, salvo el vino.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Barachot Rishonot", ASHKENAZ),
    keywords: ["carne", "pescado", "huevo", "leche", "queso", "agua", "bebida", "chocolate", "golosinas"],
  },
  {
    slug: "bore-nefashot",
    category: "mesa",
    name: "Boré nefashot",
    about: "La bendición final breve",
    parts: [
      b(
        "בּוֹרֵא נְפָשׁוֹת רַבּוֹת וְחֶסְרוֹנָן, עַל כָּל מַה שֶּׁבָּרָאתָ לְהַחֲיוֹת בָּהֶם נֶפֶשׁ כָּל חָי. בָּרוּךְ חֵי הָעוֹלָמִים.",
        "boré nefashot rabot vejesronán, al kol ma shebarata lehajaiot bahem nefesh kol jai. Baruj jei haolamim.",
        "Creador de muchos seres vivos y de lo que les falta, por todo lo que creaste para dar vida con ello a cada ser viviente. Bendito sea Quien vive por siempre.",
      ),
    ],
    when:
      "Después de comer o tomar algo que no lleva Birkat hamazón ni Al hamijiá: frutas que no son de las siete especies, verduras, carne, lácteos o bebidas que no son vino, siempre que se haya comido o tomado la cantidad mínima que fija la halajá.",
    notes: ["Los sefaradíes terminan בָּרוּךְ חַי הָעוֹלָמִים (baruj jai haolamim)."],
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Borei Nefashot", ASHKENAZ),
    keywords: ["después de comer", "bendición final", "berajá ajaroná"],
  },
  {
    slug: "al-hamijia",
    category: "mesa",
    name: "Al hamijiá",
    about: "Después de masas, vino o las siete especies",
    parts: [
      b(
        "עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה, וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ, לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ…",
        "al hamijiá veal hakaljalá, veal tenuvat hasadé, veal éretz jemdá tová urjavá, sheratzita vehinjalta laavoteinu, leejol mipiriá velisbóa mituvá…",
        "por el sustento y la alimentación, por el fruto del campo y por la tierra deseable, buena y amplia que quisiste dar en herencia a nuestros padres, para comer de su fruto y saciarse de su bondad…",
      ),
    ],
    when:
      "Después de comer masas o alimentos de los cinco cereales (lo que lleva Mezonot), después del vino o del jugo de uva, y después de las frutas de las siete especies: uvas, higos, granadas, aceitunas y dátiles.",
    partial:
      "Mostramos el comienzo, en la versión para masas y cereales. La bendición sigue con un pedido por Jerusalén y cambia según lo que comiste (vino, frutas de las siete especies) y según el día (Shabat, Rosh Jodesh, fiestas). El texto completo está en tu sidur.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Eating, Brachot Achronot, Al Hamichyah", "El texto completo en Sefaria"),
    keywords: ["meein shalosh", "después de comer", "torta", "vino", "dátiles", "siete especies"],
  },
  {
    slug: "birkat-hamazon",
    category: "mesa",
    name: "Birkat hamazón",
    about: "La bendición después de comer pan",
    parts: [
      b(
        "הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ, בְּחֵן בְּחֶסֶד וּבְרַחֲמִים. הוּא נוֹתֵן לֶחֶם לְכָל בָּשָׂר, כִּי לְעוֹלָם חַסְדּוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָסַר לָנוּ, וְאַל יֶחְסַר לָנוּ מָזוֹן לְעוֹלָם וָעֶד, בַּעֲבוּר שְׁמוֹ הַגָּדוֹל. כִּי הוּא אֵל זָן וּמְפַרְנֵס לַכֹּל, וּמֵטִיב לַכֹּל, וּמֵכִין מָזוֹן לְכָל בְּרִיּוֹתָיו אֲשֶׁר בָּרָא. בָּרוּךְ אַתָּה יְיָ, הַזָּן אֶת הַכֹּל.",
        "hazán et haolam kuló betuvó, bején bejésed uvrajamim. Hu notén léjem lejol basar, ki leolam jasdó. Uvetuvó hagadol tamid lo jasar lanu, veal iejsar lanu mazón leolam vaed, baavur shemó hagadol. Ki Hu El zan umefarnés lakol, umetiv lakol, umejín mazón lejol beriotav asher bará. Baruj Atá Adonai, hazán et hakol.",
        "que alimenta al mundo entero con Su bondad, con gracia, con amor y con misericordia. Él da pan a toda criatura, porque Su amor es eterno. Por Su gran bondad nunca nos faltó alimento, y que nunca nos falte, por Su gran Nombre. Porque Él es Di-s, que alimenta y sostiene a todos, hace el bien a todos y prepara alimento para todas las criaturas que creó. Bendito seas, Hashem, que alimenta a todos.",
        "Primera bendición",
      ),
    ],
    when: "Después de una comida en la que comiste pan. Si comieron juntos tres adultos o más, se empieza con el zimún, la invitación a bendecir.",
    partial:
      "Es la primera de las cuatro bendiciones. El texto completo, con el zimún, las bendiciones por la tierra y por Jerusalén y los agregados de Shabat y de las fiestas, es largo: leelo en tu sidur o en Sefaria.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat HaMazon", "El texto completo en Sefaria"),
    keywords: ["bendición después de comer", "bentchen", "benching", "zimún", "pan"],
  },
  {
    slug: "tevilat-kelim",
    category: "mesa",
    name: "Tevilat kelim",
    about: "Al sumergir utensilios nuevos",
    parts: [
      m("עַל טְבִילַת כֵּלִי.", "al tevilat kli.", "sumergir un utensilio.", "Para un utensilio"),
      m("עַל טְבִילַת כֵּלִים.", "al tevilat kelim.", "sumergir utensilios.", "Para varios"),
    ],
    when:
      "Antes de sumergir en una mikve de utensilios las piezas de metal o de vidrio que se usan con comida y que se compraron a un fabricante o vendedor no judío. Es parte de armar una cocina kosher. Qué utensilios llevan bendición depende del material: consultá con tu rabino.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkhot Hamitzvot", ASHKENAZ),
    keywords: ["kasherizar", "cocina", "ollas", "mikve", "utensilios", "vajilla"],
  },

  // Shabat
  {
    slug: "velas-de-shabat",
    category: "shabat",
    name: "Velas de Shabat",
    about: "Al encender las velas del viernes",
    parts: [m("לְהַדְלִיק נֵר שֶׁל שַׁבָּת.", "lehadlik ner shel Shabat.", "encender la vela de Shabat.")],
    when:
      "El viernes, antes de la puesta del sol (en general, 18 minutos antes; cada comunidad tiene su horario). En la costumbre ashkenazí se encienden las velas, se tapan los ojos y se dice la bendición; muchas familias sefaradíes la dicen antes de encender.",
    notes: ["En Jabad se dice לְהַדְלִיק נֵר שֶׁל שַׁבָּת קֹדֶשׁ (ner shel Shabat kódesh)."],
    source: sefaria("Siddur Sefard, Shabbat Candle Lighting", SEFARD),
    calendarLink: true,
    keywords: ["velas", "viernes", "encendido", "shabbat"],
  },
  {
    slug: "shalom-alejem",
    category: "shabat",
    name: "Shalom alejem",
    about: "La bienvenida del viernes a la noche",
    parts: [
      {
        he: "שָׁלוֹם עֲלֵיכֶם, מַלְאֲכֵי הַשָּׁרֵת, מַלְאֲכֵי עֶלְיוֹן, מִמֶּלֶךְ מַלְכֵי הַמְּלָכִים, הַקָּדוֹשׁ בָּרוּךְ הוּא.",
        tr: "Shalom aleijem, malajei hasharet, malajei elión, mimélej maljei hamlajim, haKadosh Baruj Hu.",
        es: "Paz con ustedes, ángeles servidores, ángeles del Altísimo, enviados del Rey de reyes, el Santo, bendito sea.",
      },
      {
        he: "בּוֹאֲכֶם לְשָׁלוֹם, מַלְאֲכֵי הַשָּׁלוֹם, מַלְאֲכֵי עֶלְיוֹן, מִמֶּלֶךְ מַלְכֵי הַמְּלָכִים, הַקָּדוֹשׁ בָּרוּךְ הוּא.",
        tr: "Boajem leshalom, malajei hashalom, malajei elión, mimélej maljei hamlajim, haKadosh Baruj Hu.",
        es: "Que lleguen en paz, ángeles de la paz, ángeles del Altísimo, enviados del Rey de reyes, el Santo, bendito sea.",
      },
      {
        he: "בָּרְכוּנִי לְשָׁלוֹם, מַלְאֲכֵי הַשָּׁלוֹם, מַלְאֲכֵי עֶלְיוֹן, מִמֶּלֶךְ מַלְכֵי הַמְּלָכִים, הַקָּדוֹשׁ בָּרוּךְ הוּא.",
        tr: "Barjuni leshalom, malajei hashalom, malajei elión, mimélej maljei hamlajim, haKadosh Baruj Hu.",
        es: "Bendíganme con paz, ángeles de la paz, ángeles del Altísimo, enviados del Rey de reyes, el Santo, bendito sea.",
      },
      {
        he: "צֵאתְכֶם לְשָׁלוֹם, מַלְאֲכֵי הַשָּׁלוֹם, מַלְאֲכֵי עֶלְיוֹן, מִמֶּלֶךְ מַלְכֵי הַמְּלָכִים, הַקָּדוֹשׁ בָּרוּךְ הוּא.",
        tr: "Tzetjem leshalom, malajei hashalom, malajei elión, mimélej maljei hamlajim, haKadosh Baruj Hu.",
        es: "Que se vayan en paz, ángeles de la paz, ángeles del Altísimo, enviados del Rey de reyes, el Santo, bendito sea.",
      },
    ],
    when: "El viernes a la noche, al llegar a casa de la sinagoga y antes del Kidush. Cada estrofa se canta tres veces.",
    notes: ["En muchas casas sigue Eshet jáil, el elogio de la mujer virtuosa (Mishlé 31), antes del Kidush."],
    source: sefaria("Siddur Ashkenaz, Shabbat, Shabbat Evening, Shalom Aleichem", ASHKENAZ),
    keywords: ["viernes", "ángeles", "canción", "cena de shabat"],
  },
  {
    slug: "kidush",
    category: "shabat",
    name: "Kidush",
    about: "La santificación del Shabat sobre el vino",
    parts: [
      {
        label: "Vaiejulú",
        he: "יוֹם הַשִּׁשִּׁי. וַיְכֻלּוּ הַשָּׁמַיִם וְהָאָרֶץ וְכָל צְבָאָם. וַיְכַל אֱלֹהִים בַּיּוֹם הַשְּׁבִיעִי מְלַאכְתּוֹ אֲשֶׁר עָשָׂה, וַיִּשְׁבֹּת בַּיּוֹם הַשְּׁבִיעִי מִכָּל מְלַאכְתּוֹ אֲשֶׁר עָשָׂה. וַיְבָרֶךְ אֱלֹהִים אֶת יוֹם הַשְּׁבִיעִי וַיְקַדֵּשׁ אֹתוֹ, כִּי בוֹ שָׁבַת מִכָּל מְלַאכְתּוֹ אֲשֶׁר בָּרָא אֱלֹהִים לַעֲשׂוֹת.",
        tr: "Iom hashishí. Vaiejulú hashamáim vehaáretz vejol tzevaam. Vaiejal Elohim baiom hashevií melajtó asher asá, vaishbot baiom hashevií mikol melajtó asher asá. Vaivárej Elohim et iom hashevií vaikadesh otó, ki vo shavat mikol melajtó asher bará Elohim laasot.",
        es: "El sexto día. Así quedaron terminados el cielo, la tierra y todo lo que hay en ellos. El séptimo día Di-s concluyó la obra que había hecho, y el séptimo día descansó de toda la obra que había hecho. Di-s bendijo el séptimo día y lo santificó, porque en él descansó de toda la obra que había creado para que siguiera haciéndose.",
      },
      HAGAFEN("Sobre el vino"),
      b(
        "אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְרָצָה בָנוּ, וְשַׁבַּת קָדְשׁוֹ בְּאַהֲבָה וּבְרָצוֹן הִנְחִילָנוּ, זִכָּרוֹן לְמַעֲשֵׂה בְרֵאשִׁית. כִּי הוּא יוֹם תְּחִלָּה לְמִקְרָאֵי קֹדֶשׁ, זֵכֶר לִיצִיאַת מִצְרָיִם. כִּי בָנוּ בָחַרְתָּ וְאוֹתָנוּ קִדַּשְׁתָּ מִכָּל הָעַמִּים, וְשַׁבַּת קָדְשְׁךָ בְּאַהֲבָה וּבְרָצוֹן הִנְחַלְתָּנוּ. בָּרוּךְ אַתָּה יְיָ, מְקַדֵּשׁ הַשַּׁבָּת.",
        "asher kideshanu bemitzvotav veratzá vanu, veShabat kodshó beahavá uvratzón hinjilanu, zikarón lemaasé vereshit. Ki hu iom tejilá lemikraei kódesh, zéjer litziat Mitzráim. Ki vanu vajarta veotanu kidashta mikol haamim, veShabat kodsheja beahavá uvratzón hinjaltanu. Baruj Atá Adonai, mekadesh haShabat.",
        "que nos santificó con Sus mitzvot y nos quiso, y con amor y voluntad nos dio en herencia Su santo Shabat, recuerdo de la obra de la creación. Es el primero de los días de convocación santa, recuerdo de la salida de Egipto. Porque nos elegiste y nos santificaste entre todos los pueblos, y con amor y voluntad nos diste en herencia Tu santo Shabat. Bendito seas, Hashem, que santifica el Shabat.",
        "Santificación del día",
      ),
    ],
    when:
      "El viernes a la noche, antes de la comida, sobre una copa de vino o jugo de uva (si no hay, sobre las jalot). Lo dice una persona en nombre de todos y los demás responden amén.",
    notes: ["Es la versión ashkenazí; el nusaj sefaradí tiene pequeñas diferencias.", "El Kidush del mediodía de Shabat y el de las fiestas son distintos."],
    source: sefaria("Siddur Ashkenaz, Shabbat, Shabbat Evening, Kiddush", ASHKENAZ),
    keywords: ["viernes", "vino", "cena de shabat", "kiddush"],
  },
  {
    slug: "bendicion-de-los-hijos",
    category: "shabat",
    name: "Birkat habanim",
    about: "La bendición de los hijos",
    parts: [
      { label: "Para un hijo", he: "יְשִׂימְךָ אֱלֹהִים כְּאֶפְרַיִם וְכִמְנַשֶּׁה.", tr: "Iesimjá Elohim keEfráim vejiMenashé.", es: "Que Di-s te haga como Efraím y Menashé." },
      {
        label: "Para una hija",
        he: "יְשִׂימֵךְ אֱלֹהִים כְּשָׂרָה רִבְקָה רָחֵל וְלֵאָה.",
        tr: "Iesimej Elohim keSará, Rivká, Rajel veLeá.",
        es: "Que Di-s te haga como Sará, Rivká, Rajel y Leá.",
      },
      {
        label: "Para todos",
        he: "יְבָרֶכְךָ יְיָ וְיִשְׁמְרֶךָ. יָאֵר יְיָ פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ. יִשָּׂא יְיָ פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם.",
        tr: "Ievarejejá Adonai veishmereja. Iaer Adonai panav eleja vijuneka. Isá Adonai panav eleja veiasem lejá shalom.",
        es: "Que Hashem te bendiga y te cuide. Que Hashem haga brillar Su rostro hacia vos y te dé Su gracia. Que Hashem vuelva Su rostro hacia vos y te dé paz.",
      },
    ],
    when:
      "El viernes a la noche, antes del Kidush, con las manos sobre la cabeza de cada hijo o hija. Muchos padres la dicen también en otros momentos, como antes de Iom Kipur.",
    notes: ["La tercera parte es la bendición sacerdotal de la Torá; se dice con las mismas palabras para hijos e hijas."],
    source: sefaria("Siddur Ashkenaz, Shabbat, Shabbat Evening, Blessing the Children", ASHKENAZ),
    keywords: ["hijos", "hijas", "niños", "familia", "birkat kohanim"],
  },
  {
    slug: "havdala",
    category: "shabat",
    name: "Havdalá",
    about: "La despedida del Shabat",
    parts: [
      HAGAFEN("Sobre el vino"),
      b("בּוֹרֵא מִינֵי בְשָׂמִים.", "boré minei vesamim.", "Creador de distintas especies aromáticas.", "Sobre las especias"),
      b("בּוֹרֵא מְאוֹרֵי הָאֵשׁ.", "boré meorei haesh.", "Creador de las luces del fuego.", "Sobre el fuego"),
      b(
        "הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל, בֵּין אוֹר לְחֹשֶׁךְ, בֵּין יִשְׂרָאֵל לָעַמִּים, בֵּין יוֹם הַשְּׁבִיעִי לְשֵׁשֶׁת יְמֵי הַמַּעֲשֶׂה. בָּרוּךְ אַתָּה יְיָ, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל.",
        "hamavdil bein kódesh lejol, bein or lejóshej, bein Israel laamim, bein iom hashevií lesheshet iemei hamaasé. Baruj Atá Adonai, hamavdil bein kódesh lejol.",
        "que separa lo sagrado de lo cotidiano, la luz de la oscuridad, a Israel de los pueblos, el séptimo día de los seis días de trabajo. Bendito seas, Hashem, que separa lo sagrado de lo cotidiano.",
        "Havdalá",
      ),
    ],
    when:
      "El sábado a la noche, después de la salida de las estrellas (el calendario tiene la hora de Havdalá de tu ciudad). Se usa una vela de varias mechas, especias aromáticas y una copa de vino. Al terminar una fiesta que no cae en sábado se dicen solo la del vino y la de Havdalá.",
    partial: "Antes de las bendiciones se leen unos versículos de apertura (הִנֵּה אֵל יְשׁוּעָתִי, Hiné El ieshuatí), que acá no reproducimos; están en tu sidur.",
    notes: ["Muchos sefaradíes dicen la bendición de las especias según lo que huelen, por ejemplo בּוֹרֵא עֲצֵי בְשָׂמִים (boré atzei vesamim)."],
    source: sefaria("Siddur Ashkenaz, Shabbat, Havdalah", "El texto completo en Sefaria"),
    calendarLink: true,
    keywords: ["sábado a la noche", "fin de shabat", "vela trenzada", "especias", "havdalah"],
  },

  // Festividades
  {
    slug: "velas-de-iom-tov",
    category: "festividades",
    name: "Velas de iom tov",
    about: "Al encender las velas de las fiestas",
    parts: [
      m("לְהַדְלִיק נֵר שֶׁל יוֹם טוֹב.", "lehadlik ner shel iom tov.", "encender la vela de iom tov.", "Iom tov"),
      m("לְהַדְלִיק נֵר שֶׁל שַׁבָּת וְשֶׁל יוֹם טוֹב.", "lehadlik ner shel Shabat veshel iom tov.", "encender la vela de Shabat y de iom tov.", "Iom tov que cae en Shabat"),
      m("לְהַדְלִיק נֵר שֶׁל יוֹם הַכִּפּוּרִים.", "lehadlik ner shel Iom Hakipurim.", "encender la vela de Iom Kipur.", "Iom Kipur"),
    ],
    when:
      "En la víspera de Rosh Hashaná, Sucot, Shminí Atzeret, Simjat Torá, Pésaj, Shavuot y Iom Kipur. Cuando la fiesta dura dos días, la segunda noche se enciende después de la salida de las estrellas, con una llama que ya estaba prendida. En muchas casas se agrega Shehejeianu, salvo en las últimas noches de Pésaj.",
    notes: ["Si Iom Kipur cae en Shabat, se dice נֵר שֶׁל שַׁבָּת וְשֶׁל יוֹם הַכִּפּוּרִים."],
    source: sefaria("Siddur Sefard, Shabbat Candle Lighting", SEFARD),
    festivals: ["rosh-hashana", "iom-kipur", "sucot", "shmini-atzeret-y-simjat-tora", "pesaj", "shavuot"],
    calendarLink: true,
    keywords: ["velas", "fiesta", "iom tov", "yom tov"],
  },
  {
    slug: "velas-de-januca",
    category: "festividades",
    name: "Velas de Janucá",
    about: "Al encender la janukiá",
    parts: [
      m("לְהַדְלִיק נֵר חֲנֻכָּה.", "lehadlik ner Janucá.", "encender la vela de Janucá.", "Primera bendición"),
      b(
        "שֶׁעָשָׂה נִסִּים לַאֲבוֹתֵינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה.",
        "sheasá nisim laavoteinu baiamim hahem bazmán hazé.",
        "que hizo milagros para nuestros padres en aquellos días, en esta época del año.",
        "Segunda bendición",
      ),
      SHEHEJEIANU("Solo la primera noche"),
    ],
    when:
      "Cada una de las ocho noches de Janucá, antes de encender la janukiá. La primera noche se enciende una vela y cada noche se agrega una más. Después se canta Hanerot halalu y Maoz tzur.",
    notes: ["Muchos ashkenazim dicen נֵר שֶׁל חֲנֻכָּה (ner shel Janucá)."],
    source: sefaria("Siddur Ashkenaz, Festivals, Chanukah, Service for Lighting Chanukah Candles, Blessings on Chanukah Candles", ASHKENAZ),
    festivals: ["januca"],
    keywords: ["janucá", "jánuca", "hanukkah", "chanukah", "menorá", "velas"],
  },
  {
    slug: "suca",
    category: "festividades",
    name: "Leishev basucá",
    about: "Al comer en la sucá",
    parts: [m("לֵישֵׁב בַּסֻּכָּה.", "leishev basucá.", "habitar en la sucá.")],
    when: "Durante Sucot, al comer en la sucá pan o masas en la cantidad que fija la halajá. La primera noche se dice dentro del Kidush.",
    festivals: ["sucot"],
    keywords: ["sucot", "sukkot", "cabaña", "sucá"],
  },
  {
    slug: "lulav",
    category: "festividades",
    name: "Netilat lulav",
    about: "Las cuatro especies de Sucot",
    parts: [m("עַל נְטִילַת לוּלָב.", "al netilat lulav.", "tomar el lulav.")],
    when:
      "Cada día de Sucot salvo Shabat, de día, sosteniendo juntas las cuatro especies: lulav (palmera), etrog (cidra), hadasim (mirto) y aravot (sauce). El primer día que se toman se agrega Shehejeianu.",
    source: sefaria("Siddur Ashkenaz, Festivals, Sukkot, Blessing on Lulav", ASHKENAZ),
    festivals: ["sucot"],
    keywords: ["sucot", "etrog", "cuatro especies", "lulav"],
  },
  {
    slug: "shofar",
    category: "festividades",
    name: "Shofar",
    about: "Al escuchar el shofar en Rosh Hashaná",
    parts: [m("לִשְׁמֹעַ קוֹל שׁוֹפָר.", "lishmóa kol shofar.", "escuchar el sonido del shofar.")],
    when:
      "En Rosh Hashaná, antes del toque del shofar, salvo cuando cae en Shabat. La dice quien toca; los presentes cumplen al escucharla y responder amén. Le sigue Shehejeianu.",
    source: sefaria("Machzor Rosh Hashanah Ashkenaz, Sounding of the Shofar", "Majzor de Rosh Hashaná en Sefaria"),
    festivals: ["rosh-hashana"],
    keywords: ["rosh hashaná", "año nuevo", "cuerno", "shofar"],
  },
  {
    slug: "manzana-con-miel",
    category: "festividades",
    name: "Iehí ratzón",
    about: "La manzana con miel de Rosh Hashaná",
    parts: [
      HAETZ("Sobre la manzana"),
      {
        label: "El pedido",
        he: "יְהִי רָצוֹן מִלְּפָנֶיךָ, יְיָ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתְּחַדֵּשׁ עָלֵינוּ שָׁנָה טוֹבָה וּמְתוּקָה.",
        tr: "Iehí ratzón milefaneja, Adonai Eloheinu vElohei avoteinu, shetejadesh aleinu shaná tová umetuká.",
        es: "Sea Tu voluntad, Hashem, nuestro Di-s y Di-s de nuestros padres, renovarnos un año bueno y dulce.",
      },
    ],
    when:
      "La primera noche de Rosh Hashaná (en muchas casas, también la segunda), al comienzo de la comida: se moja un pedazo de manzana en miel, se dice la bendición de la fruta, se come un poco y después se pide por un año dulce.",
    notes: ["Muchas familias suman otros simanim, alimentos que acompañan un pedido: granada, dátiles, calabaza o cabeza de pescado."],
    source: sefaria("Shulchan Arukh, Orach Chayim 583:1", "Shulján Aruj en Sefaria"),
    festivals: ["rosh-hashana"],
    keywords: ["rosh hashaná", "manzana", "miel", "simanim", "año nuevo"],
  },
  {
    slug: "meguila",
    category: "festividades",
    name: "Mikrá meguilá",
    about: "Antes de leer la Meguilá en Purim",
    parts: [m("עַל מִקְרָא מְגִלָּה.", "al mikrá meguilá.", "leer la Meguilá.")],
    when:
      "En Purim, antes de leer la Meguilat Ester, a la noche y a la mañana. Le siguen Sheasá nisim y Shehejeianu; a la mañana, la costumbre ashkenazí repite Shehejeianu y la sefaradí no.",
    source: sefaria("Siddur Sefard, Purim, Megillah Reading", SEFARD),
    festivals: ["purim"],
    keywords: ["purim", "ester", "meguilá", "megillah"],
  },
  {
    slug: "bedikat-jametz",
    category: "festividades",
    name: "Bedikat jametz",
    about: "La búsqueda del jametz antes de Pésaj",
    parts: [m("עַל בִּעוּר חָמֵץ.", "al biur jametz.", "eliminar el jametz.")],
    when:
      "La noche anterior a la víspera de Pésaj, antes de revisar la casa con una vela o una linterna buscando jametz. Al terminar se dice Kol jamirá, una declaración en arameo que anula el jametz que no se encontró.",
    source: sefaria("Shulchan Arukh, Orach Chayim 432:1", "Shulján Aruj en Sefaria"),
    festivals: ["pesaj"],
    keywords: ["pésaj", "pesaj", "pascua", "jametz", "limpieza"],
  },
  {
    slug: "matza-y-maror",
    category: "festividades",
    name: "Matzá y maror",
    about: "Las bendiciones del Séder",
    parts: [
      m("עַל אֲכִילַת מַצָּה.", "al ajilat matzá.", "comer matzá.", "Sobre la matzá, después de Hamotzí"),
      m("עַל אֲכִילַת מָרוֹר.", "al ajilat maror.", "comer maror.", "Sobre el maror"),
    ],
    when:
      "En el Séder de Pésaj (dos noches en la diáspora, una en Israel). La de la matzá se dice después de Hamotzí; la del maror, las hierbas amargas, antes de comerlo mojado en jaroset.",
    source: sefaria("Pesach Haggadah, Motzi Matzah", "Hagadá de Pésaj en Sefaria"),
    festivals: ["pesaj"],
    keywords: ["pésaj", "séder", "matzá", "maror", "hagadá"],
  },
  {
    slug: "sefirat-haomer",
    category: "festividades",
    name: "Sefirat haómer",
    about: "La cuenta del Omer",
    parts: [
      m("עַל סְפִירַת הָעֹמֶר.", "al sefirat haómer.", "contar el Omer.", "Bendición"),
      { label: "Por ejemplo, la primera noche", he: "הַיּוֹם יוֹם אֶחָד בָּעֹמֶר.", tr: "Haiom iom ejad baómer.", es: "Hoy es el primer día del Omer." },
    ],
    when:
      "Cada noche desde la segunda noche de Pésaj hasta la víspera de Shavuot, 49 noches, de pie y después de la salida de las estrellas. Si te olvidaste de contar un día entero, las noches siguientes se cuentan sin la bendición: consultá con tu rabino.",
    notes: ["Muchas comunidades dicen לָעֹמֶר (laómer) en lugar de בָּעֹמֶר."],
    source: sefaria("Siddur Ashkenaz, Weekday, Maariv, Sefirat HaOmer", ASHKENAZ),
    festivals: ["pesaj", "lag-baomer", "shavuot"],
    keywords: ["omer", "cuenta", "pésaj", "shavuot", "lag baomer"],
  },

  // Momentos de la vida
  {
    slug: "mezuza",
    category: "vida",
    name: "Mezuzá",
    about: "Al fijar una mezuzá",
    parts: [m("לִקְבֹּעַ מְזוּזָה.", "likbóa mezuzá.", "fijar la mezuzá.")],
    when:
      "Al fijar una mezuzá en una puerta: del lado derecho al entrar, en el tercio superior del marco. Si se colocan varias a la vez, una sola bendición alcanza. El klaf, el pergamino, conviene comprarlo a un sofer o a un vendedor confiable.",
    notes: ["Los ashkenazim la colocan inclinada, con la parte de arriba hacia adentro; los sefaradíes, vertical."],
    source: sefaria("Siddur Ashkenaz, Berachot, Birkhot Hamitzvot", ASHKENAZ),
    keywords: ["casa", "puerta", "mudanza", "hogar", "mezuza"],
  },
  {
    slug: "shehejeianu",
    category: "vida",
    name: "Shehejeianu",
    about: "Por lo nuevo y lo bueno",
    parts: [SHEHEJEIANU()],
    when:
      "Al comienzo de cada fiesta (en el Kidush y, en muchas casas, al encender las velas), la primera noche de Janucá, al comer por primera vez en el año una fruta de estación, al estrenar una prenda importante o al vivir algo bueno y nuevo.",
    source: sefaria("Siddur Edot HaMizrach, Blessings on Enjoyments", "Sidur Edot Hamizraj en Sefaria"),
    festivals: ["rosh-hashana", "sucot", "januca", "pesaj", "shavuot"],
    keywords: ["nuevo", "estreno", "fruta nueva", "fiesta", "shehecheyanu"],
  },
  {
    slug: "hatov-vehametiv",
    category: "vida",
    name: "Hatov vehametiv",
    about: "Por una buena noticia compartida",
    parts: [b("הַטּוֹב וְהַמֵּטִיב.", "hatov vehametiv.", "que es bueno y hace el bien.")],
    when:
      "Al recibir una buena noticia que te alegra a vos y a otras personas. Cuando lo bueno es solo tuyo, se dice Shehejeianu. También se dice al servir durante la comida un vino distinto del primero.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["buena noticia", "alegría", "nacimiento"],
  },
  {
    slug: "dayan-haemet",
    category: "vida",
    name: "Daián haemet",
    about: "Ante una noticia dolorosa",
    parts: [b("דַּיַּן הָאֱמֶת.", "daián haemet.", "el Juez verdadero.")],
    when:
      "Al enterarte de un fallecimiento o de una noticia muy dolorosa. Los familiares directos la dicen en la keriá, cuando se rasga la ropa en señal de duelo. Hay quienes dicen solo בָּרוּךְ דַּיַּן הָאֱמֶת (Baruj Daián haemet), sin el Nombre.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["fallecimiento", "duelo", "muerte", "mala noticia", "keriá"],
  },

  // Naturaleza
  {
    slug: "truenos",
    category: "naturaleza",
    name: "Al oír un trueno",
    about: "Shekojó ugvurató",
    parts: [b("שֶׁכֹּחוֹ וּגְבוּרָתוֹ מָלֵא עוֹלָם.", "shekojó ugvurató malé olam.", "cuya fuerza y poder llenan el mundo.")],
    when: "Al oír un trueno. Se dice una vez por tormenta; si el cielo se despeja del todo y llega otra tormenta, se dice de nuevo.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["tormenta", "trueno", "lluvia"],
  },
  {
    slug: "relampagos",
    category: "naturaleza",
    name: "Relámpagos, montañas y desiertos",
    about: "Osé maasé vereshit",
    parts: [b("עוֹשֶׂה מַעֲשֵׂה בְרֵאשִׁית.", "osé maasé vereshit.", "que hace la obra de la creación.")],
    when:
      "Al ver un relámpago, y también ante montañas imponentes, grandes ríos o desiertos. Si ves el relámpago y oís el trueno a la vez, muchos dicen solo esta.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["relámpago", "rayo", "montaña", "desierto", "tormenta", "paisaje"],
  },
  {
    slug: "arcoiris",
    category: "naturaleza",
    name: "Al ver un arcoíris",
    about: "Zojer habrit",
    parts: [
      b(
        "זוֹכֵר הַבְּרִית וְנֶאֱמָן בִּבְרִיתוֹ וְקַיָּם בְּמַאֲמָרוֹ.",
        "zojer habrit veneemán bivritó vekaiam bemaamaró.",
        "que recuerda el pacto, es fiel a Su pacto y cumple Su palabra.",
      ),
    ],
    when: "Al ver un arcoíris. Se acostumbra no quedarse mirándolo mucho rato.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["arcoíris", "arco iris", "lluvia", "cielo"],
  },
  {
    slug: "el-mar",
    category: "naturaleza",
    name: "Al ver el mar",
    about: "Sheasá et haiam hagadol",
    parts: [b("שֶׁעָשָׂה אֶת הַיָּם הַגָּדוֹל.", "sheasá et haiam hagadol.", "que hizo el gran mar.")],
    when: "Al ver el mar después de 30 días sin verlo. Hay opiniones distintas sobre qué mares y océanos llevan esta bendición; ante la duda, consultá con tu rabino.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkat Hanehenin, Blessings on Sights Sounds and Smells", ASHKENAZ),
    keywords: ["mar", "océano", "playa", "vacaciones"],
  },
  {
    slug: "arboles-en-flor",
    category: "naturaleza",
    name: "Árboles frutales en flor",
    about: "Birkat hailanot",
    parts: [
      b(
        "שֶׁלֹּא חִסֵּר בְּעוֹלָמוֹ כְּלוּם, וּבָרָא בוֹ בְּרִיּוֹת טוֹבוֹת וְאִילָנוֹת טוֹבוֹת, לֵהָנוֹת בָּהֶם בְּנֵי אָדָם.",
        "shelo jiser beolamó klum, uvará vo beriot tovot veilanot tovot, lehanot bahem bnei adam.",
        "que no dejó faltar nada en Su mundo y creó en él criaturas buenas y árboles buenos para que las personas los disfruten.",
      ),
    ],
    when:
      "Una vez al año, al ver por primera vez árboles frutales en flor, al menos dos. La tradición la ubica en el mes de Nisán; en el hemisferio sur, donde los frutales florecen entre agosto y octubre, hay opiniones distintas sobre cuándo decirla: consultá con tu rabino.",
    source: sefaria("Siddur Ashkenaz, Berachot, Birkhot Hamitzvot", ASHKENAZ),
    keywords: ["primavera", "árboles", "flores", "nisán", "ilanot"],
  },
  {
    slug: "aromas",
    category: "naturaleza",
    name: "Aromas y especias",
    about: "Boré minei vesamim",
    parts: [
      b("בּוֹרֵא עֲצֵי בְשָׂמִים.", "boré atzei vesamim.", "Creador de árboles aromáticos.", "Plantas leñosas y flores de arbusto"),
      b("בּוֹרֵא עִשְׂבֵּי בְשָׂמִים.", "boré isbei vesamim.", "Creador de hierbas aromáticas.", "Hierbas aromáticas"),
      b("בּוֹרֵא מִינֵי בְשָׂמִים.", "boré minei vesamim.", "Creador de distintas especies aromáticas.", "Otros aromas, o ante la duda"),
    ],
    when:
      "Antes de oler especias, flores o plantas perfumadas. Lo que crece en árboles o arbustos, como la rosa, lleva atzei; las plantas de tallo blando, isbei; si no sabés, minei vesamim.",
    source: sefaria("Siddur Edot HaMizrach, Blessings on Enjoyments", "Sidur Edot Hamizraj en Sefaria"),
    keywords: ["perfume", "flores", "especias", "olor", "besamim", "rosa"],
  },

  // Viaje
  {
    slug: "tefilat-haderej",
    category: "viaje",
    name: "Tefilat haderej",
    about: "La oración del viajero",
    parts: [
      {
        he: "יְהִי רָצוֹן מִלְּפָנֶיךָ יְיָ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם וְתַצְעִידֵנוּ לְשָׁלוֹם וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתִסְמְכֵנוּ לְשָׁלוֹם, וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם, וְתַצִּילֵנוּ מִכַּף כָּל אוֹיֵב וְאוֹרֵב וְלִסְטִים וְחַיּוֹת רָעוֹת בַּדֶּרֶךְ, וּמִכָּל מִינֵי פֻּרְעָנֻיּוֹת הַמִּתְרַגְּשׁוֹת לָבוֹא לָעוֹלָם, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רֹאֵינוּ, כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה. בָּרוּךְ אַתָּה יְיָ, שׁוֹמֵעַ תְּפִלָּה.",
        tr: "Iehí ratzón milefaneja, Adonai Eloheinu vElohei avoteinu, shetolijenu leshalom vetatzidenu leshalom vetadrijenu leshalom, vetismejenu leshalom, vetaguienu limjoz jeftzenu lejaim ulesimjá uleshalom, vetatzilenu mikaf kol oiev veorev velistim vejaiot raot badérej, umikol minei puraniot hamitragshot lavó laolam, vetitnenu lején ulejésed ulerajamim beeineja uveeinei jol roeinu, ki El shoméa tefilá vetajanún Atá. Baruj Atá Adonai, shoméa tefilá.",
        es: "Sea Tu voluntad, Hashem, nuestro Di-s y Di-s de nuestros padres, llevarnos en paz, guiar nuestros pasos en paz, conducirnos en paz y sostenernos en paz; hacernos llegar a destino con vida, alegría y paz; librarnos de todo enemigo y emboscada, de ladrones y de animales peligrosos en el camino, y de toda clase de desgracias que se desatan sobre el mundo; y darnos gracia, bondad y misericordia ante Tus ojos y ante los ojos de quienes nos vean. Porque Vos sos Di-s, que escucha la oración y la súplica. Bendito seas, Hashem, que escucha la oración.",
      },
    ],
    when:
      "Al salir de viaje, una vez que dejaste atrás la ciudad; en avión, después del despegue. Se dice una vez por cada día de viaje. Para trayectos cortos hay opiniones distintas sobre si se dice con la frase final: consultá con tu rabino.",
    notes: [
      "Si volvés en el mismo día, después de לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם se agrega וְתַחְזִירֵנוּ לְשָׁלוֹם (vetajzirenu leshalom, «y traernos de vuelta en paz»).",
      "Muchos sidurim agregan otros pedidos y versículos; las versiones cambian según la comunidad.",
    ],
    source: sefaria("Siddur Ashkenaz, Berachot, Tefillat HaDerech", ASHKENAZ),
    keywords: ["viaje", "avión", "ruta", "auto", "oración del viajero", "tefilat haderech"],
  },
  {
    slug: "hagomel",
    category: "viaje",
    name: "Birkat hagomel",
    about: "Después de un viaje o de un peligro",
    parts: [
      b(
        "הַגּוֹמֵל לְחַיָּבִים טוֹבוֹת, שֶׁגְּמָלַנִי כָּל טוֹב.",
        "hagomel lejaiavim tovot, sheguemalani kol tov.",
        "que hace el bien aun a quien no lo merece, y me hizo todo el bien.",
        "Quien se salvó",
      ),
      {
        label: "Responden los presentes",
        he: "אָמֵן. מִי שֶׁגְּמָלְךָ כָּל טוֹב, הוּא יִגְמָלְךָ כָּל טוֹב, סֶלָה.",
        tr: "Amén. Mi sheguemaljá kol tov, Hu igmoljá kol tov, sela.",
        es: "Amén. Quien te hizo todo el bien, que siga haciéndote todo el bien, siempre.",
      },
    ],
    notes: ["En el nusaj sefaradí responden הָאֵל שֶׁגְּמָלְךָ כָּל טוּב, הוּא יִגְמָלְךָ כָּל טוּב סֶלָה (Hael sheguemaljá kol tuv, Hu igmoljá kol tuv, sela)."],
    when:
      "Después de un vuelo o de un viaje por mar, de recuperarte de una enfermedad seria o de salir de una situación de peligro. Se dice frente a un minián, en general al ser llamado a la Torá, y si se puede dentro de los tres días. Si corresponde después de vuelos cortos, y cómo la dicen las mujeres, depende de la costumbre: consultá con tu rabino.",
    source: sefaria("Siddur Ashkenaz, Weekday, Shacharit, Torah Reading, Reading from Sefer, Birkat Hagomel", ASHKENAZ),
    keywords: ["viaje", "avión", "enfermedad", "peligro", "gomel", "agradecimiento"],
  },
];

export function sidurBySlug(slug: string) {
  return SIDUR.find((e) => e.slug === slug) ?? null;
}

export function sidurCategoryLabel(id: SidurCategoryId) {
  return SIDUR_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Sin tildes, sin nikud y en minúscula: «Hamotzí», «hamotzi» y «הַמּוֹצִיא»/«המוציא» encuentran lo mismo. */
export function foldForSearch(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Todo el texto buscable de una entrada, normalizado y con un espacio delante de cada palabra. */
export function sidurSearchText(e: SidurEntry) {
  const text = [e.name, e.about, e.when, sidurCategoryLabel(e.category), ...(e.keywords ?? []), ...e.parts.flatMap((p) => [p.label ?? "", p.he, p.tr, p.es])].join(" ");
  return ` ${foldForSearch(text).replace(/[^\p{L}\p{N}]+/gu, " ")}`;
}

/** Cada término tiene que ser el comienzo de alguna palabra: «pan» encuentra «pan» y «panes», no «tapan». */
export function matchesSearch(searchText: string, query: string) {
  return foldForSearch(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .every((term) => searchText.includes(` ${term}`));
}
// creado por pato dev y askforvini
