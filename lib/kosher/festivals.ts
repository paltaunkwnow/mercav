import { HebrewCalendar, flags, type Event } from "@hebcal/core";
import { hebrewMonthEs } from "@/lib/calendar/hebrew-names";
import { dayKey } from "@/lib/kosher/time";

/**
 * Festividades del calendario hebreo: qué se celebra, qué se acostumbra y sus fechas, calculadas con @hebcal/core.
 * Las fechas son de la diáspora por defecto, con la diferencia de Israel aparte. Los nombres son los de
 * lib/calendar/hebrew-names.ts (los mismos que muestra el calendario).
 */

export type FestivalKind = "iom-tov" | "ayuno" | "fiesta" | "recordacion";

export const KIND_LABEL: Record<FestivalKind, string> = {
  "iom-tov": "Iom tov",
  ayuno: "Ayuno",
  fiesta: "Fiesta",
  recordacion: "Recordación",
};

/** Un día del calendario con fechas propias. Las fiestas tienen una sola parte; la página de ayunos menores, varias. */
export type FestivalPart = {
  key: string;
  name: string;
  hebrew: string;
  hebrewDate: string;
  /** Solo en las páginas con varias partes. */
  about?: string;
  /** Descripciones de hebcal (sin «Erev») que son días de esta fecha. */
  match: (desc: string) => boolean;
};

export type Festival = {
  slug: string;
  name: string;
  hebrew: string;
  summary: string;
  hebrewDate: string;
  kind: FestivalKind;
  /** Una línea: ¿se trabaja? */
  workShort: string;
  about: string[];
  customs: string[];
  work: string;
  israel: string;
  /** Al atardecer de la víspera, o al amanecer del mismo día (ayunos menores). */
  startsAt: "sundown" | "dawn";
  /** Bendiciones del sidur (slugs de lib/kosher/sidur.ts). */
  blessings: string[];
  parts: FestivalPart[];
  /** El nombre son dos fiestas: los verbos van en plural. */
  plural?: boolean;
};

const is = (...descs: string[]) => (desc: string) => descs.includes(desc);

function single(f: Omit<Festival, "parts">, match: FestivalPart["match"]): Festival {
  return { ...f, parts: [{ key: f.slug, name: f.name, hebrew: f.hebrew, hebrewDate: f.hebrewDate, match }] };
}

