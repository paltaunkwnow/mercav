/**
 * Nombres en español del calendario hebreo. Una sola tabla para el calendario (jewish.ts), Kosher
 * (lib/kosher/zmanim.ts) y el cliente. Sin dependencias: se puede importar desde "use client".
 */

/** Meses como los devuelve hebcal (HDate.getMonthName) → como los escribimos en Mercav. */
const MONTHS_HEBCAL: Record<string, string> = {
  Tishrei: "Tishrei",
  Cheshvan: "Jeshván",
  Kislev: "Kislev",
  Tevet: "Tevet",
  "Sh'vat": "Shvat",
  Adar: "Adar",
  "Adar I": "Adar I",
  "Adar II": "Adar II",
  Nisan: "Nisán",
  Iyyar: "Iyar",
  Sivan: "Siván",
  Tamuz: "Tamuz",
  Av: "Av",
  Elul: "Elul",
};

/** Meses como los devuelve Intl con el calendario "hebrew" (en minúscula) → como los escribimos en Mercav. */
const MONTHS_INTL: Record<string, string> = {
  tishri: "Tishrei",
  heshvan: "Jeshván",
  kislev: "Kislev",
  tevet: "Tevet",
  shevat: "Shvat",
  "adar i": "Adar I",
  "adar ii": "Adar II",
  adar: "Adar",
  nisan: "Nisán",
  iyar: "Iyar",
  sivan: "Siván",
  tamuz: "Tamuz",
  av: "Av",
  elul: "Elul",
};

/** Mes hebreo en español, venga de hebcal ("Sh'vat") o de Intl ("shevat"). */
export function hebrewMonthEs(name: string) {
  return MONTHS_HEBCAL[name] ?? MONTHS_INTL[name.toLowerCase()] ?? name;
}

/** Fiestas y ayunos por su nombre en hebcal (sin día) → español. */
export const HEBREW_HOLIDAYS_ES: Record<string, string> = {
  "Rosh Hashana": "Rosh Hashaná",
  "Rosh Hashana LaBehemot": "Rosh Hashaná LaBehemot",
  "Yom Kippur": "Iom Kipur",
  Sukkot: "Sucot",
  "Shmini Atzeret": "Shminí Atzeret",
  "Simchat Torah": "Simjat Torá",
  Pesach: "Pésaj",
  "Pesach Sheni": "Pésaj Shení",
  Shavuot: "Shavuot",
  Chanukah: "Janucá",
  Purim: "Purim",
  "Shushan Purim": "Shushán Purim",
  "Purim Katan": "Purim Katán",
  "Shushan Purim Katan": "Shushán Purim Katán",
  "Tu BiShvat": "Tu Bishvat",
  "Lag BaOmer": "Lag Baomer",
  "Tu B'Av": "Tu Beav",
  "Tzom Gedaliah": "Ayuno de Guedalia",
  "Asara B'Tevet": "Ayuno del 10 de Tevet",
  "Ta'anit Esther": "Ayuno de Ester",
  "Ta'anit Bechorot": "Ayuno de los primogénitos",
  "Tzom Tammuz": "Ayuno del 17 de Tamuz",
  "Tish'a B'Av": "Tishá BeAv",
  "Yom HaShoah": "Iom Hashoá",
  "Yom HaZikaron": "Iom Hazikarón",
  "Yom HaAtzma'ut": "Iom Haatzmaut",
  "Yom Yerushalayim": "Iom Ierushalaim",
  "Leil Selichot": "Noche de Slijot",
};

/** Días puntuales que hebcal escribe con número romano o aclaración. */
const PATTERNS: [RegExp, string][] = [
  [/^Rosh Hashana II$/, "Rosh Hashaná (2.º día)"],
  [/^Rosh Hashana (\d+)$/, "Rosh Hashaná $1"],
  [/^Sukkot VII \(Hoshana Raba\)$/, "Hoshaná Rabá"],
  [/^Sukkot I$/, "Sucot (1.er día)"],
  [/^Sukkot II$/, "Sucot (2.º día)"],
  [/^Sukkot [IVX]+ \(CH''M\)$/, "Sucot · Jol Hamoed"],
  [/^Pesach I$/, "Pésaj (1.er día)"],
  [/^Pesach II$/, "Pésaj (2.º día)"],
  [/^Pesach [IVX]+ \(CH''M\)$/, "Pésaj · Jol Hamoed"],
  [/^Pesach VII$/, "Pésaj (7.º día)"],
  [/^Pesach VIII$/, "Pésaj (8.º día)"],
  [/^Shavuot I$/, "Shavuot (1.er día)"],
  [/^Shavuot II$/, "Shavuot (2.º día)"],
  [/^Chanukah: 8th Day$/, "Janucá: 8.º día"],
  [/^Chanukah: (\d) Candles?$/, "Janucá: $1.ª vela"],
  // Cuando el 9 de Av cae en Shabat, el ayuno pasa al domingo.
  [/^Tish'a B'Av \(observed\)$/, "Tishá BeAv (postergado)"],
];

/** Nombre en español de una fecha del calendario hebreo (descripción de hebcal, sin "Erev" ni "Parashat"). */
export function spanishHebrewName(desc: string) {
  for (const [re, to] of PATTERNS) if (re.test(desc)) return desc.replace(re, to);
  if (HEBREW_HOLIDAYS_ES[desc]) return HEBREW_HOLIDAYS_ES[desc];
  if (desc.startsWith("Rosh Chodesh ")) return `Rosh Jodesh ${hebrewMonthEs(desc.slice("Rosh Chodesh ".length))}`;
  return desc;
}
// creado por pato dev y askforvini