export const FESTIVALS: Festival[] = [
  single(
    {
      slug: "rosh-hashana",
      name: "Rosh Hashaná",
      hebrew: "רֹאשׁ הַשָּׁנָה",
      summary: "El año nuevo del calendario hebreo: dos días de oración, shofar y comidas dulces para empezar un año bueno.",
      hebrewDate: "1 y 2 de Tishrei",
      kind: "iom-tov",
      workShort: "Iom tov: no se trabaja ninguno de los dos días.",
      about: [
        "Rosh Hashaná abre el año del calendario hebreo. Según la tradición, recuerda la creación del ser humano y es el día en que Hashem juzga al mundo: por eso se lo llama también Iom Hadín, el día del juicio, y Iom Teruá, el día del toque del shofar.",
        "Es una fiesta seria y alegre a la vez. Abre los Diez Días de Teshuvá, el tiempo para revisar lo que hiciste en el año, pedir perdón y proponerte cambiar, que terminan en Iom Kipur.",
      ],
      customs: [
        "Escuchar el shofar en la sinagoga, salvo cuando el primer día cae en Shabat.",
        "Encender las velas y hacer Kidush las dos noches.",
        "Comer manzana con miel, jalá redonda y otros simanim, alimentos que acompañan un pedido para el año.",
        "Tashlij: la tarde del primer día (o del segundo, si el primero es Shabat) se reza junto al agua, como señal de dejar atrás los errores.",
        "Saludar con «Shaná tová umetuká», un año bueno y dulce, o con «Ketivá vajatimá tová».",
      ],
      work: "Los dos días son iom tov, también en Israel. Rigen las prohibiciones de Shabat, con una diferencia: se puede cocinar, y pasar fuego de una llama ya encendida, para la comida del día. Ante cualquier duda puntual, consultá con tu rabino.",
      israel: "Es la única fiesta de la Torá que dura dos días también en Israel.",
      startsAt: "sundown",
      blessings: ["shofar", "manzana-con-miel", "velas-de-iom-tov", "shehejeianu"],
    },
    (d) => /^Rosh Hashana( \d+| II)$/.test(d),
  ),
  single(
    {
      slug: "iom-kipur",
      name: "Iom Kipur",
      hebrew: "יוֹם כִּפּוּר",
      summary: "El día del perdón: unas 25 horas de ayuno y oración que cierran los Diez Días de Teshuvá.",
      hebrewDate: "10 de Tishrei",
      kind: "iom-tov",
      workShort: "Como Shabat: no se trabaja ni se cocina, y se ayuna unas 25 horas.",
      about: [
        "Iom Kipur es el día más solemne del año. La Torá lo fija como el día de la expiación: un día para reconocer los errores, pedir perdón a Hashem y comprometerse a cambiar.",
        "La tradición enseña que Iom Kipur repara lo que hay entre la persona y Hashem, pero no lo que hay entre las personas. Por eso, en los días anteriores, se acostumbra pedir perdón a familiares, amigos y conocidos.",
      ],
      customs: [
        "Hacer una comida abundante la tarde anterior (seudá mafséket) y encender las velas antes de la puesta del sol.",
        "Ayunar desde antes de la puesta del sol hasta la salida de las estrellas del día siguiente, sin comer ni beber.",
        "No usar calzado de cuero, no lavarse por placer, no usar cremas ni perfumes, y la pareja se abstiene de relaciones.",
        "Ir a la sinagoga: Kol Nidré a la noche, Izkor durante el día en muchas comunidades y Neilá al final, que cierra con un toque largo del shofar.",
        "Muchos se visten de blanco.",
      ],
      work: "Es el «Shabat de los Shabatot»: rigen todas las prohibiciones de Shabat, incluida la de cocinar. Las personas enfermas, las embarazadas, las mujeres en lactancia y los chicos tienen reglas especiales para el ayuno: consultá con tu rabino y con tu médico.",
      israel: "Dura un solo día en todo el mundo.",
      startsAt: "sundown",
      blessings: ["velas-de-iom-tov", "bendicion-de-los-hijos"],
    },
    is("Yom Kippur"),
  ),
  single(
    {
      slug: "sucot",
      name: "Sucot",
      hebrew: "סֻכּוֹת",
      summary: "Siete días viviendo en la sucá, la cabaña que recuerda el paso por el desierto, con las cuatro especies.",
      hebrewDate: "15 al 21 de Tishrei",
      kind: "iom-tov",
      workShort: "El primer día es iom tov (los dos primeros en la diáspora); el resto, jol hamoed.",
      about: [
        "Sucot recuerda los cuarenta años en que el pueblo de Israel atravesó el desierto después de salir de Egipto, protegido por Hashem. Durante siete días se vive en una sucá, una cabaña con techo de ramas: se deja la casa firme por una construcción frágil, como señal de confianza.",
        "Es también la fiesta de la cosecha (Jag haasif), y la Torá la llama «el tiempo de nuestra alegría». Empieza cinco días después de Iom Kipur.",
      ],
      customs: [
        "Armar la sucá y comer en ella; quien puede, también duerme ahí.",
        "Tomar cada día, salvo Shabat, las cuatro especies: lulav, etrog, hadasim y aravot.",
        "Invitar a los ushpizín, los huéspedes simbólicos (Abraham, Itzjak, Iaakov y otros), y recibir invitados de verdad.",
        "Rezar Halel y hacer las hoshanot, rondas en la sinagoga con las cuatro especies.",
        "El séptimo día, Hoshaná Rabá, se hacen siete rondas y se golpean ramas de sauce.",
      ],
      work: "El primer día es iom tov (en la diáspora, los dos primeros): rigen las prohibiciones de Shabat, salvo lo necesario para cocinar la comida del día. Los días siguientes son jol hamoed, días intermedios en los que se trabaja con algunas limitaciones según la costumbre: consultá con tu rabino.",
      israel: "En la diáspora los dos primeros días son iom tov; en Israel, solo el primero. En los dos casos Sucot dura siete días y le sigue Shminí Atzeret.",
      startsAt: "sundown",
      blessings: ["suca", "lulav", "velas-de-iom-tov", "shehejeianu"],
    },
    (d) => d.startsWith("Sukkot "),
  ),
  single(
    {
      slug: "shmini-atzeret-y-simjat-tora",
      name: "Shminí Atzeret y Simjat Torá",
      hebrew: "שְׁמִינִי עֲצֶרֶת · שִׂמְחַת תּוֹרָה",
      summary: "El cierre de las fiestas de Tishrei: el pedido por la lluvia y la alegría de terminar y volver a empezar la lectura de la Torá.",
      hebrewDate: "22 y 23 de Tishrei (solo el 22 en Israel)",
      kind: "iom-tov",
      workShort: "Iom tov: no se trabaja.",
      about: [
        "Shminí Atzeret, «el octavo día de reunión», llega pegado a Sucot pero es una fiesta propia. Ese día se empieza a mencionar la lluvia en la Amidá, con la Tefilat gueshem, porque en la Tierra de Israel empieza la temporada de lluvias.",
        "Simjat Torá celebra el final del ciclo anual de lectura de la Torá: se lee el último pasaje de Devarim y, sin pausa, el comienzo de Bereshit. Es el día de bailar con los rollos de la Torá.",
      ],
      customs: [
        "Hakafot: siete rondas de baile alrededor de la bimá con los Sifrei Torá, a la noche y a la mañana.",
        "Llamar a la Torá a todos los presentes, incluidos los chicos (Kol hanearim).",
        "Honrar a un Jatán Torá, que lee el final, y a un Jatán Bereshit, que lee el comienzo.",
        "En Shminí Atzeret, rezar Izkor y la Tefilat gueshem.",
        "En la diáspora, muchos comen en la sucá en Shminí Atzeret sin decir la bendición; las costumbres varían.",
      ],
      work: "Los dos días (uno en Israel) son iom tov: rigen las prohibiciones de Shabat, salvo lo necesario para cocinar la comida del día.",
      israel: "En la diáspora son dos días: Shminí Atzeret el 22 de Tishrei y Simjat Torá el 23. En Israel las dos fiestas se celebran juntas el 22.",
      startsAt: "sundown",
      blessings: ["velas-de-iom-tov", "shehejeianu"],
      plural: true,
    },
    is("Shmini Atzeret", "Simchat Torah"),
  ),
  single(
    {
      slug: "januca",
      name: "Janucá",
      hebrew: "חֲנֻכָּה",
      summary: "Ocho noches de luces que recuerdan la rededicación del Templo y el milagro del aceite.",
      hebrewDate: "25 de Kislev al 2 o 3 de Tevet",
      kind: "fiesta",
      workShort: "No es iom tov: se trabaja con normalidad.",
      about: [
        "En el siglo II antes de la era común, el imperio seléucida, de cultura griega, prohibió el estudio de la Torá y profanó el Templo de Jerusalén. Un grupo pequeño, los jashmonaím o macabeos, se rebeló, recuperó el Templo y lo volvió a dedicar: eso significa Janucá, «inauguración».",
        "Según el Talmud, encontraron aceite puro para un solo día y alcanzó para ocho, hasta que pudieron preparar más. Por eso se encienden luces durante ocho noches, para recordar el milagro y darlo a conocer.",
      ],
      customs: [
        "Encender la janukiá cada noche: una luz la primera noche y una más cada noche, usando el shamash para prenderlas.",
        "Ponerla en una ventana o junto a la puerta, para que se vea desde afuera.",
        "Comer frituras en aceite, como latkes (tortitas de papa) y sufganiot (bolas de fraile).",
        "Jugar con el sevivón (dreidel) y dar Janucá guelt, monedas o regalos, a los chicos.",
        "Agregar Al hanisim en la Amidá y en el Birkat hamazón, y rezar Halel completo los ocho días.",
      ],
      work: "Janucá no es iom tov y no tiene las restricciones de Shabat: se trabaja, se viaja y se cocina. El viernes, las velas de Janucá se encienden antes que las de Shabat.",
      israel: "Dura ocho días en todo el mundo. En Israel el sevivón dice «un gran milagro ocurrió aquí»; en la diáspora, «ocurrió allá».",
      startsAt: "sundown",
      blessings: ["velas-de-januca", "shehejeianu"],
    },
    // «Chanukah: 1 Candle» es la víspera (24 de Kislev): la primera vela se enciende esa noche.
    (d) => /^Chanukah: ([2-8] Candles|8th Day)$/.test(d),
  ),
  single(
    {
      slug: "tu-bishvat",
      name: "Tu Bishvat",
      hebrew: "ט״וּ בִּשְׁבָט",
      summary: "El año nuevo de los árboles: se celebra comiendo frutas, sobre todo las de la Tierra de Israel.",
      hebrewDate: "15 de Shvat",
      kind: "fiesta",
      workShort: "No es iom tov: se trabaja con normalidad.",
      about: [
        "La Mishná llama al 15 de Shvat «el año nuevo de los árboles». En su origen era una fecha de cálculo: marcaba a qué año pertenecían los frutos de cada árbol para separar los diezmos y contar la edad de una planta joven.",
        "Con el tiempo se volvió una fiesta de gratitud por la naturaleza y de vínculo con la Tierra de Israel, donde a esa altura del invierno empiezan a florecer los almendros.",
      ],
      customs: [
        "Comer frutas, en especial las siete especies con que la Torá elogia a la Tierra de Israel: trigo, cebada, uva, higo, granada, aceituna y dátil.",
        "Probar una fruta nueva de la temporada y decir Shehejeianu.",
        "Hacer un Séder de Tu Bishvat, con frutas, vino y lecturas, una costumbre que viene de los cabalistas de Tzfat.",
        "Plantar árboles, en Israel o en tu ciudad.",
        "No se dice Tajanún.",
      ],
      work: "No es iom tov: no hay restricciones de trabajo.",
      israel: "Es un solo día en todo el mundo.",
      startsAt: "sundown",
      blessings: ["haetz", "shehejeianu", "al-hamijia", "bore-nefashot"],
    },
    is("Tu BiShvat"),
  ),
  single(
    {
      slug: "purim",
      name: "Purim",
      hebrew: "פּוּרִים",
      summary: "La salvación de los judíos de Persia, contada en la Meguilat Ester: lectura, regalos, ayuda a quien lo necesita y banquete.",
      hebrewDate: "14 de Adar (Adar II en los años bisiestos)",
      kind: "fiesta",
      workShort: "No es iom tov, pero muchos se toman el día para cumplir las mitzvot de Purim.",
      about: [
        "Purim recuerda lo que cuenta la Meguilat Ester. En el imperio persa, Hamán, un alto ministro, consiguió un decreto para exterminar a todos los judíos en un día elegido por sorteo, con «purim», suertes. La reina Ester, junto a su tío Mordejai, arriesgó su vida ante el rey y logró que el plan se diera vuelta.",
        "En la Meguilá el nombre de Hashem no aparece ni una vez: la tradición lee en eso que Su mano actúa también escondida, detrás de lo que parece casualidad.",
      ],
      customs: [
        "Escuchar la lectura de la Meguilá a la noche y a la mañana; cuando se nombra a Hamán, se hace ruido.",
        "Mishlóaj manot: mandar al menos dos alimentos listos para comer a por lo menos una persona.",
        "Matanot laevionim: dar dinero o comida a por lo menos dos personas necesitadas.",
        "Seudat Purim: un banquete festivo la tarde del día de Purim.",
        "Disfrazarse y comer oznei Hamán (hamantashen).",
        "El día anterior es el Ayuno de Ester.",
      ],
      work: "Purim no es iom tov y no tiene las restricciones de Shabat. Aun así, se recomienda no dedicar el día al trabajo, para cumplir sus mitzvot con alegría.",
      israel: "En Jerusalén y en otras ciudades que estaban amuralladas en tiempos de Iehoshúa, Purim se celebra un día después: Shushán Purim, el 15 de Adar.",
      startsAt: "sundown",
      blessings: ["meguila", "shehejeianu"],
    },
    is("Purim"),
  ),
  single(
    {
      slug: "pesaj",
      name: "Pésaj",
      hebrew: "פֶּסַח",
      summary: "La salida de Egipto: el Séder, la matzá y una semana sin jametz.",
      hebrewDate: "15 al 22 de Nisán (15 al 21 en Israel)",
      kind: "iom-tov",
      workShort: "Los primeros y los últimos días son iom tov; los del medio, jol hamoed.",
      about: [
        "Pésaj recuerda la salida de los hijos de Israel de la esclavitud en Egipto, cuando pasaron de ser una familia de esclavos a ser un pueblo libre. Es la fiesta de la libertad, y en la Tierra de Israel, la de la primavera.",
        "Como salieron tan apurados que la masa no llegó a leudar, durante toda la fiesta se come matzá y no se come ni se tiene jametz: nada hecho con trigo, cebada, centeno, avena o espelta que haya fermentado.",
      ],
      customs: [
        "Limpiar la casa, revisarla buscando jametz la noche anterior a la víspera (bedikat jametz) y quemarlo o venderlo antes de que empiece la fiesta.",
        "El Séder: una cena con un orden fijo en la que se lee la Hagadá, se cuenta la historia, se toman cuatro copas de vino y se comen matzá, maror y jaroset.",
        "Los chicos hacen las cuatro preguntas (Ma nishtaná) y buscan el afikomán.",
        "Desde la segunda noche se cuenta el Omer, 49 días hasta Shavuot.",
        "Muchos ashkenazim no comen kitniot (legumbres, arroz, maíz) y muchos sefaradíes sí: seguí la costumbre de tu familia o consultá.",
        "Comprar productos con certificación kosher para Pésaj.",
      ],
      work: "Los dos primeros días y los dos últimos (en Israel, el primero y el séptimo) son iom tov: rigen las prohibiciones de Shabat, salvo lo necesario para cocinar la comida del día. Los días del medio son jol hamoed, con trabajo limitado según la costumbre. La prohibición de jametz rige todos los días de la fiesta.",
      israel: "En la diáspora Pésaj dura ocho días y se hacen dos Sedarim; en Israel dura siete y se hace un solo Séder.",
      startsAt: "sundown",
      blessings: ["bedikat-jametz", "matza-y-maror", "velas-de-iom-tov", "sefirat-haomer", "shehejeianu"],
    },
    // «Pesach I» a «Pesach VIII», sin Pésaj Shení.
    (d) => /^Pesach [IVX]+\b/.test(d),
  ),
  single(
    {
      slug: "iom-hashoa",
      name: "Iom Hashoá",
      hebrew: "יוֹם הַשּׁוֹאָה",
      summary: "El día en que se recuerda a los seis millones de judíos asesinados en la Shoá y a quienes resistieron.",
      hebrewDate: "27 de Nisán (se corre si cae junto a Shabat)",
      kind: "recordacion",
      workShort: "No es iom tov: es un día nacional de recordación en Israel.",
      about: [
        "Iom Hashoá vehagvurá, el día de la Shoá y del heroísmo, recuerda a los seis millones de judíos asesinados por el régimen nazi y sus colaboradores, y a quienes resistieron, como los combatientes del gueto de Varsovia, cuyo levantamiento empezó en la víspera de Pésaj de 1943.",
        "El Estado de Israel lo fijó como día nacional de recordación. Comunidades de todo el mundo, también en Latinoamérica, hacen sus actos ese día.",
      ],
      customs: [
        "En Israel suena una sirena a las 10 de la mañana durante dos minutos y el país se detiene en silencio.",
        "Actos con el encendido de seis velas, una por cada millón de víctimas.",
        "Leer los nombres de las víctimas y escuchar a los sobrevivientes.",
        "Decir Kadish por quienes no tienen quién lo diga.",
        "Algunas comunidades recuerdan a las víctimas en otras fechas, como el 10 de Tevet o Tishá BeAv.",
      ],
      work: "No es iom tov ni tiene restricciones religiosas de trabajo. En Israel, la noche de comienzo cierran por ley los lugares de entretenimiento.",
      israel: "Se recuerda el mismo día en Israel y en la diáspora. Cuando el 27 de Nisán cae viernes, se adelanta al jueves; cuando cae domingo, pasa al lunes.",
      startsAt: "sundown",
      blessings: [],
    },
    is("Yom HaShoah"),
  ),
  single(
    {
      slug: "iom-hazikaron",
      name: "Iom Hazikarón",
      hebrew: "יוֹם הַזִּכָּרוֹן",
      summary: "El día en que Israel recuerda a sus soldados caídos y a las víctimas del terrorismo, en la víspera de Iom Haatzmaut.",
      hebrewDate: "4 de Iyar (se corre si cae junto a Shabat)",
      kind: "recordacion",
      workShort: "No es iom tov: es un día nacional de duelo en Israel.",
      about: [
        "Iom Hazikarón es el día de recordación de los soldados de Israel que cayeron en sus guerras y de las víctimas de atentados terroristas. En un país donde casi todas las familias tienen a alguien a quien recordar, es uno de los días más sentidos del año.",
        "Está puesto, a propósito, justo antes de Iom Haatzmaut: el duelo termina al anochecer y se pasa directamente a celebrar la independencia.",
      ],
      customs: [
        "En Israel suenan dos sirenas, una a la noche de comienzo, de un minuto, y otra a la mañana, de dos minutos. Todo se detiene.",
        "Visitas a los cementerios militares y actos en todo el país.",
        "Banderas a media asta.",
        "En la diáspora, muchas comunidades hacen un acto que une Iom Hazikarón con Iom Haatzmaut.",
      ],
      work: "No es iom tov ni tiene restricciones religiosas de trabajo. En Israel, la noche de comienzo cierran por ley los lugares de entretenimiento.",
      israel: "Se recuerda el mismo día en todo el mundo, siempre la víspera de Iom Haatzmaut: cuando esa fecha se corre para no tocar Shabat, Iom Hazikarón se corre con ella.",
      startsAt: "sundown",
      blessings: [],
    },
    is("Yom HaZikaron"),
  ),
  single(
    {
      slug: "iom-haatzmaut",
      name: "Iom Haatzmaut",
      hebrew: "יוֹם הָעַצְמָאוּת",
      summary: "El aniversario de la independencia del Estado de Israel, declarada el 5 de Iyar de 5708, el 14 de mayo de 1948.",
      hebrewDate: "5 de Iyar (se corre si cae junto a Shabat)",
      kind: "fiesta",
      workShort: "No es iom tov; en Israel es feriado nacional.",
      about: [
        "El 5 de Iyar de 5708, el 14 de mayo de 1948, se declaró en Tel Aviv la independencia del Estado de Israel. Iom Haatzmaut celebra ese aniversario.",
        "Empieza cuando termina Iom Hazikarón, en un paso que une el recuerdo de los caídos con la alegría por el Estado.",
      ],
      customs: [
        "La ceremonia de las antorchas en el monte Herzl, en Jerusalén, la noche de comienzo.",
        "Fuegos artificiales, banderas, actos y espectáculos.",
        "Asados y picnics al aire libre, el mangal, y paseos por el país.",
        "Muchas comunidades agregan oraciones de agradecimiento y algunas dicen Halel; otras no. Seguí la costumbre de tu comunidad.",
      ],
      work: "No es iom tov ni tiene restricciones religiosas de trabajo. En Israel es feriado nacional.",
      israel: "Se celebra el mismo día en todo el mundo. Cuando el 5 de Iyar cae viernes o sábado, se adelanta al jueves; cuando cae lunes, pasa al martes.",
      startsAt: "sundown",
      blessings: ["shehejeianu"],
    },
    is("Yom HaAtzma'ut"),
  ),
  single(
    {
      slug: "lag-baomer",
      name: "Lag Baomer",
      hebrew: "ל״ג בָּעֹמֶר",
      summary: "El día 33 del Omer: una pausa de alegría, con fogatas, en medio de las semanas de duelo entre Pésaj y Shavuot.",
      hebrewDate: "18 de Iyar",
      kind: "fiesta",
      workShort: "No es iom tov: se trabaja con normalidad.",
      about: [
        "Lag Baomer es el día 33 de la cuenta del Omer: las letras ל״ג suman 33. Las semanas entre Pésaj y Shavuot tienen costumbres de duelo porque, según la tradición, en ese período murieron muchos alumnos de Rabí Akiva; Lag Baomer es el día en que esas muertes se detuvieron.",
        "Es también, según la tradición, el aniversario de la muerte de Rabí Shimón bar Iojái, a quien se atribuye el Zohar. En lugar de tristeza, se lo recuerda con alegría.",
      ],
      customs: [
        "Fogatas a la noche, con música y comida.",
        "La peregrinación a Merón, en el norte de Israel, donde está la tumba de Rabí Shimón bar Iojái.",
        "Se levantan por un día las costumbres de duelo del Omer: muchos se casan ese día o se cortan el pelo.",
        "En muchas familias, el primer corte de pelo de los varones de tres años (jalake o upsherin).",
        "Excursiones y juegos al aire libre con los chicos.",
        "No se dice Tajanún.",
      ],
      work: "No es iom tov: no hay restricciones de trabajo.",
      israel: "Es un solo día en todo el mundo.",
      startsAt: "sundown",
      blessings: ["sefirat-haomer"],
    },
    is("Lag BaOmer"),
  ),
  single(
    {
      slug: "shavuot",
      name: "Shavuot",
      hebrew: "שָׁבוּעוֹת",
      summary: "La entrega de la Torá en el monte Sinaí, siete semanas después de Pésaj.",
      hebrewDate: "6 y 7 de Siván (solo el 6 en Israel)",
      kind: "iom-tov",
      workShort: "Iom tov: no se trabaja (dos días en la diáspora, uno en Israel).",
      about: [
        "Shavuot, «semanas», llega al cumplirse las siete semanas del Omer contadas desde Pésaj. Celebra el día en que el pueblo de Israel recibió la Torá en el monte Sinaí: la libertad de Pésaj encuentra su sentido en la Torá.",
        "En la Tierra de Israel era también la fiesta de la cosecha del trigo y de los primeros frutos, los bikurim, que se llevaban al Templo.",
      ],
      customs: [
        "Quedarse estudiando Torá toda la primera noche (tikún leil Shavuot).",
        "Escuchar en la sinagoga la lectura de los Diez Mandamientos.",
        "Comer lácteos: blintzes, tortas de queso y otros platos con leche.",
        "Decorar la casa y la sinagoga con flores y plantas.",
        "Leer la Meguilat Rut, la historia de una mujer que eligió sumarse al pueblo de Israel.",
        "Rezar Izkor el último día de la fiesta.",
      ],
      work: "Es iom tov: rigen las prohibiciones de Shabat, salvo lo necesario para cocinar la comida del día.",
      israel: "En la diáspora dura dos días, el 6 y el 7 de Siván; en Israel, solo el 6.",
      startsAt: "sundown",
      blessings: ["velas-de-iom-tov", "shehejeianu"],
    },
    (d) => /^Shavuot( I| II)?$/.test(d),
  ),
  single(
    {
      slug: "tisha-beav",
      name: "Tishá BeAv",
      hebrew: "תִּשְׁעָה בְּאָב",
      summary: "El día de duelo por la destrucción de los dos Templos de Jerusalén y otras tragedias del pueblo judío, con un ayuno de unas 25 horas.",
      hebrewDate: "9 de Av (si cae en Shabat, pasa al domingo)",
      kind: "ayuno",
      workShort: "No es iom tov, pero se ayuna y se acostumbra no trabajar hasta el mediodía.",
      about: [
        "El 9 de Av fue destruido el primer Templo de Jerusalén, por los babilonios, y siglos después el segundo, por los romanos. La tradición suma otras desgracias ocurridas en esa fecha, y con el tiempo se volvió el día para recordar las persecuciones y expulsiones que sufrió el pueblo judío, como la expulsión de España en 1492.",
        "Es el punto más bajo de las tres semanas de duelo que empiezan el 17 de Tamuz. Aun así, la tradición enseña que de este día va a nacer la redención.",
      ],
      customs: [
        "Ayunar desde la puesta del sol hasta la salida de las estrellas del día siguiente, sin comer ni beber.",
        "No usar calzado de cuero, no lavarse por placer, no usar cremas y abstenerse de relaciones, como en Iom Kipur.",
        "Leer Eijá (Lamentaciones) y las kinot, poemas de duelo, sentados en el piso o en sillas bajas hasta el mediodía.",
        "No saludarse, y estudiar solo temas tristes, como Eijá o Iov.",
        "Los hombres no se ponen talit ni tefilín a la mañana: los ponen en Minjá.",
      ],
      work: "No es iom tov y el trabajo no está prohibido, pero se acostumbra no trabajar, o hacer lo mínimo, hasta el mediodía, para no distraerse del duelo. Las personas enfermas, las embarazadas y las mujeres en lactancia tienen reglas especiales: consultá con tu rabino.",
      israel: "Es un solo día en todo el mundo. Cuando el 9 de Av cae en Shabat, el ayuno pasa al domingo 10 de Av.",
      startsAt: "sundown",
      blessings: [],
    },
    (d) => /^Tish'a B'Av( \(observed\))?$/.test(d),
  ),
  {
    slug: "ayunos-menores",
    name: "Ayunos menores",
    hebrew: "צוֹמוֹת",
    summary: "Ayunos de un día, del amanecer a la salida de las estrellas, que recuerdan la destrucción de Jerusalén y la historia de Ester.",
    hebrewDate: "3 de Tishrei, 10 de Tevet, 13 de Adar y 17 de Tamuz",
    kind: "ayuno",
    workShort: "No son iom tov: se trabaja con normalidad.",
    about: [
      "Además de Iom Kipur y Tishá BeAv, el calendario hebreo tiene ayunos más cortos: empiezan al amanecer (alot hashajar), no la noche anterior, y terminan con la salida de las estrellas. Tres de ellos recuerdan etapas de la destrucción del primer Templo; el cuarto, el ayuno de la reina Ester.",
      "No se trata solo de no comer: son días para reflexionar y hacer teshuvá. En la sinagoga se agregan Slijot, Avinu malkenu y una lectura especial de la Torá.",
    ],
    customs: [
      "No comer ni beber desde el amanecer hasta la salida de las estrellas. Se puede desayunar antes del amanecer si lo decidiste antes de irte a dormir.",
      "Las embarazadas, las mujeres en lactancia y las personas enfermas suelen estar exentas: consultá con tu rabino.",
      "Agregar Anenu en la Amidá y leer Vaiejal en Shajarit y en Minjá.",
    ],
    work: "No son iom tov: no hay restricciones de trabajo.",
    israel: "Se ayuna el mismo día en todo el mundo. Si la fecha cae en Shabat, el ayuno pasa al domingo, salvo el de Ester, que se adelanta al jueves. El 10 de Tevet nunca cae en Shabat.",
    startsAt: "dawn",
    blessings: [],
    parts: [
      {
        key: "tzom-guedalia",
        name: "Ayuno de Guedalia",
        hebrew: "צוֹם גְּדַלְיָה",
        hebrewDate: "3 de Tishrei",
        about:
          "Al día siguiente de Rosh Hashaná. Recuerda el asesinato de Guedalia ben Ajikam, el gobernador judío que quedó en la tierra de Israel después de la destrucción del primer Templo: con su muerte se perdió lo que quedaba de autonomía y siguió el exilio.",
        match: is("Tzom Gedaliah"),
      },
      {
        key: "asara-betevet",
        name: "Ayuno del 10 de Tevet",
        hebrew: "עֲשָׂרָה בְּטֵבֵת",
        hebrewDate: "10 de Tevet",
        about:
          "Recuerda el comienzo del sitio de Jerusalén por Nabucodonosor, rey de Babilonia, que terminó con la destrucción del primer Templo. En Israel es también el día del Kadish general por las víctimas de la Shoá cuya fecha de muerte no se conoce.",
        match: is("Asara B'Tevet"),
      },
      {
        key: "taanit-ester",
        name: "Ayuno de Ester",
        hebrew: "תַּעֲנִית אֶסְתֵּר",
        hebrewDate: "13 de Adar (Adar II en los años bisiestos)",
        about:
          "El día antes de Purim. Recuerda los días de ayuno y oración que Ester pidió al pueblo antes de presentarse ante el rey. Si el 13 de Adar cae en Shabat, se adelanta al jueves.",
        match: is("Ta'anit Esther"),
      },
      {
        key: "17-de-tamuz",
        name: "Ayuno del 17 de Tamuz",
        hebrew: "שִׁבְעָה עָשָׂר בְּתַמּוּז",
        hebrewDate: "17 de Tamuz",
        about:
          "Recuerda el día en que los romanos abrieron una brecha en las murallas de Jerusalén, en el año 70, tres semanas antes de la destrucción del segundo Templo. Según la Mishná, ese mismo día Moshé rompió las primeras Tablas. Con él empiezan las tres semanas de duelo que terminan en Tishá BeAv.",
        match: is("Tzom Tammuz"),
      },
      {
        key: "taanit-bejorot",
        name: "Ayuno de los primogénitos",
        hebrew: "תַּעֲנִית בְּכוֹרוֹת",
        hebrewDate: "14 de Nisán",
        about:
          "En la víspera de Pésaj ayunan los varones primogénitos, en agradecimiento por haberse salvado de la última plaga de Egipto. Es costumbre levantarlo participando esa mañana de un siyum, la celebración por terminar el estudio de un tratado.",
        match: is("Ta'anit Bechorot"),
      },
    ],
  },
];

export function festivalBySlug(slug: string) {
  return FESTIVALS.find((f) => f.slug === slug) ?? null;
}

/** Hasta qué año calculamos las fechas. */
export const LAST_YEAR = 2035;

/** Zona de referencia para decidir qué fecha es «la próxima» (el corte del día). */
const REFERENCE_TZ = "America/Argentina/Buenos_Aires";

export function todayKey(now = new Date()) {
  return dayKey(now, REFERENCE_TZ);
}

export type Occurrence = {
  hebrewYear: number;
  /** Día civil (yyyy-mm-dd) en cuyo atardecer empieza; en los ayunos menores, el mismo día del ayuno. */
  begins: string;
  first: string;
  /** Último día en la diáspora. */
  last: string;
  lastIsrael: string;
  /** Días de iom tov (con restricciones de Shabat) en la diáspora y en Israel. */
  yomTov: string[];
  yomTovIsrael: string[];
  /** «15 de Nisán de 5787». */
  hebrewFirst: string;
};

const eventCache = new Map<string, Event[]>();

function hebrewYearEvents(hebrewYear: number, il: boolean) {
  const key = `${hebrewYear}:${il}`;
  let events = eventCache.get(key);
  if (!events) {
    events = HebrewCalendar.calendar({ year: hebrewYear, isHebrewYear: true, il });
    eventCache.set(key, events);
  }
  return events;
}

/** yyyy-mm-dd con los getters locales: hebcal arma sus fechas a medianoche local del servidor. */
function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(key: string, days: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function daysOf(part: FestivalPart, hebrewYear: number, il: boolean) {
  return hebrewYearEvents(hebrewYear, il)
    .filter((e) => part.match(e.getDesc()))
    .map((e) => ({ key: localKey(e.getDate().greg()), chag: (e.getFlags() & flags.CHAG) !== 0, hd: e.getDate() }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Fechas cuyo primer día cae entre `fromYear` y `toYear` (años civiles, inclusive). */
export function occurrencesOf(festival: Festival, part: FestivalPart = festival.parts[0], fromYear = Number(todayKey().slice(0, 4)), toYear = LAST_YEAR) {
  const out: Occurrence[] = [];
  // Un año civil toca dos años hebreos: el que termina en septiembre y el que empieza.
  for (let hy = fromYear + 3760; hy <= toYear + 3761; hy++) {
    const days = daysOf(part, hy, false);
    const daysIl = daysOf(part, hy, true);
    if (!days.length) continue;
    const first = days[0].key;
    const year = Number(first.slice(0, 4));
    if (year < fromYear || year > toYear) continue;
    const hd = days[0].hd;
    out.push({
      hebrewYear: hy,
      begins: festival.startsAt === "sundown" ? addDays(first, -1) : first,
      first,
      last: days[days.length - 1].key,
      lastIsrael: (daysIl[daysIl.length - 1] ?? days[days.length - 1]).key,
      yomTov: days.filter((d) => d.chag).map((d) => d.key),
      yomTovIsrael: daysIl.filter((d) => d.chag).map((d) => d.key),
      hebrewFirst: `${hd.getDate()} de ${hebrewMonthEs(hd.getMonthName())} de ${hd.getFullYear()}`,
    });
  }
  return out;
}

/** La fecha en curso o la próxima: la primera que todavía no terminó. */
export function nextOccurrence(festival: Festival, part: FestivalPart = festival.parts[0], today = todayKey()) {
  return occurrencesOf(festival, part, Number(today.slice(0, 4)) - 1).find((o) => o.last >= today) ?? null;
}

/** La próxima fecha de la festividad, mirando todas sus partes (para los ayunos menores, el próximo ayuno). */
export function nextOfFestival(festival: Festival, today = todayKey()) {
  return festival.parts
    .map((part) => ({ part, occurrence: nextOccurrence(festival, part, today) }))
    .filter((x): x is { part: FestivalPart; occurrence: Occurrence } => !!x.occurrence)
    .sort((a, b) => a.occurrence.begins.localeCompare(b.occurrence.begins))[0] ?? null;
}

const WEEKDAY = new Intl.DateTimeFormat("es", { weekday: "long", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "UTC" });

/** «miércoles 21 de abril» (y «de 2027» si se pide). */
export function longDate(key: string, withYear = false) {
  const d = new Date(`${key}T12:00:00Z`);
  return `${WEEKDAY.format(d)} ${DAY_MONTH.format(d)}${withYear ? ` de ${key.slice(0, 4)}` : ""}`;
}

const SHORT = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** «mié 21 abr» para listas. */
export function shortDate(key: string) {
  return SHORT.format(new Date(`${key}T12:00:00Z`)).replace(",", "");
}

/** La fecha en una oración, con la aclaración de Israel cuando termina antes. */
export function describeOccurrence(festival: Festival, part: FestivalPart, o: Occurrence) {
  const name = part.name;
  const yearOf = (key: string) => key.slice(0, 4);
  const crossesYear = yearOf(o.begins) !== yearOf(o.last);
  if (festival.startsAt === "dawn") {
    return `En ${yearOf(o.first)}, el ${name} es el ${longDate(o.first)}: se ayuna desde el amanecer hasta la salida de las estrellas.`;
  }
  const start = longDate(o.begins, crossesYear);
  const end = longDate(o.last, true);
  if (festival.slug === "januca") {
    return `En ${yearOf(o.first)}, la primera vela de Janucá se enciende al anochecer del ${start}. La fiesta dura ocho días, hasta el ${end}.`;
  }
  const differs = o.lastIsrael !== o.last;
  const [begin, finish] = festival.plural ? ["empiezan", "terminan"] : ["empieza", "termina"];
  const israel = differs ? ` En Israel ${finish} un día antes, al anochecer del ${longDate(o.lastIsrael)}.` : "";
  return `En ${yearOf(o.first)}, ${name} ${begin} al atardecer del ${start} y ${finish} al anochecer del ${end}${differs ? " en la diáspora" : ""}.${israel}`;
}

const NUMBERS: Record<number, string> = { 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco", 6: "seis", 7: "siete", 8: "ocho" };

/** Cuántos días dura, en la diáspora y en Israel. */
export function durationText(festival: Festival, o: Occurrence) {
  const days = daysBetween(o.first, o.last) + 1;
  const daysIl = daysBetween(o.first, o.lastIsrael) + 1;
  const n = (k: number) => (k === 1 ? "un día" : `${NUMBERS[k] ?? k} días`);
  const lasts = festival.plural ? "duran" : "dura";
  if (days === daysIl) return `${festival.name} ${lasts} ${n(days)}, en Israel y en la diáspora.`;
  return `En la diáspora ${festival.name} ${lasts} ${n(days)}; en Israel, ${n(daysIl)}.`;
}

/** «desde el atardecer del vie 4 dic» / «dom 20 dic, del amanecer a la noche»: para listas y tablas. */
export function occurrenceShort(festival: Festival, o: Occurrence) {
  if (festival.startsAt === "dawn") return `${shortDate(o.first)}, del amanecer a la noche`;
  if (festival.slug === "januca") return `primera vela el ${shortDate(o.begins)} a la noche`;
  return `desde el atardecer del ${shortDate(o.begins)}`;
}

export type Faq = { q: string; a: string };

/** Preguntas frecuentes con las fechas calculadas: «¿Cuándo es Pésaj 2027?» y las de trabajo y duración. */
export function festivalFaq(festival: Festival, today = todayKey()): Faq[] {
  const faq: Faq[] = [];
  const multi = festival.parts.length > 1;
  const verb = festival.plural ? "son" : "es";
  for (const part of festival.parts) {
    const upcoming = occurrencesOf(festival, part, Number(today.slice(0, 4)) - 1)
      .filter((o) => o.last >= today)
      .slice(0, multi ? 1 : 2);
    for (const o of upcoming) {
      faq.push({ q: `¿Cuándo ${verb} ${multi ? `el ${part.name}` : part.name} ${o.first.slice(0, 4)}?`, a: describeOccurrence(festival, part, o) });
    }
  }
  faq.push({ q: `¿Se trabaja en ${multi ? "los ayunos menores" : festival.name}?`, a: festival.work });
  const next = nextOccurrence(festival, festival.parts[0], today);
  if (multi) {
    faq.push({
      q: "¿A qué hora empieza y termina un ayuno menor?",
      a: "Empieza al amanecer (alot hashajar) y termina con la salida de las estrellas (tzet hakojavim). Los horarios exactos de tu ciudad están en el calendario de Mercav Kosher.",
    });
  } else if (next) {
    faq.push({
      q: `¿Cuántos días ${festival.plural ? "duran" : "dura"} ${festival.name}?`,
      a: `${durationText(festival, next)} Como en todo el calendario hebreo, cada día empieza al atardecer del anterior y termina al anochecer.`,
    });
  }
  return faq;
}

/** Para enlazar un evento de hebcal con su página (calendario e .ics). Las vísperas («Erev …») van a la fiesta. */
export function festivalSlugForDesc(desc: string) {
  const clean = desc.replace(/^Erev /, "");
  if (EXTRA_DESCS[clean]) return EXTRA_DESCS[clean];
  for (const f of FESTIVALS) if (f.parts.some((p) => p.match(clean))) return f.slug;
  return null;
}

/** Descripciones de hebcal que no son días de la fiesta pero la anuncian: vísperas y días vecinos. */
const EXTRA_DESCS: Record<string, string> = {
  "Rosh Hashana": "rosh-hashana",
  "Yom Kippur": "iom-kipur",
  Sukkot: "sucot",
  Pesach: "pesaj",
  Shavuot: "shavuot",
  "Tish'a B'Av": "tisha-beav",
  "Shushan Purim": "purim",
  "Chanukah: 1 Candle": "januca",
};
// creado por pato dev y askforvini
